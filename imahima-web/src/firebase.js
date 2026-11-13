import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADuv26c7V8zYxiCliN_IcUZNJf6qOwaao",
  authDomain: "imahima-4154b.firebaseapp.com",
  projectId: "imahima-4154b",
  storageBucket: "imahima-4154b.firebasestorage.app",
  messagingSenderId: "241851487584",
  appId: "1:241851487584:web:42a73b20642d1577137a05",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 匿名認証: ログイン画面なしで自動的にサインインされる。
// これにより「自分のpresence/invitesは自分にしか書き換え・削除できない」をFirestoreルール側で保証できる
// (サンプルの友達を置く機能だけは特別に、doc IDが `_demo-` を含むものに限り許可する)。
export function trySignInAnonymously() {
  window.__authError = null;
  return signInAnonymously(auth).catch((e) => {
    // 失敗した場合はApp.jsx側のタイムアウト処理でエラーバナーが出る。
    // デバッグ用に、window.__authError にエラー内容を残しておく。
    window.__authError = `${e.code || ""} ${e.message || e}`.trim();
  });
}
trySignInAnonymously();

export { onAuthStateChanged };

// presence コレクション: ドキュメントIDは `${roomCode}_${userId}`(userIdはFirebase匿名認証のuid、またはサンプル用の固定ID)
const presenceDocRef = (roomCode, userId) => doc(db, "presence", `${roomCode}_${userId}`);

export async function getMyPresence(roomCode, userId) {
  try {
    const snap = await getDoc(presenceDocRef(roomCode, userId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    return null;
  }
}

export async function setPresence(roomCode, userId, data) {
  try {
    await setDoc(presenceDocRef(roomCode, userId), { ...data, roomCode, userId });
    return true;
  } catch (e) {
    return false;
  }
}

export async function deletePresence(roomCode, userId) {
  try {
    await deleteDoc(presenceDocRef(roomCode, userId));
    return true;
  } catch (e) {
    return false;
  }
}

export async function listPresence(roomCode) {
  try {
    const q = query(collection(db, "presence"), where("roomCode", "==", roomCode));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (e) {
    return [];
  }
}

// invites コレクション: 「一緒にヒマしよ」の誘い。ドキュメントIDは自動採番
const invitesColRef = () => collection(db, "invites");

export async function sendInvite(roomCode, fromMe, toUserId, message) {
  try {
    await addDoc(invitesColRef(), {
      roomCode,
      fromUserId: fromMe.userId,
      fromName: fromMe.name,
      fromAvatar: fromMe.avatar,
      fromColor: fromMe.color,
      toUserId,
      message: message || "一緒にヒマしよ",
      status: "pending", // pending | accepted | declined
      read: false,
      createdAt: Date.now(),
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function listMyInvites(roomCode, userId) {
  try {
    const q = query(
      invitesColRef(),
      where("roomCode", "==", roomCode),
      where("toUserId", "==", userId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (e) {
    return [];
  }
}

export async function markInviteRead(inviteId) {
  try {
    await updateDoc(doc(db, "invites", inviteId), { read: true });
  } catch (e) {}
}

export async function respondInvite(inviteId, status) {
  try {
    await updateDoc(doc(db, "invites", inviteId), { status, read: true });
  } catch (e) {}
}

// members コレクション: 承認済みのグループ参加者。ドキュメントIDは `${roomCode}_${userId}`
const memberDocRef = (roomCode, userId) => doc(db, "members", `${roomCode}_${userId}`);

export async function getMembership(roomCode, userId) {
  try {
    const snap = await getDoc(memberDocRef(roomCode, userId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    return null;
  }
}

// rooms コレクション: そのグループコードが「作成済み」であることを示すマーカー。
// これが存在しないグループコードだけ、誰でも最初のメンバーとして自己登録できる
// (作成直後の、新しく生成したランダムコード用。以降は承認フロー必須)。
const roomDocRef = (roomCode) => doc(db, "rooms", roomCode);

// グループを新しく作る: 作成者は自分自身を最初のメンバーとして登録し、
// 直後にroomsマーカーを作ってこのコードを「作成済み」にする(以降は承認制になる)
export async function createRoomAsOwner(roomCode, me) {
  try {
    await setDoc(memberDocRef(roomCode, me.userId), {
      roomCode,
      userId: me.userId,
      name: me.name,
      avatar: me.avatar,
      color: me.color,
      joinedAt: Date.now(),
      approvedBy: me.userId, // 自分自身(作成者)
    });
    await setDoc(roomDocRef(roomCode), {
      roomCode,
      createdBy: me.userId,
      createdAt: Date.now(),
    });
    return true;
  } catch (e) {
    return false;
  }
}

// joinRequests コレクション: 参加申請。ドキュメントIDは `${roomCode}_${userId}`(1人1申請)
const joinRequestDocRef = (roomCode, userId) => doc(db, "joinRequests", `${roomCode}_${userId}`);

export async function requestToJoin(roomCode, me) {
  try {
    await setDoc(joinRequestDocRef(roomCode, me.userId), {
      roomCode,
      userId: me.userId,
      name: me.name,
      avatar: me.avatar,
      color: me.color,
      status: "pending", // pending | approved | declined
      requestedAt: Date.now(),
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function getMyJoinRequest(roomCode, userId) {
  try {
    const snap = await getDoc(joinRequestDocRef(roomCode, userId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    return null;
  }
}

export async function listPendingJoinRequests(roomCode) {
  try {
    const q = query(
      collection(db, "joinRequests"),
      where("roomCode", "==", roomCode),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.requestedAt || 0) - (b.requestedAt || 0));
  } catch (e) {
    return [];
  }
}

// 既存メンバーの誰でも承認できる(作成者1人に権限を集中させない)
export async function approveJoinRequest(request, approverUid) {
  try {
    await setDoc(memberDocRef(request.roomCode, request.userId), {
      roomCode: request.roomCode,
      userId: request.userId,
      name: request.name,
      avatar: request.avatar,
      color: request.color,
      joinedAt: Date.now(),
      approvedBy: approverUid,
    });
    await updateDoc(joinRequestDocRef(request.roomCode, request.userId), { status: "approved" });
    return true;
  } catch (e) {
    return false;
  }
}

export async function declineJoinRequest(request) {
  try {
    await updateDoc(joinRequestDocRef(request.roomCode, request.userId), { status: "declined" });
    return true;
  } catch (e) {
    return false;
  }
}
