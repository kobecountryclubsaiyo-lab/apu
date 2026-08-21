import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const themes = await prisma.theme.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      rooms: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { memberships: true } } },
      },
    },
  });
  return NextResponse.json({ themes });
}
