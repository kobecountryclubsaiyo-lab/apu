import React, { useState, useEffect, useRef, useCallback } from "react";
import { Map as MapIcon, List, X, Send, Users, Clock, RefreshCw, Pencil, MapPin, Copy, Bell, Check, WifiOff, Share2 } from "lucide-react";
import {
  auth,
  onAuthStateChanged,
  getMyPresence,
  setPresence,
  deletePresence,
  listPresence,
  sendInvite as sendInviteApi,
  listMyInvites,
  markInviteRead,
  respondInvite,
} from "./firebase.js";
import MapView from "./MapView.jsx";

const INK = "#241B2F";
const CREAM = "#FFF8ED";
const CORAL = "#FF6B4A";
const TEAL = "#3FA796";
const GOLD = "#F5C84C";
const DUST = "#B9B0C9";

const AVATARS = ["🐱", "🐻", "🦊", "🐼", "🐰", "🐨"];
const AVATAR_COLORS = [CORAL, TEAL, GOLD, "#8B7FD1", "#5EA8D9", "#E8879A"];

const IDLE_LIMIT_MS = 5 * 60 * 1000; // 5分 動きもアクションもなければ自動オフ
const MOVE_THRESHOLD_M = 15; // GPSの揺れを無視する閾値
const HEARTBEAT_MS = 20000;
const POLL_MS = 10000;
const ME_KEY = "imahima-me";
const AUTH_TIMEOUT_MS = 3000;

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDistance(m) {
  if (m == null) return "距離不明";
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

function fmtAgo(ts) {
  if (!ts) return "";
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "たった今";
  return `${min}分前`;
}

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 0/O, 1/I抜き
function genRoomCode() {
  let out = "";
  for (let i = 0; i < 6; i++) out += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  return out;
}

function loadMe() {
  try {
    const raw = localStorage.getItem(ME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function persistMe(nextMe) {
  try {
    localStorage.setItem(ME_KEY, JSON.stringify(nextMe));
  } catch (e) {}
}

export default function App() {
  const [meLoaded, setMeLoaded] = useState(false);
  const [me, setMe] = useState(null); // { name, avatar, color, roomCode } ※userIdはFirebase匿名認証のuidを別途使う
  const [authState, setAuthState] = useState("pending"); // pending | ready | failed
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftAvatarIdx, setDraftAvatarIdx] = useState(0);
  const [onboardStep, setOnboardStep] = useState("profile"); // profile | room
  const [draftRoomMode, setDraftRoomMode] = useState("create"); // create | join
  const [draftRoomCode, setDraftRoomCode] = useState("");
  const [switchCodeInput, setSwitchCodeInput] = useState("");

  const [hima, setHima] = useState(false);
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | requesting | granted | denied | unsupported
  const [selfCoords, setSelfCoords] = useState(null);
  const [message, setMessage] = useState("");
  const [lastActivityAt, setLastActivityAt] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showA2HS, setShowA2HS] = useState(false);

  const [view, setView] = useState("list");
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [invites, setInvites] = useState([]);
  const [showInvites, setShowInvites] = useState(false);
  const [toast, setToast] = useState(null);
  const [, forceTick] = useState(0);

  const watchIdRef = useRef(null);
  const heartbeatRef = useRef(null);
  const pollRef = useRef(null);
  const lastMovementAtRef = useRef(Date.now());
  const lastActionAtRef = useRef(Date.now());
  const lastMoveCoordsRef = useRef(null);
  const selfCoordsRef = useRef(null);
  const messageRef = useRef("");
  const meRef = useRef(null); // { name, avatar, color, roomCode, userId } 実行時に合成
  const himaRef = useRef(false);
  const resumeCheckedRef = useRef(false);

  useEffect(() => { selfCoordsRef.current = selfCoords; }, [selfCoords]);
  useEffect(() => { messageRef.current = message; }, [message]);
  useEffect(() => { himaRef.current = hima; }, [hima]);
  useEffect(() => {
    meRef.current = me && firebaseUid ? { ...me, userId: firebaseUid } : null;
  }, [me, firebaseUid]);

  // Firebase匿名認証の状態を監視
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUid(user.uid);
        setAuthState("ready");
      }
    });
    const t = setTimeout(() => {
      setAuthState((s) => (s === "pending" ? "failed" : s));
    }, AUTH_TIMEOUT_MS);
    return () => { unsub(); clearTimeout(t); };
  }, []);

  // プロフィール(名前・アイコン・グループコード)をlocalStorageから読み込み
  useEffect(() => {
    const stored = loadMe();
    if (stored) setMe(stored);
    else setShowOnboarding(true);
    setMeLoaded(true);
  }, []);

  // 認証とプロフィールが揃ったら、直前まで「ヒマ中」だった場合に復元する
  useEffect(() => {
    if (resumeCheckedRef.current) return;
    if (!me || !firebaseUid || !me.roomCode) return;
    resumeCheckedRef.current = true;
    (async () => {
      const existing = await getMyPresence(me.roomCode, firebaseUid);
      if (existing && Date.now() - (existing.lastActivityAt || 0) < IDLE_LIMIT_MS) {
        const coords = existing.lat != null ? { lat: existing.lat, lng: existing.lng } : null;
        setSelfCoords(coords);
        lastMoveCoordsRef.current = coords;
        lastMovementAtRef.current = existing.lastActivityAt;
        lastActionAtRef.current = existing.lastActivityAt;
        setLastActivityAt(existing.lastActivityAt);
        setMessage(existing.message || "");
        setGeoStatus(coords ? "granted" : "idle");
        setHima(true);
        if (coords) startWatch();
        startHeartbeat();
        setToast("さっきのヒマ状態を復元したよ");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, firebaseUid]);

  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // オンライン/オフライン監視
  useEffect(() => {
    const onOnline = () => { setIsOnline(true); setToast("オンラインに戻ったよ"); };
    const onOffline = () => { setIsOnline(false); setToast("オフラインみたい。通信環境を確認してね"); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // iOS Safariでホーム画面未追加なら「ホーム画面に追加」を案内する
  useEffect(() => {
    const standalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("imahima-a2hs-dismissed") === "1";
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!standalone && !dismissed && isIOS) setShowA2HS(true);
  }, []);

  const dismissA2HS = () => {
    setShowA2HS(false);
    try { localStorage.setItem("imahima-a2hs-dismissed", "1"); } catch (e) {}
  };

  const markAction = useCallback(() => {
    lastActionAtRef.current = Date.now();
    if (himaRef.current) setLastActivityAt(Date.now());
  }, []);

  const saveMe = async (nextMe) => {
    persistMe(nextMe);
    setMe(nextMe);
  };

  const goToRoomStep = () => {
    if (!draftRoomCode) setDraftRoomCode(genRoomCode());
    setOnboardStep("room");
  };

  const pickCreateMode = () => {
    setDraftRoomMode("create");
    if (!draftRoomCode) setDraftRoomCode(genRoomCode());
  };

  const pickJoinMode = () => {
    setDraftRoomMode("join");
    setDraftRoomCode("");
  };

  const finishOnboarding = async () => {
    const code = draftRoomCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setToast("グループコードを確認してね");
      return;
    }
    const nextMe = {
      name: draftName.trim() || "名無しさん",
      avatar: AVATARS[draftAvatarIdx],
      color: AVATAR_COLORS[draftAvatarIdx],
      roomCode: code,
    };
    await saveMe(nextMe);
    setShowOnboarding(false);
    setToast(
      draftRoomMode === "create"
        ? `グループを作ったよ。コード「${code}」を友達に送ってね`
        : `「${code}」のグループに参加したよ`
    );
  };

  const openEdit = () => {
    if (!me) return;
    setDraftName(me.name);
    setDraftAvatarIdx(Math.max(0, AVATARS.indexOf(me.avatar)));
    setSwitchCodeInput("");
    setShowEdit(true);
  };

  const saveEdit = async () => {
    const nextMe = {
      ...me,
      name: draftName.trim() || me.name,
      avatar: AVATARS[draftAvatarIdx],
      color: AVATAR_COLORS[draftAvatarIdx],
    };
    await saveMe(nextMe);
    setShowEdit(false);
    if (himaRef.current) await broadcastStatus(selfCoordsRef.current);
  };

  const copyRoomCode = async () => {
    const code = meRef.current?.roomCode || "";
    try {
      await navigator.clipboard.writeText(code);
      setToast("コードをコピーしたよ 📋");
    } catch (e) {
      setToast(`コード: ${code}`);
    }
    markAction();
  };

  const switchRoom = async (rawCode) => {
    const code = rawCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setToast("コードを確認してね");
      return;
    }
    if (himaRef.current) await stopHima();
    const nextMe = { ...meRef.current, roomCode: code };
    delete nextMe.userId; // userIdはlocalStorageに保存しない(常にFirebase認証由来)
    await saveMe(nextMe);
    setSwitchCodeInput("");
    setToast(`「${code}」のグループに切り替えたよ`);
  };

  const broadcastStatus = async (coords) => {
    if (!meRef.current) return;
    const payload = {
      name: meRef.current.name,
      avatar: meRef.current.avatar,
      color: meRef.current.color,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      message: messageRef.current,
      lastActivityAt: Math.max(lastMovementAtRef.current, lastActionAtRef.current),
    };
    const ok = await setPresence(meRef.current.roomCode, meRef.current.userId, payload);
    if (!ok) setToast("通信がうまくいかなかったみたい。あとで自動的に再送するよ");
  };

  const removeStatus = async () => {
    if (!meRef.current) return;
    await deletePresence(meRef.current.roomCode, meRef.current.userId);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(() => {
      const idle = Date.now() - Math.max(lastMovementAtRef.current, lastActionAtRef.current);
      if (idle > IDLE_LIMIT_MS) {
        stopHima("5分間うごきがなかったから、ヒマ状態を自動でオフにしたよ 💤");
        return;
      }
      broadcastStatus(selfCoordsRef.current);
    }, HEARTBEAT_MS);
  };

  const stopWatch = () => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handleWatchError = (err) => {
    if (err && err.code === 1) {
      // PERMISSION_DENIED (許可が途中で取り消された)
      stopHima("位置情報の許可が取り消されたみたい。ヒマ状態をオフにしたよ");
    } else {
      setToast("電波状況が悪いかも。位置情報の更新が遅れることがあるよ");
    }
  };

  const startWatch = () => {
    stopWatch();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setSelfCoords(coords);
        const last = lastMoveCoordsRef.current;
        if (!last || haversineM(last.lat, last.lng, coords.lat, coords.lng) > MOVE_THRESHOLD_M) {
          lastMovementAtRef.current = Date.now();
          lastMoveCoordsRef.current = coords;
          setLastActivityAt(Date.now());
        }
      },
      handleWatchError,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  };

  const stopHima = useCallback(async (toastMsg) => {
    setHima(false);
    stopWatch();
    stopHeartbeat();
    await removeStatus();
    if (toastMsg) setToast(toastMsg);
  }, []);

  const startHima = () => {
    markAction();
    if (authState !== "ready") {
      setToast("認証の準備中だよ。少し待ってからもう一度試してね");
      return;
    }
    if (!("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      setToast("この端末では位置情報が使えないみたい");
      return;
    }
    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setSelfCoords(coords);
        lastMoveCoordsRef.current = coords;
        lastMovementAtRef.current = Date.now();
        lastActionAtRef.current = Date.now();
        setLastActivityAt(Date.now());
        setGeoStatus("granted");
        setHima(true);
        broadcastStatus(coords);
        startWatch();
        startHeartbeat();
        setToast("現在地を友達に公開したよ 📍");
      },
      () => {
        setGeoStatus("denied");
        setToast("位置情報の許可がないとヒマ機能は使えないよ");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleToggle = () => {
    markAction();
    if (hima) {
      stopHima("非公開にしたよ");
    } else {
      startHima();
    }
  };

  // poll friends' Firestore statuses (scoped to our room code only)
  useEffect(() => {
    if (!me || !firebaseUid || !me.roomCode) return;
    const poll = async () => {
      const all = await listPresence(me.roomCode);
      const now = Date.now();
      const others = all.filter(
        (p) => p.userId !== firebaseUid && now - (p.lastActivityAt || 0) < IDLE_LIMIT_MS
      );
      setFriends(others);
    };
    poll();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [me, firebaseUid]);

  useEffect(() => {
    return () => {
      stopWatch();
      stopHeartbeat();
    };
  }, []);

  const addDemoFriends = async () => {
    if (!meRef.current?.roomCode) return;
    const base = selfCoordsRef.current || { lat: 35.681236, lng: 139.767125 };
    const demo = [
      { id: "demo-yui", name: "ゆい(サンプル)", avatar: "🐱", color: CORAL, dlat: 0.003, dlng: 0.004, msg: "駅前のカフェでまったり中" },
      { id: "demo-takumi", name: "たくみ(サンプル)", avatar: "🐻", color: TEAL, dlat: -0.006, dlng: 0.008, msg: "暇すぎる…誰か遊ぼ" },
      { id: "demo-sho", name: "しょう(サンプル)", avatar: "🐼", color: GOLD, dlat: -0.02, dlng: -0.015, msg: "駅前でヒマしてるよ〜" },
    ];
    for (const d of demo) {
      const payload = {
        name: d.name, avatar: d.avatar, color: d.color,
        lat: base.lat + d.dlat, lng: base.lng + d.dlng,
        message: d.msg, lastActivityAt: Date.now(),
      };
      await setPresence(meRef.current.roomCode, d.id, payload);
    }
    setToast("サンプルの友達を3人置いたよ(5分で自然に消えるよ)");
    markAction();
  };

  // poll invites addressed to me (scoped to our room code only)
  useEffect(() => {
    if (!me || !firebaseUid || !me.roomCode) return;
    const seenIds = new Set();
    let first = true;
    const poll = async () => {
      const list = await listMyInvites(me.roomCode, firebaseUid);
      if (first) {
        list.forEach((inv) => seenIds.add(inv.id));
        first = false;
      } else {
        for (const inv of list) {
          if (inv.status === "pending" && !seenIds.has(inv.id)) {
            seenIds.add(inv.id);
            setToast(`${inv.fromAvatar} ${inv.fromName}が「一緒にヒマしよ」って誘ってるよ 💌`);
          }
        }
      }
      setInvites(list);
    };
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [me, firebaseUid]);

  const withDist = friends.map((f) => {
    const dist = selfCoords && f.lat != null && f.lng != null
      ? haversineM(selfCoords.lat, selfCoords.lng, f.lat, f.lng)
      : null;
    return { ...f, dist };
  }).sort((a, b) => (a.dist ?? 1e9) - (b.dist ?? 1e9));

  const pendingInvites = invites.filter((i) => i.status === "pending");
  const unreadInviteCount = invites.filter((i) => !i.read).length;

  const handleSendInvite = async (friend) => {
    setSelectedFriend(null);
    markAction();
    const ok = await sendInviteApi(meRef.current.roomCode, meRef.current, friend.userId);
    setToast(ok ? `${friend.name} に「一緒にヒマしよ」を送ったよ 📮` : "送信に失敗しちゃった…もう一度試してね");
  };

  const openInvites = async () => {
    markAction();
    setShowInvites(true);
    const unread = invites.filter((i) => !i.read);
    if (unread.length === 0) return;
    setInvites((prev) => prev.map((i) => ({ ...i, read: true })));
    await Promise.all(unread.map((inv) => markInviteRead(inv.id)));
  };

  const handleRespondInvite = async (invite, status) => {
    markAction();
    setInvites((prev) => prev.map((i) => (i.id === invite.id ? { ...i, status, read: true } : i)));
    await respondInvite(invite.id, status);
    setToast(status === "accepted" ? `${invite.fromName}に「のった!」を伝えたよ 🙌` : `${invite.fromName}に伝えたよ`);
  };

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ backgroundColor: "#E9E4D8" }} onClick={markAction}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap');
        .zen-maru { font-family: 'Zen Maru Gothic', sans-serif; }
        .zen-kaku { font-family: 'Zen Kaku Gothic New', sans-serif; }
        @keyframes glowPulse { 0% { box-shadow: 0 0 0 0 rgba(255,107,74,0.45); } 70% { box-shadow: 0 0 0 14px rgba(255,107,74,0); } 100% { box-shadow: 0 0 0 0 rgba(255,107,74,0); } }
        @keyframes sheetUp { from { transform: translateY(100%);} to { transform: translateY(0);} }
        @keyframes toastDrop { from { transform: translate(-50%,-16px); opacity: 0;} to { transform: translate(-50%,0); opacity: 1;} }
        @keyframes modalIn { from { transform: scale(0.94); opacity: 0;} to { transform: scale(1); opacity: 1;} }
        .glow-anim { animation: glowPulse 2s infinite; }
        .sheet-anim { animation: sheetUp 0.25s ease-out; }
        .toast-anim { animation: toastDrop 0.25s ease-out; }
        .modal-anim { animation: modalIn 0.18s ease-out; }
      `}</style>

      <div className="w-full flex flex-col relative overflow-hidden shadow-lg" style={{ maxWidth: 430, backgroundColor: CREAM, minHeight: "100vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4" style={{ backgroundColor: INK }}>
          <button onClick={openEdit} className="flex items-center gap-2 text-left">
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="zen-maru text-2xl" style={{ color: CREAM }}>今ヒマ</h1>
                <Pencil size={12} color={DUST} />
              </div>
              <p className="zen-kaku text-xs mt-0.5" style={{ color: DUST }}>
                {me ? `${me.avatar} ${me.name}` : "友達のヒマ、見つけよう"}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1.5">
            {!isOnline && (
              <div className="p-2 rounded-full" style={{ backgroundColor: "#4a2f33" }}>
                <WifiOff size={13} color="#FFD3D3" />
              </div>
            )}
            <button onClick={openInvites} className="relative p-2 rounded-full" style={{ backgroundColor: "#332942" }}>
              <Bell size={13} color={DUST} />
              {unreadInviteCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center rounded-full zen-kaku"
                  style={{ width: 15, height: 15, backgroundColor: CORAL, color: CREAM, fontSize: 9, fontWeight: 700 }}
                >
                  {unreadInviteCount}
                </span>
              )}
            </button>
            <button onClick={() => { markAction(); setFriends((f) => [...f]); }} className="p-2 rounded-full" style={{ backgroundColor: "#332942" }}>
              <RefreshCw size={13} color={DUST} />
            </button>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: "#332942" }}>
              <Users size={14} color={GOLD} />
              <span className="zen-kaku text-xs font-bold" style={{ color: CREAM }}>{withDist.length}人ヒマ中</span>
            </div>
          </div>
        </div>

        {/* Room code bar */}
        {me && (
          <div className="flex items-center justify-between px-5 pb-3" style={{ backgroundColor: INK }}>
            <span className="zen-kaku text-[11px]" style={{ color: DUST }}>このグループのコード</span>
            <button onClick={copyRoomCode} className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: "#332942" }}>
              <span className="zen-kaku text-xs font-bold" style={{ color: GOLD, letterSpacing: 2 }}>{me.roomCode}</span>
              <Copy size={12} color={DUST} />
            </button>
          </div>
        )}

        {showA2HS && (
          <div className="flex items-center gap-3 px-5 py-3" style={{ backgroundColor: "#332942" }}>
            <Share2 size={16} color={GOLD} />
            <p className="zen-kaku text-[11px] flex-1" style={{ color: CREAM }}>
              共有ボタンから<span className="font-bold">「ホーム画面に追加」</span>すると、アプリみたいに使えるよ
            </p>
            <button onClick={dismissA2HS} className="p-1 rounded-full shrink-0" style={{ backgroundColor: "#241B2F" }}>
              <X size={12} color={DUST} />
            </button>
          </div>
        )}

        {/* Self toggle card */}
        <div className="px-5 -mt-1 pt-4 pb-3" style={{ backgroundColor: INK }}>
          <button
            onClick={handleToggle}
            className={`w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 zen-maru text-lg font-bold transition-all ${hima ? "glow-anim" : ""}`}
            style={{ backgroundColor: hima ? CORAL : CREAM, color: hima ? CREAM : INK, border: hima ? "none" : `2px solid ${DUST}` }}
          >
            {geoStatus === "requesting" ? "位置情報を取得中…" : hima ? "今ヒマ！📣 位置を公開中" : "今日はヒマじゃない 😴"}
          </button>

          {hima && (
            <input
              value={message}
              onChange={(e) => { setMessage(e.target.value); markAction(); }}
              placeholder="今なにしてる？(任意)"
              maxLength={30}
              className="zen-kaku w-full mt-2 px-4 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "#332942", color: CREAM, border: `1px solid ${DUST}` }}
            />
          )}

          <p className="zen-kaku text-[11px] mt-2 text-center" style={{ color: DUST }}>
            {hima
              ? `5分うごきもアクションもないと自動でオフになるよ・最終アクティビティ ${fmtAgo(lastActivityAt)}`
              : "オンにすると、まわりのヒマな友達がレーダーに出てくるよ"}
          </p>

          {geoStatus === "denied" && (
            <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: "#4a2f33" }}>
              <span className="zen-kaku text-[11px]" style={{ color: "#FFD3D3" }}>📍 位置情報の許可が必要だよ</span>
              <button onClick={startHima} className="zen-kaku text-[11px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: CORAL, color: CREAM }}>許可する</button>
            </div>
          )}

          {authState === "failed" && (
            <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: "#4a2f33" }}>
              <span className="zen-kaku text-[11px]" style={{ color: "#FFD3D3" }}>認証に時間がかかってるみたい</span>
              <button onClick={() => window.location.reload()} className="zen-kaku text-[11px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: CORAL, color: CREAM }}>再読み込み</button>
            </div>
          )}
        </div>

        {/* Segmented control */}
        <div className="flex gap-2 px-5 py-3">
          <button
            onClick={() => { setView("map"); markAction(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full zen-kaku text-sm font-bold transition-colors"
            style={{ backgroundColor: view === "map" ? INK : "transparent", color: view === "map" ? CREAM : INK, border: `1.5px solid ${INK}` }}
          >
            <MapIcon size={15} /> 地図
          </button>
          <button
            onClick={() => { setView("list"); markAction(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full zen-kaku text-sm font-bold transition-colors"
            style={{ backgroundColor: view === "list" ? INK : "transparent", color: view === "list" ? CREAM : INK, border: `1.5px solid ${INK}` }}
          >
            <List size={15} /> リスト
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 pb-6">
          {view === "map" ? (
            <div className="relative w-full rounded-3xl overflow-hidden shadow-inner" style={{ height: 420, backgroundColor: "#EFE9DC", border: `3px solid ${INK}` }}>
              {!hima || !selfCoords ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center px-8 gap-3">
                  <MapPin size={28} color={DUST} />
                  <p className="zen-kaku text-sm" style={{ color: INK }}>自分もヒマにすると、まわりのヒマな友達が地図に出てくるよ</p>
                  <button onClick={handleToggle} className="zen-maru text-sm font-bold px-4 py-2 rounded-full" style={{ backgroundColor: CORAL, color: CREAM }}>今ヒマにする</button>
                </div>
              ) : (
                <MapView
                  self={selfCoords}
                  friends={withDist}
                  onSelectFriend={(f) => { setSelectedFriend(f); markAction(); }}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {withDist.length === 0 && (
                <div className="text-center py-8">
                  <p className="zen-kaku text-sm" style={{ color: DUST }}>今ヒマな友達はいないみたい</p>
                </div>
              )}
              {withDist.map((f) => (
                <button key={f.userId} onClick={() => { setSelectedFriend(f); markAction(); }} className="w-full flex items-center gap-3 p-3 rounded-2xl shadow-sm text-left" style={{ backgroundColor: CREAM, border: `2px solid ${f.color}` }}>
                  <div className="rounded-xl flex items-center justify-center text-xl" style={{ width: 44, height: 44, backgroundColor: "#fff" }}>{f.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="zen-maru font-bold text-sm" style={{ color: INK }}>{f.name}</p>
                    <p className="zen-kaku text-xs truncate" style={{ color: "#5b5468" }}>{f.message || "メッセージなし"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="zen-kaku text-xs font-bold" style={{ color: f.color }}>{fmtDistance(f.dist)}</p>
                    <p className="zen-kaku text-[10px]" style={{ color: DUST }}>{fmtAgo(f.lastActivityAt)}</p>
                  </div>
                </button>
              ))}

              <button onClick={addDemoFriends} className="zen-kaku text-xs font-bold mt-2 py-2.5 rounded-xl" style={{ backgroundColor: "#EFEAE0", color: INK, border: `1px dashed ${DUST}` }}>
                ＋ サンプルの友達を試しに置いてみる
              </button>
            </div>
          )}
        </div>

        {/* Onboarding modal */}
        {meLoaded && showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(36,27,47,0.6)" }}>
            <div className="modal-anim w-full rounded-3xl p-6" style={{ maxWidth: 360, backgroundColor: CREAM, border: `3px solid ${INK}` }}>
              {onboardStep === "profile" ? (
                <>
                  <h2 className="zen-maru text-xl mb-1" style={{ color: INK }}>ようこそ 👋</h2>
                  <p className="zen-kaku text-xs mb-4" style={{ color: "#5b5468" }}>友達に表示される名前とアイコンを決めてね</p>
                  <input value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={10} placeholder="なまえ" className="zen-kaku w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3" style={{ backgroundColor: "#fff", border: `1.5px solid ${DUST}`, color: INK }} />
                  <div className="grid grid-cols-6 gap-2 mb-5">
                    {AVATARS.map((a, i) => (
                      <button key={a} onClick={() => setDraftAvatarIdx(i)} className="rounded-xl flex items-center justify-center text-xl py-2" style={{ backgroundColor: draftAvatarIdx === i ? AVATAR_COLORS[i] : "#fff", border: `2px solid ${AVATAR_COLORS[i]}` }}>{a}</button>
                    ))}
                  </div>
                  <button onClick={goToRoomStep} disabled={!draftName.trim()} className="w-full py-3 rounded-2xl zen-maru font-bold" style={{ backgroundColor: draftName.trim() ? CORAL : DUST, color: CREAM }}>つぎへ</button>
                </>
              ) : (
                <>
                  <h2 className="zen-maru text-xl mb-1" style={{ color: INK }}>グループを決めよう 👥</h2>
                  <p className="zen-kaku text-xs mb-4" style={{ color: "#5b5468" }}>同じコードの人同士だけ、お互いのヒマが見えるよ</p>
                  <div className="flex gap-2 mb-4">
                    <button onClick={pickCreateMode} className="flex-1 py-2 rounded-full zen-kaku text-xs font-bold" style={{ backgroundColor: draftRoomMode === "create" ? INK : "#fff", color: draftRoomMode === "create" ? CREAM : INK, border: `1.5px solid ${INK}` }}>新しく作る</button>
                    <button onClick={pickJoinMode} className="flex-1 py-2 rounded-full zen-kaku text-xs font-bold" style={{ backgroundColor: draftRoomMode === "join" ? INK : "#fff", color: draftRoomMode === "join" ? CREAM : INK, border: `1.5px solid ${INK}` }}>コードを持ってる</button>
                  </div>
                  {draftRoomMode === "create" ? (
                    <div className="text-center py-4 mb-5 rounded-xl" style={{ backgroundColor: "#EFEAE0" }}>
                      <p className="zen-kaku text-[11px] mb-1" style={{ color: "#5b5468" }}>あなたのグループコード</p>
                      <p className="zen-maru text-3xl font-bold" style={{ color: INK, letterSpacing: 3 }}>{draftRoomCode}</p>
                      <p className="zen-kaku text-[10px] mt-1" style={{ color: DUST }}>あとで友達にこのコードを送ってね</p>
                    </div>
                  ) : (
                    <input value={draftRoomCode} onChange={(e) => setDraftRoomCode(e.target.value.toUpperCase())} maxLength={6} placeholder="例: A3F9K2" className="zen-kaku w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-5 text-center" style={{ backgroundColor: "#fff", border: `1.5px solid ${DUST}`, color: INK, letterSpacing: 2 }} />
                  )}
                  <button onClick={finishOnboarding} disabled={!draftRoomCode || draftRoomCode.length < 4 || authState !== "ready"} className="w-full py-3 rounded-2xl zen-maru font-bold" style={{ backgroundColor: draftRoomCode && draftRoomCode.length >= 4 && authState === "ready" ? CORAL : DUST, color: CREAM }}>
                    {authState === "ready" ? "はじめる" : "認証中…"}
                  </button>
                  {authState === "failed" && window.__authError && (
                    <p className="zen-kaku mt-2 text-center break-all" style={{ fontSize: 10, color: "#B0473F" }}>{window.__authError}</p>
                  )}
                  <button onClick={() => setOnboardStep("profile")} className="w-full zen-kaku text-xs mt-3" style={{ color: DUST }}>＜ もどる</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Edit modal */}
        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(36,27,47,0.6)" }}>
            <div className="modal-anim w-full rounded-3xl p-6 relative" style={{ maxWidth: 360, backgroundColor: CREAM, border: `3px solid ${INK}` }}>
              <button onClick={() => setShowEdit(false)} className="absolute top-4 right-4 rounded-full p-1.5" style={{ backgroundColor: "#EFEAE0" }}><X size={16} color={INK} /></button>
              <h2 className="zen-maru text-xl mb-4" style={{ color: INK }}>プロフィール編集</h2>
              <input value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={10} className="zen-kaku w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3" style={{ backgroundColor: "#fff", border: `1.5px solid ${DUST}`, color: INK }} />
              <div className="grid grid-cols-6 gap-2 mb-4">
                {AVATARS.map((a, i) => (
                  <button key={a} onClick={() => setDraftAvatarIdx(i)} className="rounded-xl flex items-center justify-center text-xl py-2" style={{ backgroundColor: draftAvatarIdx === i ? AVATAR_COLORS[i] : "#fff", border: `2px solid ${AVATAR_COLORS[i]}` }}>{a}</button>
                ))}
              </div>

              <div className="mb-5 p-3 rounded-xl" style={{ backgroundColor: "#EFEAE0" }}>
                <p className="zen-kaku text-[11px] font-bold mb-1" style={{ color: "#5b5468" }}>今のグループコード</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="zen-maru text-lg font-bold" style={{ color: INK, letterSpacing: 2 }}>{me?.roomCode}</span>
                  <button onClick={copyRoomCode} className="p-1.5 rounded-full" style={{ backgroundColor: "#fff" }}><Copy size={14} color={INK} /></button>
                </div>
                <div className="flex gap-2">
                  <input value={switchCodeInput} onChange={(e) => setSwitchCodeInput(e.target.value.toUpperCase())} maxLength={6} placeholder="ちがうコードに参加する" className="zen-kaku flex-1 px-3 py-1.5 rounded-lg text-xs outline-none" style={{ backgroundColor: "#fff", border: `1px solid ${DUST}`, color: INK }} />
                  <button onClick={() => switchRoom(switchCodeInput)} disabled={switchCodeInput.length < 4} className="zen-kaku text-xs font-bold px-3 rounded-lg" style={{ backgroundColor: switchCodeInput.length >= 4 ? TEAL : DUST, color: CREAM }}>切替</button>
                </div>
              </div>

              <button onClick={saveEdit} className="w-full py-3 rounded-2xl zen-maru font-bold" style={{ backgroundColor: CORAL, color: CREAM }}>保存する</button>
            </div>
          </div>
        )}

        {/* Bottom sheet */}
        {selectedFriend && (
          <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ maxWidth: 430, margin: "0 auto" }}>
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(36,27,47,0.5)" }} onClick={() => setSelectedFriend(null)} />
            <div className="relative w-full sheet-anim rounded-t-3xl p-5 pb-7" style={{ backgroundColor: CREAM, maxWidth: 430, border: `3px solid ${INK}`, borderBottom: "none" }}>
              <button onClick={() => setSelectedFriend(null)} className="absolute top-4 right-4 rounded-full p-1.5" style={{ backgroundColor: "#EFEAE0" }}><X size={16} color={INK} /></button>
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-2xl flex items-center justify-center text-3xl" style={{ width: 56, height: 56, backgroundColor: "#fff", border: `2px solid ${selectedFriend.color}` }}>{selectedFriend.avatar}</div>
                <div>
                  <p className="zen-maru font-bold text-lg" style={{ color: INK }}>{selectedFriend.name}</p>
                  <div className="flex items-center gap-1">
                    <Clock size={12} color={DUST} />
                    <span className="zen-kaku text-xs" style={{ color: DUST }}>{fmtAgo(selectedFriend.lastActivityAt)}・{fmtDistance(selectedFriend.dist)}</span>
                  </div>
                </div>
              </div>
              <p className="zen-kaku text-sm px-3 py-2.5 rounded-xl mb-4" style={{ backgroundColor: "#EFEAE0", color: INK }}>{selectedFriend.message || "メッセージはありません"}</p>
              <button onClick={() => handleSendInvite(selectedFriend)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl zen-maru font-bold" style={{ backgroundColor: CORAL, color: CREAM }}>
                <Send size={16} /> 一緒にヒマしよって誘う
              </button>
            </div>
          </div>
        )}

        {/* Invites inbox */}
        {showInvites && (
          <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ maxWidth: 430, margin: "0 auto" }}>
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(36,27,47,0.5)" }} onClick={() => setShowInvites(false)} />
            <div className="relative w-full sheet-anim rounded-t-3xl p-5 pb-7" style={{ backgroundColor: CREAM, maxWidth: 430, maxHeight: "75vh", overflowY: "auto", border: `3px solid ${INK}`, borderBottom: "none" }}>
              <button onClick={() => setShowInvites(false)} className="absolute top-4 right-4 rounded-full p-1.5" style={{ backgroundColor: "#EFEAE0" }}><X size={16} color={INK} /></button>
              <h2 className="zen-maru text-xl mb-4" style={{ color: INK }}>誘われたよ 💌</h2>
              {pendingInvites.length === 0 ? (
                <p className="zen-kaku text-sm text-center py-6" style={{ color: DUST }}>今のところ誘いはないよ</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {pendingInvites.map((inv) => (
                    <div key={inv.id} className="p-3 rounded-2xl" style={{ backgroundColor: "#EFEAE0", border: `2px solid ${inv.fromColor || DUST}` }}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="rounded-xl flex items-center justify-center text-xl" style={{ width: 40, height: 40, backgroundColor: "#fff" }}>{inv.fromAvatar}</div>
                        <div className="flex-1 min-w-0">
                          <p className="zen-maru font-bold text-sm" style={{ color: INK }}>{inv.fromName}</p>
                          <p className="zen-kaku text-xs truncate" style={{ color: "#5b5468" }}>{inv.message}</p>
                        </div>
                        <span className="zen-kaku text-[10px] shrink-0" style={{ color: DUST }}>{fmtAgo(inv.createdAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRespondInvite(inv, "accepted")} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl zen-kaku text-xs font-bold" style={{ backgroundColor: TEAL, color: CREAM }}>
                          <Check size={13} /> のる!
                        </button>
                        <button onClick={() => handleRespondInvite(inv, "declined")} className="flex-1 py-2 rounded-xl zen-kaku text-xs font-bold" style={{ backgroundColor: "#fff", color: INK, border: `1.5px solid ${DUST}` }}>
                          またね
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed top-6 left-1/2 z-50 toast-anim px-4 py-2.5 rounded-full shadow-lg zen-kaku text-xs font-bold text-center" style={{ backgroundColor: INK, color: CREAM, maxWidth: 320 }}>{toast}</div>
        )}
      </div>
    </div>
  );
}
