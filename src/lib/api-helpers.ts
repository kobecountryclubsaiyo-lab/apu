import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@prisma/client";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "ログインが必要です");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!user.isAdmin) throw new ApiError(403, "管理者のみ実行できます");
  return user;
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
}
