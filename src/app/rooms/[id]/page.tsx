import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicUser } from "@/lib/serialize";
import ChatRoom from "@/components/ChatRoom";

export default async function RoomPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const roomId = Number(params.id);
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { theme: true },
  });
  if (!room || room.status !== "APPROVED") notFound();

  // テーマの部屋一覧から開くと、そのまま部屋に参加する（app-specification.md 2章）
  await prisma.roomMembership.upsert({
    where: { userId_roomId: { userId: user.id, roomId } },
    update: {},
    create: { userId: user.id, roomId },
  });
  const memberCount = await prisma.roomMembership.count({ where: { roomId } });

  return (
    <ChatRoom
      room={{
        id: room.id,
        name: room.name,
        themeName: room.theme.name,
        themeIcon: room.theme.icon,
        memberCount,
      }}
      currentUser={publicUser(user)}
    />
  );
}
