import React, { useState } from "react";
import { MoreVertical, Flag, Ban, ChevronLeft, X, Check, AlertTriangle } from "lucide-react";

const REASONS = [
  "出会い目的の内容が含まれる",
  "迷惑行為・嫌がらせ",
  "なりすまし",
  "個人情報を執拗に聞かれた",
  "その他",
];

export default function ReportBlockPrototype() {
  const [view, setView] = useState("idle"); // idle | sheet | report | block | done
  const [doneType, setDoneType] = useState("");
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);

  const ink = "#20202A";
  const stone = "#8A8578";
  const night = "#1E2340";
  const amber = "#E8A33D";
  const paper = "#F6F0E4";
  const teal = "#3E7C74";
  const clay = "#C97B63";

  const reset = () => {
    setView("idle");
    setReason("");
    setDetail("");
    setAlsoBlock(false);
    setDoneType("");
  };

  return (
    <div
      style={{ background: "#0F1226", fontFamily: "'Inter', sans-serif" }}
      className="min-h-screen w-full flex items-center justify-center p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .sheet-item { transition: background .12s ease; }
        .sheet-item:hover { background: #E4DAC3; }
        .radio-row { transition: background .12s ease, border-color .12s ease; }
        .action-btn { transition: transform .15s ease, box-shadow .15s ease; }
        .action-btn:hover { transform: translateY(-2px); }
        .overlay { transition: opacity .2s ease; }
      `}</style>

      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{ background: paper, color: ink, boxShadow: "0 30px 60px rgba(0,0,0,0.35)", height: "700px" }}
      >
        {/* Base context: a chat message, always visible underneath */}
        <div className="px-4 pt-5 pb-4 flex items-center gap-3 shrink-0" style={{ background: night, color: paper }}>
          <ChevronLeft size={20} style={{ color: "#C9C3B4" }} />
          <p className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
            モンハン部屋
          </p>
        </div>

        <div className="flex-1 px-4 py-5">
          <p className="text-[11px] mb-3" style={{ color: stone }}>
            サンプル：この投稿・ユーザーに対して通報／ブロックができます
          </p>
          <div
            className="rounded-xl px-3.5 py-3 flex items-start gap-3"
            style={{ background: "#EFE8D8", border: "1px solid #DFD5BC" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: clay, color: night }}
            >
              た
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: ink }}>たく</p>
              <p className="text-[12.5px] mt-1 leading-snug" style={{ color: ink }}>
                週末またやりません？空いてる人いるかな
              </p>
            </div>
            <button
              onClick={() => setView("sheet")}
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "#E4DAC3" }}
            >
              <MoreVertical size={14} style={{ color: stone }} />
            </button>
          </div>
        </div>

        {/* Overlay: bottom sheet */}
        {view === "sheet" && (
          <div className="overlay absolute inset-0 flex items-end" style={{ background: "rgba(30,35,64,0.55)" }}>
            <div className="w-full rounded-t-2xl px-4 pt-3 pb-5" style={{ background: paper }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#DFD5BC" }} />
              <p className="text-xs font-semibold mb-2 px-1" style={{ color: stone }}>「たく」への操作</p>
              <button
                onClick={() => setView("report")}
                className="sheet-item w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left"
              >
                <Flag size={16} style={{ color: amber }} />
                <span className="text-sm" style={{ color: ink }}>通報する</span>
              </button>
              <button
                onClick={() => setView("block")}
                className="sheet-item w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left"
              >
                <Ban size={16} style={{ color: clay }} />
                <span className="text-sm" style={{ color: ink }}>ブロックする</span>
              </button>
              <button
                onClick={reset}
                className="sheet-item w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left mt-1"
                style={{ borderTop: "1px solid #DFD5BC" }}
              >
                <X size={16} style={{ color: stone }} />
                <span className="text-sm" style={{ color: stone }}>キャンセル</span>
              </button>
            </div>
          </div>
        )}

        {/* Overlay: report flow */}
        {view === "report" && (
          <div className="overlay absolute inset-0 flex flex-col" style={{ background: paper }}>
            <div className="px-4 pt-5 pb-4 flex items-center gap-3 shrink-0" style={{ background: night, color: paper }}>
              <button onClick={() => setView("sheet")}>
                <ChevronLeft size={20} style={{ color: "#C9C3B4" }} />
              </button>
              <p className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                通報する
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div
                className="rounded-lg px-3 py-2.5"
                style={{ background: "#EFE8D8", border: "1px solid #DFD5BC" }}
              >
                <p className="text-[10px]" style={{ color: stone }}>通報される内容</p>
                <p className="text-[12px] mt-1" style={{ color: ink }}>たく：「週末またやりません？空いてる人いるかな」</p>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: stone }}>理由を選んでください</p>
                <div className="space-y-1.5">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className="radio-row w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left"
                      style={{ background: "#EFE8D8", border: `1px solid ${reason === r ? teal : "#DFD5BC"}` }}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                        style={{ border: `1.5px solid ${reason === r ? teal : "#B8AE94"}` }}
                      >
                        {reason === r && <span className="w-2 h-2 rounded-full" style={{ background: teal }} />}
                      </span>
                      <span className="text-[12.5px]" style={{ color: ink }}>{r}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: stone }}>詳しい状況（任意）</p>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="状況を書いておくと確認がスムーズです"
                  className="w-full rounded-lg px-3 py-2.5 text-[12.5px] outline-none resize-none"
                  style={{ background: "#EFE8D8", border: "1px solid #DFD5BC", color: ink, height: "70px" }}
                />
              </div>

              <button
                onClick={() => setAlsoBlock((v) => !v)}
                className="w-full flex items-center gap-2.5 rounded-lg px-3.5 py-3 text-left"
                style={{ background: "#EFE8D8", border: `1px solid ${alsoBlock ? teal : "#DFD5BC"}` }}
              >
                <span
                  className="w-4 h-4 rounded shrink-0 flex items-center justify-center"
                  style={{ background: alsoBlock ? teal : paper, border: `1px solid ${alsoBlock ? teal : "#B8AE94"}` }}
                >
                  {alsoBlock && <Check size={11} color={paper} />}
                </span>
                <span className="text-[12px]" style={{ color: ink }}>このユーザーも同時にブロックする</span>
              </button>

              <p className="text-[10.5px] leading-snug text-center" style={{ color: stone }}>
                通報は匿名で送信されます。AIと運営スタッフが内容を確認します。
              </p>
            </div>
            <div className="px-4 py-3.5 shrink-0" style={{ borderTop: "1px solid #DFD5BC" }}>
              <button
                disabled={!reason}
                onClick={() => { setDoneType(alsoBlock ? "report+block" : "report"); setView("done"); }}
                className="action-btn w-full rounded-lg py-3 text-sm font-semibold"
                style={{
                  background: reason ? amber : "#DDD5C0",
                  color: reason ? night : "#A69F8C",
                  cursor: reason ? "pointer" : "not-allowed",
                }}
              >
                通報を送信する
              </button>
            </div>
          </div>
        )}

        {/* Overlay: block confirm */}
        {view === "block" && (
          <div className="overlay absolute inset-0 flex items-end" style={{ background: "rgba(30,35,64,0.55)" }}>
            <div className="w-full rounded-t-2xl px-5 pt-5 pb-6" style={{ background: paper }}>
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
                style={{ background: "#EFE0D6" }}
              >
                <AlertTriangle size={20} style={{ color: clay }} />
              </div>
              <p className="text-sm font-semibold mb-1.5" style={{ color: ink }}>「たく」をブロックしますか？</p>
              <p className="text-[12px] leading-snug mb-5" style={{ color: stone }}>
                ブロックすると、お互いの投稿・メッセージ・プロフィールが表示されなくなります。相手に通知はいきません。
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setView("sheet")}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                  style={{ background: "#EFE8D8", border: "1px solid #DFD5BC", color: ink }}
                >
                  キャンセル
                </button>
                <button
                  onClick={() => { setDoneType("block"); setView("done"); }}
                  className="action-btn flex-1 rounded-lg py-2.5 text-sm font-semibold"
                  style={{ background: clay, color: paper }}
                >
                  ブロックする
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay: done */}
        {view === "done" && (
          <div className="overlay absolute inset-0 flex flex-col items-center justify-center px-8" style={{ background: "rgba(246,240,228,0.98)" }}>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: teal }}
            >
              <Check size={26} color={paper} />
            </div>
            <p className="text-sm font-semibold mb-1.5 text-center" style={{ color: ink }}>
              {doneType === "block" && "ブロックしました"}
              {doneType === "report" && "通報を受け付けました"}
              {doneType === "report+block" && "通報を受け付け、ブロックしました"}
            </p>
            <p className="text-[11.5px] text-center leading-snug mb-6" style={{ color: stone }}>
              内容はAIと運営スタッフが確認します。ご協力ありがとうございました。
            </p>
            <button
              onClick={reset}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: night, color: paper }}
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
