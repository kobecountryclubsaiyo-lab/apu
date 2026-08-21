import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, ApiError, handleApiError } from "@/lib/api-helpers";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const recruitPostId = Number(params.id);

    const post = await prisma.recruitPost.findUnique({
      where: { id: recruitPostId },
      include: { _count: { select: { participants: true } } },
    });
    if (!post) return NextResponse.json({ error: "募集が見つかりません" }, { status: 404 });

    const membership = await prisma.roomMembership.findUnique({
      where: { userId_roomId: { userId: user.id, roomId: post.roomId } },
    });
    if (!membership) throw new ApiError(403, "この部屋に参加していません");

    if (post._count.participants >= post.capacity) {
      throw new ApiError(409, "定員に達しています");
    }

    await prisma.recruitParticipant.upsert({
      where: { recruitPostId_userId: { recruitPostId, userId: user.id } },
      update: {},
      create: { recruitPostId, userId: user.id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
