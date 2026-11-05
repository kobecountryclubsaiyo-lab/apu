import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Prisma, type User } from "@prisma/client";

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

/** URLの `[id]` セグメントを正の整数として検証する。不正な値は 400 として扱う。 */
export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "不正なIDです");
  }
  return id;
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  // 存在しないID等を直接Prismaに渡してしまった場合の保険（各ルートの入力検証が一次防御）
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "対象が見つかりません" }, { status: 404 });
    }
    if (err.code === "P2003") {
      return NextResponse.json({ error: "指定されたデータが存在しません" }, { status: 400 });
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
}
