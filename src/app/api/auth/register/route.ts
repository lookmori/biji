import { NextRequest, NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    // 检查重复
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: "邮箱已注册" }, { status: 409 });
    }

    const hash = await hashPassword(password);
    const result = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${hash}, ${name || email.split("@")[0]})
      RETURNING id, email, name
    `;
    const user = result[0];

    const token = await signToken({ id: user.id, email: user.email, name: user.name });
    await setAuthCookie(token);

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error("[register]", err);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
