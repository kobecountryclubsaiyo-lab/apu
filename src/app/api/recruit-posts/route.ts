import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, ApiError, handleApiError } from "@/lib/api-helpers";
import { MIN_RECRUIT_CAPACITY, MAX_RECRUIT_CAPACITY } from "@/lib/rules";

export async function GET(req: NextRequest) {
  const roomId = Number(req.nextUrl.searchParams.get("roomId"));
  if (!Number.isInteger(roomId)) {
    return NextResponse.json({ error: "roomId が必要です" }, { status: 400 });
  }

  const posts = await prisma.recruitPost.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: true, _count: { select: { participants: true } } },
  });

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      scheduledAt: p.scheduledAt,
      capacity: p.capacity,
      offlineMeet: p.offlineMeet,
      participantCount: p._count.participants,
      createdAt: p.createdAt,
      createdBy: {
        id: p.createdBy.id,
        name: p.createdBy.name,
        avatarInitial: p.createdBy.avatarInitial,
        avatarColor: p.createdBy.avatarColor,
      },
    })),
  });
}

// 安全設計（app-specification.md 5章）：
// - 定員は3人以上必須（1対1の出会いを防ぐ）
// - 安全ガイドラインへの同意が必須
const createRecruitPostSchema = z.object({
  roomId: z.number().int(),
  title: z.string().trim().min(1).max(80),
  scheduledAt: z.coerce.date(),
  capacity: z.number().int().min(MIN_RECRUIT_CAPACITY).max(MAX_RECRUIT_CAPACITY),
  offlineMeet: z.boolean(),
  guidelineAgreed: z.literal(true, {
    errorMap: () => ({ message: "安全ガイドラインへの同意が必要です" }),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = createRecruitPostSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" },
        { status: 400 }
      );
    }
    const { roomId, title, scheduledAt, capacity, offlineMeet } = parsed.data;

    const membership = await prisma.roomMembership.findUnique({
      where: { userId_roomId: { userId: user.id, roomId } },
    });
    if (!membership) throw new ApiError(403, "この部屋に参加していません");

    const post = await prisma.recruitPost.create({
      data: {
        roomId,
        createdById: user.id,
        title,
        scheduledAt,
        capacity,
        offlineMeet,
        guidelineAgreed: true,
        participants: { create: { userId: user.id } },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
