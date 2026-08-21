import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, ChevronRight, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicUser } from "@/lib/serialize";
import NavBar from "@/components/NavBar";
import { ICONS_BY_KEY, accentClass } from "@/components/theme-icons";

export default async function ThemeSelectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const themes = await prisma.theme.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      rooms: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { memberships: true } } },
      },
    },
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-6 bg-[#0F1226]">
      <NavBar user={publicUser(user)} />
      <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col bg-paper text-ink shadow-2xl h-[760px]">
        <div className="px-5 pt-6 pb-5 shrink-0 bg-night text-paper">
          <p className="font-heading font-bold text-lg">テーマを選ぶ</p>
          <p className="text-[11px] mt-1 text-[#C9C3B4]">
            気になる話題から、少人数のグループに参加できます
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {themes.map((theme) => {
            const Icon = ICONS_BY_KEY[theme.icon] ?? ICONS_BY_KEY.default;
            return (
              <div key={theme.id}>
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <p className="text-xs font-semibold text-stone">{theme.name}</p>
                  <Link
                    href={`/themes/${theme.id}/rooms/new`}
                    className="flex items-center gap-1 text-[10.5px] text-teal"
                  >
                    <Plus size={11} />
                    部屋をつくる
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {theme.rooms.length === 0 && (
                    <p className="text-[11px] text-stone px-1">まだ部屋がありません</p>
                  )}
                  {theme.rooms.map((room) => (
                    <Link
                      key={room.id}
                      href={`/rooms/${room.id}`}
                      className="theme-card w-full text-left rounded-xl px-3.5 py-3 flex items-center gap-3 bg-[#EFE8D8] border border-[#DFD5BC] block hover:-translate-y-0.5 transition-transform"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accentClass(theme.accentColor)}`}
                      >
                        <Icon size={18} className="text-night" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold truncate text-ink">
                            {room.name}
                          </p>
                        </div>
                        {room.description && (
                          <p className="text-[10.5px] mt-0.5 truncate text-stone">
                            {room.description}
                          </p>
                        )}
                        <p className="text-[9.5px] mt-1 flex items-center gap-1 text-teal">
                          <Users size={9} />
                          {room._count.memberships}人が参加中
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-stone shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
