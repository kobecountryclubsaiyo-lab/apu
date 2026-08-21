import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { publicUser } from "@/lib/serialize";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const roomId = Number(params.id);
  if (!Number.isInteger(roomId)) {
    return NextResponse.json({ error: "不正なIDです" }, { status: 400 });
  }

  const [room, user] = await Promise.all([
    prisma.room.findUnique({
      where: { id: roomId },
      include: {
        theme: true,
        _count: { select: { memberships: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!room || room.status !== "APPROVED") {
    return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
  }

  const isMember = user
    ? (await prisma.roomMembership.findUnique({
        where: { userId_roomId: { userId: user.id, roomId } },
      })) !== null
    : false;

  return NextResponse.json({
    room: {
      id: room.id,
      name: room.name,
      description: room.description,
      theme: { id: room.theme.id, name: room.theme.name, slug: room.theme.slug },
      memberCount: room._count.memberships,
      createdAt: room.createdAt,
    },
    currentUser: user ? publicUser(user) : null,
    isMember,
  });
}
