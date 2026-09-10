import { initializeApp } from "firebase/app";
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

// ▼▼▼ ここをFirebaseコンソールでコピーした値に置き換えてください ▼▼▼
// Firebaseコンソール → プロジェクトの設定 → 全般 → マイアプリ → ウェブアプリの「SDK の設定と構成」からコピーできます
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
// ▲▲▲ ここまで ▲▲▲

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// presence コレクション: ドキュメントIDは `${roomCode}_${userId}`
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
  } catch (e) {}
}

export async function deletePresence(roomCode, userId) {
  try {
    await deleteDoc(presenceDocRef(roomCode, userId));
  } catch (e) {}
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
