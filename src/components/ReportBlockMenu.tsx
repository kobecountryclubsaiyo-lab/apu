"use client";

import { useState } from "react";
import { Flag, Ban, ChevronLeft, X, Check, AlertTriangle } from "lucide-react";

const REASONS = [
  "出会い目的の内容が含まれる",
  "迷惑行為・嫌がらせ",
  "なりすまし",
  "個人情報を執拗に聞かれた",
  "その他",
];

type View = "sheet" | "report" | "block" | "done";
type DoneType = "report" | "block" | "report+block" | "";

export default function ReportBlockMenu({
  targetUser,
  contentSnippet,
  roomId,
  recruitPostId,
  onClose,
}: {
  targetUser: { id: number; name: string };
  contentSnippet?: string;
  roomId?: number;
  recruitPostId?: number;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>("sheet");
  const [doneType, setDoneType] = useState<DoneType>("");
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submitReport() {
    setSubmitting(true);
    const fullReason = detail.trim() ? `${reason}: ${detail.trim()}` : reason;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: targetUser.id, roomId, recruitPostId, reason: fullReason }),
    });
    if (alsoBlock) {
      await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetUser.id }),
      });
    }
    setSubmitting(false);
    setDoneType(alsoBlock ? "report+block" : "report");
    setView("done");
  }

  async function submitBlock() {
    setSubmitting(true);
    await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: targetUser.id }),
    });
    setSubmitting(false);
    setDoneType("block");
    setView("done");
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col">
      {view === "sheet" && (
        <div className="flex-1 flex items-end" style={{ background: "rgba(30,35,64,0.55)" }} onClick={onClose}>
          <div
            className="w-full rounded-t-2xl px-4 pt-3 pb-5 bg-paper"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#DFD5BC" }} />
            <p className="text-xs font-semibold mb-2 px-1 text-stone">「{targetUser.name}」への操作</p>
            <button
              onClick={() => setView("report")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left hover:bg-[#E4DAC3]"
            >
              <Flag size={16} className="text-amber" />
              <span className="text-sm text-ink">通報する</span>
            </button>
            <button
              onClick={() => setView("block")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left hover:bg-[#E4DAC3]"
            >
              <Ban size={16} className="text-clay" />
              <span className="text-sm text-ink">ブロックする</span>
            </button>
            <button
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left mt-1 hover:bg-[#E4DAC3]"
              style={{ borderTop: "1px solid #DFD5BC" }}
            >
              <X size={16} className="text-stone" />
              <span className="text-sm text-stone">キャンセル</span>
            </button>
          </div>
        </div>
      )}

      {view === "report" && (
        <div className="flex-1 flex flex-col bg-paper">
          <div className="px-4 pt-5 pb-4 flex items-center gap-3 shrink-0 bg-night text-paper">
            <button onClick={() => setView("sheet")}>
              <ChevronLeft size={20} className="text-[#C9C3B4]" />
            </button>
            <p className="text-sm font-heading font-bold">通報する</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {contentSnippet && (
              <div className="rounded-lg px-3 py-2.5 bg-[#EFE8D8] border border-[#DFD5BC]">
                <p className="text-[10px] text-stone">通報される内容</p>
                <p className="text-[12px] mt-1 text-ink">
                  {targetUser.name}：「{contentSnippet}」
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold mb-2 text-stone">理由を選んでください</p>
              <div className="space-y-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left bg-[#EFE8D8]"
                    style={{ border: `1px solid ${reason === r ? "#3E7C74" : "#DFD5BC"}` }}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                      style={{ border: `1.5px solid ${reason === r ? "#3E7C74" : "#B8AE94"}` }}
                    >
                      {reason === r && <span className="w-2 h-2 rounded-full bg-teal" />}
                    </span>
                    <span className="text-[12.5px] text-ink">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-1.5 text-stone">詳しい状況（任意）</p>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                maxLength={500}
                placeholder="状況を書いておくと確認がスムーズです"
                className="w-full rounded-lg px-3 py-2.5 text-[12.5px] outline-none resize-none bg-[#EFE8D8] border border-[#DFD5BC] text-ink placeholder:text-stone"
                style={{ height: "70px" }}
              />
            </div>

            <button
              onClick={() => setAlsoBlock((v) => !v)}
              className="w-full flex items-center gap-2.5 rounded-lg px-3.5 py-3 text-left bg-[#EFE8D8]"
              style={{ border: `1px solid ${alsoBlock ? "#3E7C74" : "#DFD5BC"}` }}
            >
              <span
                className={`w-4 h-4 rounded shrink-0 flex items-center justify-center ${alsoBlock ? "bg-teal border-teal" : "bg-paper"}`}
                style={{ border: alsoBlock ? undefined : "1px solid #B8AE94" }}
              >
                {alsoBlock && <Check size={11} className="text-paper" />}
              </span>
              <span className="text-[12px] text-ink">このユーザーも同時にブロックする</span>
            </button>

            <p className="text-[10.5px] leading-snug text-center text-stone">
              通報は匿名で送信されます。運営スタッフが内容を確認します。
            </p>
          </div>
          <div className="px-4 py-3.5 shrink-0" style={{ borderTop: "1px solid #DFD5BC" }}>
            <button
              disabled={!reason || submitting}
              onClick={submitReport}
              className="w-full rounded-lg py-3 text-sm font-semibold"
              style={{
                background: reason ? "#E8A33D" : "#DDD5C0",
                color: reason ? "#1E2340" : "#A69F8C",
                cursor: reason ? "pointer" : "not-allowed",
              }}
            >
              {submitting ? "送信中…" : "通報を送信する"}
            </button>
          </div>
        </div>
      )}

      {view === "block" && (
        <div className="flex-1 flex items-end" style={{ background: "rgba(30,35,64,0.55)" }}>
          <div className="w-full rounded-t-2xl px-5 pt-5 pb-6 bg-paper">
            <div className="w-11 h-11 rounded-full flex items-center justify-center mb-3" style={{ background: "#EFE0D6" }}>
              <AlertTriangle size={20} className="text-clay" />
            </div>
            <p className="text-sm font-semibold mb-1.5 text-ink">「{targetUser.name}」をブロックしますか？</p>
            <p className="text-[12px] leading-snug mb-5 text-stone">
              ブロックすると、お互いの投稿・メッセージ・プロフィールが表示されなくなります。相手に通知はいきません。
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setView("sheet")}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium bg-[#EFE8D8] border border-[#DFD5BC] text-ink"
              >
                キャンセル
              </button>
              <button
                disabled={submitting}
                onClick={submitBlock}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold bg-clay text-paper"
              >
                {submitting ? "処理中…" : "ブロックする"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "done" && (
        <div className="flex-1 flex flex-col items-center justify-center px-8" style={{ background: "rgba(246,240,228,0.98)" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-teal">
            <Check size={26} className="text-paper" />
          </div>
          <p className="text-sm font-semibold mb-1.5 text-center text-ink">
            {doneType === "block" && "ブロックしました"}
            {doneType === "report" && "通報を受け付けました"}
            {doneType === "report+block" && "通報を受け付け、ブロックしました"}
          </p>
          <p className="text-[11.5px] text-center leading-snug mb-6 text-stone">
            内容は運営スタッフが確認します。ご協力ありがとうございました。
          </p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-night text-paper">
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
