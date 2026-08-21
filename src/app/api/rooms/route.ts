import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError } from "@/lib/api-helpers";
import { canAutoApproveRoom } from "@/lib/rules";

const createRoomSchema = z.object({
  themeId: z.number().int(),
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(300).optional(),
});

/**
 * 部屋の新規作成（app-specification.md 3章）。
 * 新規ユーザーは運営承認が必要、信頼スタンプ（オフライン参加＋リアクション）が
 * 一定貯まったユーザーは承認なしで自由に部屋を作成できる。
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = createRoomSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
    }
    const { themeId, name, description } = parsed.data;

    const reactionCount = await prisma.reaction.count({ where: { toUserId: user.id } });
    const autoApprove = canAutoApproveRoom(user.offlineMeetCount, reactionCount);

    const room = await prisma.room.create({
      data: {
        themeId,
        name,
        description: description ?? "",
        createdById: user.id,
        status: autoApprove ? "APPROVED" : "PENDING",
        memberships: { create: { userId: user.id } },
      },
    });

    return NextResponse.json({ room, autoApproved: autoApprove }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
