"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, MapPin, Check } from "lucide-react";
import { accentClass } from "@/components/theme-icons";

interface RecruitPost {
  id: number;
  title: string;
  scheduledAt: string;
  capacity: number;
  offlineMeet: boolean;
  participantCount: number;
  joinedByMe: boolean;
  createdBy: { id: number; name: string; avatarInitial: string; avatarColor: string };
}

const POLL_INTERVAL_MS = 6000;

function formatScheduledAt(iso: string): string {
  const d = new Date(iso);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]}) ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function RecruitPostList({ roomId }: { roomId: number }) {
  const [posts, setPosts] = useState<RecruitPost[]>([]);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  async function load() {
    const res = await fetch(`/api/recruit-posts?roomId=${roomId}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function join(postId: number) {
    setJoiningId(postId);
    const res = await fetch(`/api/recruit-posts/${postId}/join`, { method: "POST" });
    setJoiningId(null);
    if (res.ok) await load();
  }

  if (posts.length === 0) return null;

  return (
    <div className="px-4 pt-3 shrink-0">
      <p className="text-[11px] font-semibold mb-2 text-stone">募集中のイベント</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
        {posts.map((p) => {
          const full = p.participantCount >= p.capacity;
          return (
            <div
              key={p.id}
              className="shrink-0 w-[168px] rounded-xl px-3 py-2.5 bg-[#EFE8D8] border border-[#DFD5BC]"
            >
              <p className="text-[12px] font-semibold leading-snug text-ink line-clamp-2 min-h-[2.4em]">
                {p.title}
              </p>
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-stone">
                <Calendar size={10} />
                {formatScheduledAt(p.scheduledAt)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1 text-[10px] text-stone">
                  <Users size={10} />
                  {p.participantCount}/{p.capacity}人
                  {p.offlineMeet && <MapPin size={10} className="text-teal ml-0.5" />}
                </div>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${accentClass(p.createdBy.avatarColor)} text-night`}
                  title={p.createdBy.name}
                >
                  {p.createdBy.avatarInitial}
                </div>
              </div>
              <button
                disabled={p.joinedByMe || full || joiningId === p.id}
                onClick={() => join(p.id)}
                className="w-full mt-2 rounded-lg py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1"
                style={{
                  background: p.joinedByMe ? "#DFD5BC" : full ? "#DDD5C0" : "#E8A33D",
                  color: p.joinedByMe ? "#5A4A20" : full ? "#A69F8C" : "#1E2340",
                  cursor: p.joinedByMe || full ? "default" : "pointer",
                }}
              >
                {p.joinedByMe ? (
                  <>
                    <Check size={11} />
                    参加済み
                  </>
                ) : full ? (
                  "満員"
                ) : joiningId === p.id ? (
                  "参加中…"
                ) : (
                  "参加する"
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
