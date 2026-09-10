import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/api-helpers";

/** 未対応の通報一覧（app-specification.md 5章：通報・ブロック機能） */
export async function GET() {
  try {
    await requireAdmin();
    const reports = await prisma.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      include: { reporter: true, targetUser: true, room: true },
    });
    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        createdAt: r.createdAt,
        reporter: { id: r.reporter.id, name: r.reporter.name },
        targetUser: { id: r.targetUser.id, name: r.targetUser.name },
        roomName: r.room?.name ?? null,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
