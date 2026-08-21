import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicUser } from "@/lib/serialize";
import NavBar from "@/components/NavBar";
import PendingRoomList from "@/components/PendingRoomList";

export default async function AdminRoomsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/themes");

  const rooms = await prisma.room.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { theme: true, createdBy: true },
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-6 bg-[#0F1226]">
      <NavBar user={publicUser(user)} />
      <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-paper text-ink shadow-2xl">
        <div className="px-5 pt-6 pb-5 bg-night text-paper">
          <p className="font-heading font-bold text-lg">部屋の承認待ち</p>
          <p className="text-[11px] mt-1 text-[#C9C3B4]">
            新規ユーザーが作成した部屋を確認・承認します
          </p>
        </div>
        <PendingRoomList
          rooms={rooms.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            themeName: r.theme.name,
            createdByName: r.createdBy.name,
          }))}
        />
      </div>
    </div>
  );
}
