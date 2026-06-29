import { NextRequest, NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    const result = await sql`SELECT id, email, name, password_hash FROM users WHERE email = ${email}`;
    if (result.length === 0) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const user = result[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const token = await signToken({ id: user.id, email: user.email, name: user.name });
    await setAuthCookie(token);

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error("[login]", err);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
