import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { publicUser } from "@/lib/serialize";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user: user ? publicUser(user) : null });
}
