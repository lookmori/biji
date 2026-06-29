import { NextRequest, NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// 获取文件夹树
export async function GET(req: NextRequest) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const result = await sql`
    SELECT id, parent_id, name, sort_order, created_at, updated_at
    FROM folders
    WHERE user_id = ${user.id}
    ORDER BY sort_order, created_at
  `;

  // 构建树形结构
  const rows = result;
  const map = new Map<string, any>();
  const roots: any[] = [];

  rows.forEach((r) => {
    map.set(r.id, { ...r, children: [] });
  });
  rows.forEach((r) => {
    const node = map.get(r.id);
    if (r.parent_id && map.has(r.parent_id)) {
      map.get(r.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return NextResponse.json({ folders: roots });
}

// 创建文件夹
export async function POST(req: NextRequest) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { name, parentId } = await req.json();
  const result = await sql`
    INSERT INTO folders (user_id, parent_id, name)
    VALUES (${user.id}, ${parentId || null}, ${name || "新建文件夹"})
    RETURNING id, parent_id, name, sort_order, created_at
  `;
  return NextResponse.json({ folder: result[0] });
}

// 更新文件夹（重命名/移动）
export async function PUT(req: NextRequest) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id, name, parentId, sortOrder } = await req.json();
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const result = await sql`
    UPDATE folders SET
      name = COALESCE(${name ?? null}, name),
      parent_id = COALESCE(${parentId ?? null}, parent_id),
      sort_order = COALESCE(${sortOrder ?? null}, sort_order),
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING *
  `;

  if (result.length === 0) {
    return NextResponse.json({ error: "文件夹不存在" }, { status: 404 });
  }
  return NextResponse.json({ folder: result[0] });
}

// 删除文件夹（级联删除其中的笔记）
export async function DELETE(req: NextRequest) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  // 先取出其中的笔记移到根目录
  await sql`UPDATE notes SET folder_id = NULL WHERE folder_id = ${id} AND user_id = ${user.id}`;
  // 子文件夹移到根目录
  await sql`UPDATE folders SET parent_id = NULL WHERE parent_id = ${id} AND user_id = ${user.id}`;
  // 删除
  await sql`DELETE FROM folders WHERE id = ${id} AND user_id = ${user.id}`;

  return NextResponse.json({ ok: true });
}
