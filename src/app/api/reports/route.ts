import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, ApiError, handleApiError } from "@/lib/api-helpers";

// app-specification.md 5章: 通報・ブロック機能
const reportSchema = z.object({
  targetUserId: z.number().int(),
  roomId: z.number().int().optional(),
  recruitPostId: z.number().int().optional(),
  reason: z.string().trim().min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = reportSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "通報内容を入力してください" }, { status: 400 });
    }
    const { targetUserId, roomId, recruitPostId, reason } = parsed.data;

    if (targetUserId === user.id) {
      throw new ApiError(400, "自分自身は通報できません");
    }

    const report = await prisma.report.create({
      data: { reporterId: user.id, targetUserId, roomId, recruitPostId, reason },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
