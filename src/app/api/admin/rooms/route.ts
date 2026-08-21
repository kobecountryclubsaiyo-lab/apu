import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/api-helpers";

/** 承認待ちの部屋一覧（app-specification.md 3章・8章：運営側の管理画面） */
export async function GET() {
  try {
    await requireAdmin();
    const rooms = await prisma.room.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { theme: true, createdBy: true },
    });
    return NextResponse.json({
      rooms: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        theme: { id: r.theme.id, name: r.theme.name },
        createdBy: { id: r.createdBy.id, name: r.createdBy.name },
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
