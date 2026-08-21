import React, { useState, useEffect } from "react";
import { Gamepad2, Sparkles, Code2, MapPin, Heart, Smile, Star, MessageCircle } from "lucide-react";

const THEME_TAGS = [
  { label: "ゲーム", icon: Gamepad2 },
  { label: "アニメ", icon: Sparkles },
  { label: "プログラミング", icon: Code2 },
];

const REACTIONS = [
  { value: 87, label: "また遊びたい", icon: Heart },
  { value: 63, label: "楽しかった", icon: Smile },
  { value: 45, label: "面白かった", icon: Star },
];

const ACTIVITY = [
  { date: "8/1", text: "「今週末レイドやりませんか」に参加" },
  { date: "7/28", text: "プログラミング部の雑談で発言" },
  { date: "7/20", text: "「初心者アニメ実況会」を主催" },
];

function AnimatedNumber({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display}</>;
}

export default function ProfilePrototype() {
  const ink = "#20202A";
  const stone = "#8A8578";
  const night = "#1E2340";
  const amber = "#E8A33D";
  const paper = "#F6F0E4";
  const teal = "#3E7C74";

  return (
    <div
      style={{ background: night, fontFamily: "'Inter', sans-serif", color: paper }}
      className="min-h-screen w-full flex items-center justify-center p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .badge-perf {
          background-image: radial-gradient(circle, ${night} 2.5px, transparent 2.5px);
          background-size: 14px 14px;
          background-position: -3px 0;
        }
        .stamp-card { transition: transform .18s ease, box-shadow .18s ease; }
        .stamp-card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.18); }
        .tag-chip { transition: background .15s ease; }
      `}</style>

      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: paper, color: ink, boxShadow: "0 30px 60px rgba(0,0,0,0.35)" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5" style={{ background: night, color: paper }}>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{ background: amber, color: night, fontFamily: "'Space Grotesk', sans-serif" }}
            >
              春
            </div>
            <div className="min-w-0">
              <p
                className="text-lg leading-tight truncate"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
              >
                はるか
              </p>
              <p className="text-xs mt-1 leading-snug" style={{ color: "#C9C3B4" }}>
                週末は大体レイドかボドゲ。初心者歓迎！
              </p>
            </div>
          </div>
        </div>

        {/* Hero stat: real-world trust anchor */}
        <div className="px-6 pt-5">
          <div
            className="rounded-xl px-5 py-4 flex items-center justify-between"
            style={{ background: night, color: paper }}
          >
            <div>
              <p className="text-xs tracking-wide flex items-center gap-1.5" style={{ color: "#C9C3B4" }}>
                <MapPin size={12} style={{ color: amber }} />
                オフラインで会った回数
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#8D87A0" }}>
                安心して人と会えている実績です
              </p>
            </div>
            <p
              className="text-4xl shrink-0 pl-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: amber, fontWeight: 600 }}
            >
              <AnimatedNumber value={12} />
              <span className="text-base ml-0.5" style={{ color: "#C9C3B4" }}>回</span>
            </p>
          </div>
          <p className="text-[11px] text-center mt-2" style={{ color: stone }}>
            フォロワー数・性別は、ここでは表示されません。
          </p>
        </div>

        {/* Theme tags */}
        <div className="px-6 pt-5">
          <p className="text-xs font-semibold mb-2" style={{ color: stone }}>
            興味のあるテーマ
          </p>
          <div className="flex flex-wrap gap-2">
            {THEME_TAGS.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="tag-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: "#EAE2CF", color: ink }}
              >
                <Icon size={13} style={{ color: teal }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Reactions received */}
        <div className="px-6 pt-5">
          <p className="text-xs font-semibold mb-2" style={{ color: stone }}>
            もらったリアクション
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {REACTIONS.map(({ value, label, icon: Icon }) => (
              <div
                key={label}
                className="stamp-card rounded-lg px-2.5 py-3 flex flex-col items-center text-center gap-1"
                style={{ background: "#EFE8D8", border: `1px solid #DFD5BC` }}
              >
                <Icon size={15} style={{ color: teal }} />
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }} className="text-lg leading-none mt-0.5">
                  {value}
                </p>
                <p className="text-[10.5px] leading-snug" style={{ color: stone }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="px-6 pt-5 pb-2">
          <p className="text-xs font-semibold mb-2" style={{ color: stone }}>
            最近の活動
          </p>
          <div className="space-y-2">
            {ACTIVITY.map((a) => (
              <div key={a.date + a.text} className="flex items-start gap-2 text-xs">
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: teal }} className="shrink-0">
                  {a.date}
                </span>
                <span style={{ color: ink }} className="leading-snug">{a.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket-stub footer: event badge motif */}
        <div className="relative mt-5">
          <div className="badge-perf h-3 w-full" />
          <div
            className="px-6 py-3 flex items-center justify-between"
            style={{ background: "#EAE2CF" }}
          >
            <div className="flex items-center gap-1.5">
              <MessageCircle size={12} style={{ color: teal }} />
              <span className="text-[10.5px]" style={{ color: stone }}>
                初参加: 2025年11月
              </span>
            </div>
            <span
              className="text-[10.5px]"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: stone }}
            >
              MEMBER NO. 0842
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
