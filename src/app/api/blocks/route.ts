import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, ApiError, handleApiError } from "@/lib/api-helpers";

const blockSchema = z.object({ targetUserId: z.number().int() });

/** ブロックする（report-block-prototype.jsx）。同じ部屋にいる相手のみブロックできる。 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = blockSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
    }
    const { targetUserId } = parsed.data;

    if (targetUserId === user.id) {
      throw new ApiError(400, "自分自身はブロックできません");
    }

    const sharedRoom = await prisma.roomMembership.findFirst({
      where: {
        userId: user.id,
        room: { memberships: { some: { userId: targetUserId } } },
      },
    });
    if (!sharedRoom) {
      throw new ApiError(403, "同じ部屋に参加しているユーザーにのみブロックできます");
    }

    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: targetUserId } },
      update: {},
      create: { blockerId: user.id, blockedId: targetUserId },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
