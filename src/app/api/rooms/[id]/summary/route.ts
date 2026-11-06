import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, parseId, ApiError, handleApiError } from "@/lib/api-helpers";
import { summarizeChat } from "@/lib/summarize";

const RECENT_MESSAGES_FOR_SUMMARY = 30;

async function assertMember(userId: number, roomId: number) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || room.status !== "APPROVED") {
    throw new ApiError(404, "部屋が見つかりません");
  }
  const membership = await prisma.roomMembership.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  if (!membership) throw new ApiError(403, "この部屋に参加していません");
}

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireUser();
    const roomId = parseId(params.id);
    await assertMember(user.id, roomId);

    const cached = await prisma.chatSummary.findUnique({ where: { roomId } });
    return NextResponse.json({
      points: cached ? (JSON.parse(cached.points) as string[]) : null,
      updatedAt: cached?.updatedAt ?? null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** AIが話題を整理し直す（app-specification.md 2章・7章「AIが話題を整理」機能） */
export async function POST(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireUser();
    const roomId = parseId(params.id);
    await assertMember(user.id, roomId);

    const recent = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      take: RECENT_MESSAGES_FOR_SUMMARY,
      include: { user: true },
    });
    const chronological = recent.reverse();

    const points = await summarizeChat(
      chronological.map((m) => ({ name: m.user.name, text: m.text, createdAt: m.createdAt }))
    );

    const saved = await prisma.chatSummary.upsert({
      where: { roomId },
      update: { points: JSON.stringify(points) },
      create: { roomId, points: JSON.stringify(points) },
    });

    return NextResponse.json({ points, updatedAt: saved.updatedAt });
  } catch (err) {
    return handleApiError(err);
  }
}
