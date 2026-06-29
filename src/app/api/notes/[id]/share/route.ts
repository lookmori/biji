import { NextRequest, NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

// POST — 生成分享链接
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const token = crypto.randomBytes(16).toString("hex");

  const result = await sql`
    UPDATE notes SET share_token = ${token} WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid
    RETURNING share_token
  `;
  if (result.length === 0) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });

  return NextResponse.json({ shareToken: token, url: `/share/${token}` });
}

// DELETE — 取消分享
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  await sql`UPDATE notes SET share_token = NULL WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid`;
  return NextResponse.json({ ok: true });
}
