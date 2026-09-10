"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

interface PendingReport {
  id: number;
  reason: string;
  createdAt: string;
  reporterName: string;
  targetUserName: string;
  roomName: string | null;
}

export default function ReportList({ reports }: { reports: PendingReport[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(reports);

  async function decide(id: number, status: "REVIEWED" | "DISMISSED") {
    const res = await fetch(`/api/admin/reports/${id}`, {
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
    return <p className="px-6 py-8 text-center text-sm text-stone">未対応の通報はありません</p>;
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {pending.map((r) => (
        <div key={r.id} className="rounded-xl px-4 py-3 bg-[#EFE8D8] border border-[#DFD5BC]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">
              {r.reporterName} → {r.targetUserName}
            </p>
            <span className="font-mono text-[10px] text-stone">
              {new Date(r.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
            </span>
          </div>
          {r.roomName && <p className="text-[10.5px] mt-1 text-stone">部屋: {r.roomName}</p>}
          <p className="text-xs mt-1.5 text-ink">{r.reason}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => decide(r.id, "REVIEWED")}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold bg-teal text-paper"
            >
              <Check size={13} />
              対応済みにする
            </button>
            <button
              onClick={() => decide(r.id, "DISMISSED")}
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
