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
  apiKey: "AIzaSyDNU6TFln82cdQ_hKyLw4q0f1PwuuXqwik",
  authDomain: "imahima-adb1a.firebaseapp.com",
  projectId: "imahima-adb1a",
  storageBucket: "imahima-adb1a.firebasestorage.app",
  messagingSenderId: "56241698411",
  appId: "1:56241698411:web:3999f0a77e597951c8e32e",
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
