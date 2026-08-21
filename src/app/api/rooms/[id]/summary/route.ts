import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError } from "@/lib/api-helpers";
import { summarizeChat } from "@/lib/summarize";

const RECENT_MESSAGES_FOR_SUMMARY = 30;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const roomId = Number(params.id);
  const cached = await prisma.chatSummary.findUnique({ where: { roomId } });
  return NextResponse.json({
    points: cached ? (JSON.parse(cached.points) as string[]) : null,
    updatedAt: cached?.updatedAt ?? null,
  });
}

/** AIが話題を整理し直す（app-specification.md 2章・7章「AIが話題を整理」機能） */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const roomId = Number(params.id);

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
