import React from "react";
import { Gamepad2, BookOpen, Camera, Sparkles, Code2, ChefHat, Users, ChevronRight } from "lucide-react";

const THEMES = [
  { name: "ゲーム", room: "モンハン部屋", members: 12, snippet: "今夜: レイドの話で盛り上がり中", icon: Gamepad2, accent: "amber" },
  { name: "読書", room: "積読を崩す会", members: 8, snippet: "今週の話題: ミステリー小説のおすすめ", icon: BookOpen, accent: "teal" },
  { name: "カメラ", room: "光と影を撮る部屋", members: 15, snippet: "週末: 紅葉スポットの共有会", icon: Camera, accent: "clay" },
  { name: "アニメ", room: "今期アニメ実況部屋", members: 20, snippet: "今夜: 新作の感想で盛り上がり中", icon: Sparkles, accent: "amber" },
  { name: "プログラミング", room: "もくもく会ルーム", members: 10, snippet: "今日: 詰まってるバグの相談中", icon: Code2, accent: "teal" },
  { name: "料理", room: "おうちごはん部屋", members: 9, snippet: "今週: 時短レシピを共有中", icon: ChefHat, accent: "clay" },
];

export default function ThemeSelectPrototype() {
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
        .theme-card { transition: transform .15s ease, box-shadow .15s ease; }
        .theme-card:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0,0,0,0.18); }
      `}</style>

      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{ background: paper, color: ink, boxShadow: "0 30px 60px rgba(0,0,0,0.35)", height: "760px" }}
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-5 shrink-0" style={{ background: night, color: paper }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }} className="text-lg">
            テーマを選ぶ
          </p>
          <p className="text-[11px] mt-1" style={{ color: "#C9C3B4" }}>
            気になる話題から、少人数のグループに参加できます
          </p>
        </div>

        {/* Theme list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
          {THEMES.map(({ name, room, members, snippet, icon: Icon, accent }) => (
            <button
              key={room}
              className="theme-card w-full text-left rounded-xl px-3.5 py-3 flex items-center gap-3"
              style={{ background: "#EFE8D8", border: "1px solid #DFD5BC" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: colorMap[accent] }}
              >
                <Icon size={18} style={{ color: night }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold truncate" style={{ color: ink }}>{room}</p>
                  <span
                    className="text-[9.5px] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: "#DFD5BC", color: stone }}
                  >
                    {name}
                  </span>
                </div>
                <p className="text-[10.5px] mt-0.5 truncate" style={{ color: stone }}>{snippet}</p>
                <p className="text-[9.5px] mt-1 flex items-center gap-1" style={{ color: teal }}>
                  <Users size={9} />
                  {members}人が参加中
                </p>
              </div>
              <ChevronRight size={16} style={{ color: stone }} className="shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
