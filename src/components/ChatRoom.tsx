"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Users, Sparkles, ArrowRight, ArrowUp } from "lucide-react";
import { ICONS_BY_KEY, accentClass } from "@/components/theme-icons";
import type { PublicUser } from "@/lib/serialize";

const POLL_INTERVAL_MS = 4000;

interface ChatMessage {
  id: number;
  text: string;
  createdAt: string;
  user: { id: number; name: string; avatarInitial: string; avatarColor: string };
}

export default function ChatRoom({
  room,
  currentUser,
}: {
  room: { id: number; name: string; themeName: string; themeIcon: string; memberCount: number };
  currentUser: PublicUser;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const Icon = ICONS_BY_KEY[room.themeIcon] ?? ICONS_BY_KEY.default;

  async function loadMessages() {
    const res = await fetch(`/api/rooms/${room.id}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
  }

  async function loadSummary() {
    const res = await fetch(`/api/rooms/${room.id}/summary`);
    if (res.ok) {
      const data = await res.json();
      if (data.points) setSummary(data.points);
    }
  }

  useEffect(() => {
    loadMessages();
    loadSummary();
    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    const res = await fetch(`/api/rooms/${room.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) await loadMessages();
  }

  async function regenerateSummary() {
    setSummarizing(true);
    const res = await fetch(`/api/rooms/${room.id}/summary`, { method: "POST" });
    setSummarizing(false);
    if (res.ok) {
      const data = await res.json();
      setSummary(data.points);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0F1226]">
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col bg-paper text-ink shadow-2xl"
        style={{ height: "700px" }}
      >
        <div className="px-4 pt-5 pb-4 flex items-center gap-3 shrink-0 bg-night text-paper">
          <Link href="/themes">
            <ChevronLeft size={20} className="text-[#C9C3B4]" />
          </Link>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-amber">
            <Icon size={17} className="text-night" />
          </div>
          <div className="min-w-0">
            <p className="text-sm leading-tight truncate font-heading font-bold">{room.name}</p>
            <p className="text-[11px] mt-0.5 flex items-center gap-1 text-[#8D87A0]">
              <Users size={10} />
              {room.themeName} ・ {room.memberCount}人が参加中
            </p>
          </div>
        </div>

        <div className="px-4 pt-4 shrink-0">
          <div className="rounded-xl px-4 py-3.5 bg-[#EFE8D8] border-l-[3px] border-teal">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold flex items-center gap-1.5 text-teal">
                <Sparkles size={12} />
                AIが整理した話題
              </p>
              <button
                onClick={regenerateSummary}
                disabled={summarizing}
                className="text-[10px] text-stone underline disabled:opacity-50"
              >
                {summarizing ? "整理中…" : "更新する"}
              </button>
            </div>
            {summary ? (
              <ul className="space-y-1 mb-3">
                {summary.map((pt) => (
                  <li key={pt} className="text-[12px] leading-snug flex gap-1.5 text-ink">
                    <span className="text-stone">・</span>
                    {pt}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-stone mb-3">
                「更新する」を押すと、会話から話題を整理します
              </p>
            )}
            <Link
              href={`/rooms/${room.id}/recruit/new`}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold bg-amber text-night"
            >
              募集をつくる
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
          {messages.map((m) => {
            const self = m.user.id === currentUser.id;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${self ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-night ${accentClass(m.user.avatarColor)}`}
                >
                  {m.user.avatarInitial}
                </div>
                <div className={`flex flex-col ${self ? "items-end" : "items-start"} max-w-[72%]`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {!self && <span className="text-[10px] text-stone">{m.user.name}</span>}
                    <span className="font-mono text-stone text-[9.5px]">
                      {new Date(m.createdAt).toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl text-[12.5px] leading-snug ${
                      self
                        ? "bg-teal text-paper rounded-br"
                        : "bg-[#EFE8D8] text-ink rounded-bl"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={sendMessage}
          className="px-4 py-3 shrink-0 bg-[#EFE8D8]"
          style={{ borderTop: "1px solid #DFD5BC" }}
        >
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="メッセージを入力"
              className="flex-1 rounded-full px-4 py-2 text-[12px] bg-paper border border-[#DFD5BC] outline-none placeholder:text-stone"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-amber"
            >
              <ArrowUp size={15} className="text-night" />
            </button>
          </div>
          <p className="text-[10px] text-center mt-2 text-stone">
            個人情報のやり取りには気をつけましょう
          </p>
        </form>
      </div>
    </div>
  );
}
