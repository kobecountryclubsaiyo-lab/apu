"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, User, ShieldCheck } from "lucide-react";
import type { PublicUser } from "@/lib/serialize";

export default function NavBar({ user }: { user: PublicUser | null }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!user) return null;

  return (
    <div className="w-full max-w-sm flex items-center justify-between px-1 pb-3 text-paper text-xs">
      <Link href="/themes" className="flex items-center gap-1.5 font-semibold">
        <Users size={14} className="text-amber" />
        テーマ一覧
      </Link>
      <div className="flex items-center gap-3">
        {user.isAdmin && (
          <Link href="/admin/rooms" className="flex items-center gap-1 text-[#C9C3B4]">
            <ShieldCheck size={13} />
            承認待ち
          </Link>
        )}
        <Link href="/profile" className="flex items-center gap-1 text-[#C9C3B4]">
          <User size={13} />
          {user.name}
        </Link>
        <button onClick={logout} className="text-[#8D87A0] underline">
          ログアウト
        </button>
      </div>
    </div>
  );
}
