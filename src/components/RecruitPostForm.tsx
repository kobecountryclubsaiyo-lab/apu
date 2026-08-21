"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Sparkles, Calendar, Users, MapPin, Info, Heart, Smile, Star, Check } from "lucide-react";
import { MIN_RECRUIT_CAPACITY, MAX_RECRUIT_CAPACITY } from "@/lib/rules";

const STAMP_ICONS: Record<string, typeof Heart> = { AGAIN: Heart, FUN: Smile, INTERESTING: Star };

function defaultScheduledAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(21, 0, 0, 0);
  // datetime-local expects "YYYY-MM-DDTHH:mm" in local time.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function RecruitPostForm({
  roomId,
  roomName,
  organizer,
}: {
  roomId: number;
  roomName: string;
  organizer: {
    offlineMeetCount: number;
    stamps: { type: string; label: string; value: number }[];
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt());
  const [capacity, setCapacity] = useState(4);
  const [offlineMeet, setOfflineMeet] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const organizerStamps = [
    { value: organizer.offlineMeetCount, label: "オフライン参加", icon: MapPin },
    ...organizer.stamps.map((s) => ({ value: s.value, label: s.label, icon: STAMP_ICONS[s.type] ?? Star })),
  ];

  async function onSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/recruit-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        capacity,
        offlineMeet,
        guidelineAgreed: agreed,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "投稿に失敗しました");
      return;
    }
    router.push(`/rooms/${roomId}`);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0F1226]">
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col bg-paper text-ink shadow-2xl"
        style={{ height: "760px" }}
      >
        <div className="px-4 pt-5 pb-4 flex items-center gap-3 shrink-0 bg-night text-paper">
          <button onClick={() => router.back()}>
            <ChevronLeft size={20} className="text-[#C9C3B4]" />
          </button>
          <p className="text-sm font-heading font-bold">募集をつくる</p>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] bg-[#EAE2CF] text-teal">
            <Sparkles size={11} />
            「{roomName}」の話題から作成中
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5 text-stone">タイトル</label>
            <input
              type="text"
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="今週末レイド行きませんか？"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none bg-[#EFE8D8] border border-[#DFD5BC] placeholder:text-stone"
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5 text-stone">
              <Calendar size={12} />
              日時
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#EFE8D8] border border-[#DFD5BC]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5 text-stone">
              <Users size={12} />
              定員
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={capacity <= MIN_RECRUIT_CAPACITY}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-[#EFE8D8] border border-[#DFD5BC] disabled:text-[#C9BFA8] disabled:cursor-not-allowed"
                onClick={() => setCapacity((c) => Math.max(MIN_RECRUIT_CAPACITY, c - 1))}
              >
                −
              </button>
              <span className="font-mono font-semibold text-base w-6 text-center">{capacity}</span>
              <button
                type="button"
                disabled={capacity >= MAX_RECRUIT_CAPACITY}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-[#EFE8D8] border border-[#DFD5BC] disabled:text-[#C9BFA8] disabled:cursor-not-allowed"
                onClick={() => setCapacity((c) => Math.min(MAX_RECRUIT_CAPACITY, c + 1))}
              >
                ＋
              </button>
              <span className="text-[11px] text-stone">人</span>
            </div>
            <p className={`text-[10.5px] mt-1.5 flex items-center gap-1 ${capacity <= MIN_RECRUIT_CAPACITY ? "text-amber" : "text-stone"}`}>
              <Info size={11} />
              1対1にならないよう、{MIN_RECRUIT_CAPACITY}人以上での設定が必須です
            </p>
          </div>

          <div className="rounded-xl px-3.5 py-3 bg-[#EFE8D8] border border-[#DFD5BC]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
                <MapPin size={13} className="text-teal" />
                オフラインで会う予定です
              </div>
              <button
                type="button"
                onClick={() => setOfflineMeet((v) => !v)}
                className={`w-10 h-6 rounded-full relative ${offlineMeet ? "bg-teal" : "bg-[#C9BFA8]"}`}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                  style={{ transform: offlineMeet ? "translateX(18px)" : "translateX(2px)" }}
                />
              </button>
            </div>
            {offlineMeet && (
              <div className="mt-3 rounded-lg px-3 py-2.5 flex gap-2 bg-[#E4DAC3]">
                <Info size={13} className="text-[#9C6B1F] shrink-0 mt-0.5" />
                <p className="text-[11px] leading-snug text-[#5A4A20]">
                  初めての相手とは、公共の場所・複数人での参加が安心です。
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block text-stone">
              あなたの信頼スタンプ（参加者に表示されます）
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {organizerStamps.map(({ value, label, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-lg px-1.5 py-2.5 flex flex-col items-center text-center gap-1 bg-[#EFE8D8] border border-[#DFD5BC]"
                >
                  <Icon size={12} className="text-teal" />
                  <p className="font-mono font-semibold text-xs leading-none">{value}</p>
                  <p className="text-[8.5px] leading-tight text-stone">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAgreed((v) => !v)}
            className={`w-full flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-left bg-[#EFE8D8] border ${agreed ? "border-teal" : "border-[#DFD5BC]"}`}
          >
            <span
              className={`w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center ${agreed ? "bg-teal border-teal" : "bg-paper border-[#B8AE94]"} border`}
            >
              {agreed && <Check size={11} className="text-paper" />}
            </span>
            <span className="text-[11.5px] leading-snug text-ink">
              <span className="text-teal underline">安全ガイドライン</span>{" "}
              に同意します（複数人参加・公共の場所での初対面など）
            </span>
          </button>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>

        <div className="px-4 py-3.5 shrink-0" style={{ borderTop: "1px solid #DFD5BC" }}>
          <button
            onClick={onSubmit}
            disabled={!agreed || loading}
            className={`w-full rounded-lg py-3 text-sm font-semibold ${agreed ? "bg-amber text-night" : "bg-[#DDD5C0] text-[#A69F8C] cursor-not-allowed"}`}
          >
            {loading ? "投稿中…" : "募集を投稿する"}
          </button>
          {!agreed && (
            <p className="text-[10.5px] text-center mt-1.5 text-stone">
              ガイドラインに同意すると投稿できます
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
