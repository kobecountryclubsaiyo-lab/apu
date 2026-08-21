"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

interface PendingRoom {
  id: number;
  name: string;
  description: string;
  themeName: string;
  createdByName: string;
}

export default function PendingRoomList({ rooms }: { rooms: PendingRoom[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(rooms);

  async function decide(id: number, status: "APPROVED" | "REJECTED") {
    const res = await fetch(`/api/admin/rooms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setPending((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    }
  }

  if (pending.length === 0) {
    return <p className="px-6 py-8 text-center text-sm text-stone">承認待ちの部屋はありません</p>;
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {pending.map((room) => (
        <div key={room.id} className="rounded-xl px-4 py-3 bg-[#EFE8D8] border border-[#DFD5BC]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-[#DFD5BC] text-stone">
              {room.themeName}
            </span>
          </div>
          <p className="text-sm font-semibold text-ink">{room.name}</p>
          {room.description && <p className="text-xs mt-1 text-stone">{room.description}</p>}
          <p className="text-[10.5px] mt-1.5 text-stone">作成者: {room.createdByName}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => decide(room.id, "APPROVED")}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold bg-teal text-paper"
            >
              <Check size={13} />
              承認する
            </button>
            <button
              onClick={() => decide(room.id, "REJECTED")}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold bg-[#DFD5BC] text-ink"
            >
              <X size={13} />
              却下する
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
