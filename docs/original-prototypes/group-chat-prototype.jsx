import React from "react";
import { ChevronLeft, Users, Sparkles, ArrowRight, ArrowUp, Gamepad2 } from "lucide-react";

const MESSAGES = [
  { id: 1, name: "ゆうき", initial: "ゆ", color: "amber", time: "20:14", text: "今日のレイド強すぎた…w", self: false },
  { id: 2, name: "りん", initial: "り", color: "teal", time: "21:15", text: "ほんとそれ、また行きたい", self: true },
  { id: 3, name: "たく", initial: "た", color: "clay", time: "21:16", text: "週末またやりません？空いてる人いるかな", self: false },
  { id: 4, name: "ゆうき", initial: "ゆ", color: "amber", time: "21:18", text: "自分は土曜の夜なら行けます！", self: false },
];

const SUMMARY_POINTS = [
  "今夜9時からレイドの話で盛り上がり中",
  "「また行きたい」という声が複数",
  "土曜の夜に遊べる人が多そう",
];

export default function GroupChatPrototype() {
  const ink = "#20202A";
  const stone = "#8A8578";
  const night = "#1E2340";
  const amber = "#E8A33D";
  const paper = "#F6F0E4";
  const teal = "#3E7C74";
  const clay = "#C97B63";

  const colorMap = { amber, teal, clay };

  return (
    <div
      style={{ background: "#0F1226", fontFamily: "'Inter', sans-serif" }}
      className="min-h-screen w-full flex items-center justify-center p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .cta-btn { transition: transform .15s ease, box-shadow .15s ease; }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(232,163,61,0.35); }
        .send-btn { transition: transform .12s ease; }
        .send-btn:active { transform: scale(0.92); }
      `}</style>

      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{ background: paper, color: ink, boxShadow: "0 30px 60px rgba(0,0,0,0.35)", height: "700px" }}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-4 flex items-center gap-3 shrink-0" style={{ background: night, color: paper }}>
          <ChevronLeft size={20} style={{ color: "#C9C3B4" }} />
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: amber }}
          >
            <Gamepad2 size={17} style={{ color: night }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm leading-tight truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
              モンハン部屋
            </p>
            <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "#8D87A0" }}>
              <Users size={10} />
              ゲーム ・ 12人が参加中
            </p>
          </div>
        </div>

        {/* AI summary card */}
        <div className="px-4 pt-4 shrink-0">
          <div
            className="rounded-xl px-4 py-3.5"
            style={{ background: "#EFE8D8", borderLeft: `3px solid ${teal}` }}
          >
            <p className="text-[11px] font-semibold flex items-center gap-1.5 mb-2" style={{ color: teal }}>
              <Sparkles size={12} />
              AIが整理した話題
            </p>
            <ul className="space-y-1 mb-3">
              {SUMMARY_POINTS.map((pt) => (
                <li key={pt} className="text-[12px] leading-snug flex gap-1.5" style={{ color: ink }}>
                  <span style={{ color: stone }}>・</span>
                  {pt}
                </li>
              ))}
            </ul>
            <button
              className="cta-btn w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold"
              style={{ background: amber, color: night }}
            >
              募集をつくる
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
          {MESSAGES.map((m) => (
            <div key={m.id} className={`flex items-end gap-2 ${m.self ? "flex-row-reverse" : ""}`}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: colorMap[m.color], color: night }}
              >
                {m.initial}
              </div>
              <div className={`flex flex-col ${m.self ? "items-end" : "items-start"} max-w-[72%]`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {!m.self && <span className="text-[10px]" style={{ color: stone }}>{m.name}</span>}
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: stone }} className="text-[9.5px]">
                    {m.time}
                  </span>
                </div>
                <div
                  className="px-3 py-2 rounded-2xl text-[12.5px] leading-snug"
                  style={{
                    background: m.self ? teal : "#EFE8D8",
                    color: m.self ? paper : ink,
                    borderBottomRightRadius: m.self ? 4 : 16,
                    borderBottomLeftRadius: m.self ? 16 : 4,
                  }}
                >
                  {m.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 shrink-0" style={{ background: "#EFE8D8", borderTop: "1px solid #DFD5BC" }}>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 rounded-full px-4 py-2 text-[12px]"
              style={{ background: paper, color: stone, border: "1px solid #DFD5BC" }}
            >
              メッセージを入力
            </div>
            <button
              className="send-btn w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: amber }}
            >
              <ArrowUp size={15} style={{ color: night }} />
            </button>
          </div>
          <p className="text-[10px] text-center mt-2" style={{ color: stone }}>
            個人情報のやり取りには気をつけましょう
          </p>
        </div>
      </div>
    </div>
  );
}
