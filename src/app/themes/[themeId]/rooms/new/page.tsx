"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";

export default function NewRoomPage() {
  const router = useRouter();
  const params = useParams<{ themeId: string }>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId: Number(params.themeId), name, description }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "作成に失敗しました");
      return;
    }
    if (data.autoApproved) {
      router.push(`/rooms/${data.room.id}`);
    } else {
      setNotice("部屋を作成しました。運営の承認後に一覧へ表示されます。");
    }
  }

  if (notice) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0F1226]">
        <div className="w-full max-w-sm rounded-2xl bg-paper text-ink shadow-2xl p-6 text-center space-y-4">
          <p className="text-sm">{notice}</p>
          <button
            onClick={() => router.push("/themes")}
            className="w-full rounded-lg py-3 text-sm font-semibold bg-amber text-night"
          >
            テーマ一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0F1226]">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-paper text-ink shadow-2xl">
        <div className="px-4 pt-5 pb-4 flex items-center gap-3 bg-night text-paper">
          <button onClick={() => router.back()}>
            <ChevronLeft size={20} className="text-[#C9C3B4]" />
          </button>
          <p className="text-sm font-heading font-bold">部屋をつくる</p>
        </div>
        <form onSubmit={onSubmit} className="px-4 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-stone">部屋名</label>
            <input
              type="text"
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 初心者歓迎レイド部屋"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none bg-[#EFE8D8] border border-[#DFD5BC] placeholder:text-stone"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-stone">説明（任意）</label>
            <textarea
              maxLength={300}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none bg-[#EFE8D8] border border-[#DFD5BC] resize-none"
            />
          </div>
          <div className="rounded-lg px-3 py-2.5 flex gap-2 bg-[#EAE2CF]">
            <Info size={13} className="text-teal shrink-0 mt-0.5" />
            <p className="text-[11px] leading-snug text-ink">
              信頼スタンプが一定貯まっていない場合、運営の承認後に表示されます。
            </p>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 text-sm font-semibold bg-amber text-night disabled:opacity-60"
          >
            {loading ? "作成中…" : "部屋をつくる"}
          </button>
        </form>
      </div>
    </div>
  );
}
