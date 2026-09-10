import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/api-helpers";

const patchSchema = z.object({ status: z.enum(["REVIEWED", "DISMISSED"]) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const reportId = Number(params.id);
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "status が不正です" }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id: reportId },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ report });
  } catch (err) {
    return handleApiError(err);
  }
}
