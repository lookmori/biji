import { NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  await initDB();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // 获取完整用户信息
  const result = await sql`SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ${user.id}`;
  if (result.length === 0) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: result[0] });
}
