import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError } from "@/lib/api-helpers";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const roomId = Number(params.id);
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status !== "APPROVED") {
      return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
    }

    await prisma.roomMembership.upsert({
      where: { userId_roomId: { userId: user.id, roomId } },
      update: {},
      create: { userId: user.id, roomId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
