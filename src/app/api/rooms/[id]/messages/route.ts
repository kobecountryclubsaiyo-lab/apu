import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, ApiError, handleApiError } from "@/lib/api-helpers";

const MESSAGE_PAGE_SIZE = 50;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const roomId = Number(params.id);
  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    take: MESSAGE_PAGE_SIZE,
    include: { user: true },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.createdAt,
      user: {
        id: m.user.id,
        name: m.user.name,
        avatarInitial: m.user.avatarInitial,
        avatarColor: m.user.avatarColor,
      },
    })),
  });
}

const sendMessageSchema = z.object({ text: z.string().trim().min(1).max(1000) });

async function assertMember(userId: number, roomId: number) {
  const membership = await prisma.roomMembership.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  if (!membership) throw new ApiError(403, "この部屋に参加していません");
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const roomId = Number(params.id);
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status !== "APPROVED") {
      return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
    }
    await assertMember(user.id, roomId);

    const parsed = sendMessageSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "メッセージを入力してください" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { roomId, userId: user.id, text: parsed.data.text },
      include: { user: true },
    });

    return NextResponse.json(
      {
        message: {
          id: message.id,
          text: message.text,
          createdAt: message.createdAt,
          user: {
            id: message.user.id,
            name: message.user.name,
            avatarInitial: message.user.avatarInitial,
            avatarColor: message.user.avatarColor,
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
