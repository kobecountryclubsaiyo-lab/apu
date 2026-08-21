import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { publicUser } from "@/lib/serialize";

const AVATAR_COLORS = ["amber", "teal", "clay"];

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "パスワードは8文字以上にしてください"),
  name: z.string().trim().min(1, "名前を入力してください").max(40),
  headline: z.string().trim().max(120).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = signupSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" },
      { status: 400 }
    );
  }
  const { email, password, name, headline } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "このメールアドレスは既に登録されています" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      headline: headline ?? "",
      avatarInitial: name.slice(0, 1),
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    },
  });

  await createSession(user.id);
  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}
