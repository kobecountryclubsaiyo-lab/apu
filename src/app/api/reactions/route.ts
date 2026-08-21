import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, ApiError, handleApiError } from "@/lib/api-helpers";

// app-specification.md 4章: また遊びたい／楽しかった／面白かった
const reactionSchema = z.object({
  toUserId: z.number().int(),
  type: z.enum(["AGAIN", "FUN", "INTERESTING"]),
  recruitPostId: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = reactionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
    }
    const { toUserId, type, recruitPostId } = parsed.data;

    if (toUserId === user.id) {
      throw new ApiError(400, "自分にリアクションはできません");
    }

    // 面識のない相手へのリアクションを防ぐため、同じ部屋のメンバー同士か確認する
    const sharedRoom = await prisma.roomMembership.findFirst({
      where: {
        userId: user.id,
        room: { memberships: { some: { userId: toUserId } } },
      },
    });
    if (!sharedRoom) {
      throw new ApiError(403, "同じ部屋に参加しているユーザーにのみリアクションできます");
    }

    const reaction = await prisma.reaction.upsert({
      where: {
        fromUserId_toUserId_recruitPostId_type: {
          fromUserId: user.id,
          toUserId,
          recruitPostId: recruitPostId ?? 0,
          type,
        },
      },
      update: {},
      create: { fromUserId: user.id, toUserId, type, recruitPostId: recruitPostId ?? 0 },
    });

    return NextResponse.json({ reaction }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
