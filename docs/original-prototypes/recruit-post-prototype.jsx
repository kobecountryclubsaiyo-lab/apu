import React, { useState } from "react";
import { ChevronLeft, Sparkles, Calendar, Users, MapPin, Info, Heart, Smile, Star, Check } from "lucide-react";

const ORGANIZER_STAMPS = [
  { value: 12, label: "オフライン参加", icon: MapPin },
  { value: 87, label: "また遊びたい", icon: Heart },
  { value: 63, label: "楽しかった", icon: Smile },
  { value: 45, label: "面白かった", icon: Star },
];

export default function RecruitPostPrototype() {
  const [offlineMeet, setOfflineMeet] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [capacity, setCapacity] = useState(4);
  const MIN_CAPACITY = 3;

  const ink = "#20202A";
  const stone = "#8A8578";
  const night = "#1E2340";
  const amber = "#E8A33D";
  const paper = "#F6F0E4";
  const teal = "#3E7C74";

  return (
    <div
      style={{ background: "#0F1226", fontFamily: "'Inter', sans-serif" }}
      className="min-h-screen w-full flex items-center justify-center p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .toggle-track { transition: background .18s ease; }
        .toggle-knob { transition: transform .18s ease; }
        .submit-btn { transition: transform .15s ease, box-shadow .15s ease; }
        .submit-btn.enabled:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(232,163,61,0.35); }
        .stepper-btn { transition: background .12s ease; }
        input[type=text], input[type=datetime-local] { font-family: 'Inter', sans-serif; }
      `}</style>

      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{ background: paper, color: ink, boxShadow: "0 30px 60px rgba(0,0,0,0.35)", height: "760px" }}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-4 flex items-center gap-3 shrink-0" style={{ background: night, color: paper }}>
          <ChevronLeft size={20} style={{ color: "#C9C3B4" }} />
          <p className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
            募集をつくる
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Context chip */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
            style={{ background: "#EAE2CF", color: teal }}
          >
            <Sparkles size={11} />
            「モンハン部屋」の話題から作成中
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: stone }}>タイトル</label>
            <input
              type="text"
              defaultValue="今週末レイド行きませんか？"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: "#EFE8D8", border: "1px solid #DFD5BC", color: ink }}
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: stone }}>
              <Calendar size={12} />
              日時
            </label>
            <div
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: "#EFE8D8", border: "1px solid #DFD5BC", color: ink }}
            >
              8月8日（土）21:00〜
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: stone }}>
              <Users size={12} />
              定員
            </label>
            <div className="flex items-center gap-3">
              <button
                disabled={capacity <= MIN_CAPACITY}
                className="stepper-btn w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{
                  background: "#EFE8D8",
                  border: "1px solid #DFD5BC",
                  color: capacity <= MIN_CAPACITY ? "#C9BFA8" : ink,
                  cursor: capacity <= MIN_CAPACITY ? "not-allowed" : "pointer",
                }}
                onClick={() => setCapacity((c) => Math.max(MIN_CAPACITY, c - 1))}
              >
                −
              </button>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }} className="text-base w-6 text-center">
                {capacity}
              </span>
              <button
                className="stepper-btn w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ background: "#EFE8D8", border: "1px solid #DFD5BC", color: ink }}
                onClick={() => setCapacity((c) => Math.min(20, c + 1))}
              >
                ＋
              </button>
              <span className="text-[11px]" style={{ color: stone }}>人</span>
            </div>
            <p className="text-[10.5px] mt-1.5 flex items-center gap-1" style={{ color: capacity <= MIN_CAPACITY ? amber : stone }}>
              <Info size={11} />
              1対1にならないよう、3人以上での設定が必須です
            </p>
          </div>

          {/* Offline toggle */}
          <div className="rounded-xl px-3.5 py-3" style={{ background: "#EFE8D8", border: "1px solid #DFD5BC" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: ink }}>
                <MapPin size={13} style={{ color: teal }} />
                オフラインで会う予定です
              </div>
              <button
                onClick={() => setOfflineMeet((v) => !v)}
                className="toggle-track w-10 h-6 rounded-full relative"
                style={{ background: offlineMeet ? teal : "#C9BFA8" }}
              >
                <span
                  className="toggle-knob absolute top-0.5 w-5 h-5 rounded-full bg-white"
                  style={{ transform: offlineMeet ? "translateX(18px)" : "translateX(2px)" }}
                />
              </button>
            </div>
            {offlineMeet && (
              <div
                className="mt-3 rounded-lg px-3 py-2.5 flex gap-2"
                style={{ background: "#E4DAC3" }}
              >
                <Info size={13} style={{ color: "#9C6B1F" }} className="shrink-0 mt-0.5" />
                <p className="text-[11px] leading-snug" style={{ color: "#5A4A20" }}>
                  初めての相手とは、公共の場所・複数人での参加が安心です。
                </p>
              </div>
            )}
          </div>

          {/* Organizer trust preview */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: stone }}>
              あなたの信頼スタンプ（参加者に表示されます）
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {ORGANIZER_STAMPS.map(({ value, label, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-lg px-1.5 py-2.5 flex flex-col items-center text-center gap-1"
                  style={{ background: "#EFE8D8", border: "1px solid #DFD5BC" }}
                >
                  <Icon size={12} style={{ color: teal }} />
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }} className="text-xs leading-none">
                    {value}
                  </p>
                  <p className="text-[8.5px] leading-tight" style={{ color: stone }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Guideline agreement */}
          <button
            onClick={() => setAgreed((v) => !v)}
            className="w-full flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-left"
            style={{ background: "#EFE8D8", border: `1px solid ${agreed ? teal : "#DFD5BC"}` }}
          >
            <span
              className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center"
              style={{ background: agreed ? teal : paper, border: `1px solid ${agreed ? teal : "#B8AE94"}` }}
            >
              {agreed && <Check size={11} color={paper} />}
            </span>
            <span className="text-[11.5px] leading-snug" style={{ color: ink }}>
              <span style={{ color: teal, textDecoration: "underline" }}>安全ガイドライン</span> に同意します（複数人参加・公共の場所での初対面など）
            </span>
          </button>
        </div>

        {/* Submit */}
        <div className="px-4 py-3.5 shrink-0" style={{ borderTop: "1px solid #DFD5BC" }}>
          <button
            disabled={!agreed}
            className={`submit-btn w-full rounded-lg py-3 text-sm font-semibold ${agreed ? "enabled" : ""}`}
            style={{
              background: agreed ? amber : "#DDD5C0",
              color: agreed ? night : "#A69F8C",
              cursor: agreed ? "pointer" : "not-allowed",
            }}
          >
            募集を投稿する
          </button>
          {!agreed && (
            <p className="text-[10.5px] text-center mt-1.5" style={{ color: stone }}>
              ガイドラインに同意すると投稿できます
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
