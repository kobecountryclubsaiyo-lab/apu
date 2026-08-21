"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, headline, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "登録に失敗しました");
      return;
    }
    router.push("/themes");
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0F1226]">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-paper text-ink shadow-2xl">
        <div className="px-6 pt-6 pb-5 bg-night text-paper">
          <p className="font-heading font-bold text-lg">はじめまして</p>
          <p className="text-xs mt-1 text-[#C9C3B4]">
            フォロワーではなく、一緒に遊ぶ仲間を。
          </p>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-stone">
              ニックネーム
            </label>
            <input
              type="text"
              required
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none bg-[#EFE8D8] border border-[#DFD5BC]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-stone">
              ひとこと（任意）
            </label>
            <input
              type="text"
              maxLength={120}
              placeholder="週末は大体レイドかボドゲ。初心者歓迎！"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none bg-[#EFE8D8] border border-[#DFD5BC] placeholder:text-stone"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-stone">
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none bg-[#EFE8D8] border border-[#DFD5BC]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-stone">
              パスワード（8文字以上）
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none bg-[#EFE8D8] border border-[#DFD5BC]"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 text-sm font-semibold bg-amber text-night disabled:opacity-60"
          >
            {loading ? "登録中…" : "登録して始める"}
          </button>
          <p className="text-xs text-center text-stone">
            アカウントをお持ちの方は{" "}
            <Link href="/login" className="text-teal underline">
              ログイン
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
