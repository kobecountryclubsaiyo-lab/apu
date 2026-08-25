import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
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
