import { NextRequest, NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const url = new URL(req.url);
  const folderId = url.searchParams.get("folderId") || null;
  const favorite = url.searchParams.get("favorite") === "true";
  const searchTerm = url.searchParams.get("search") || null;
  const showDeleted = url.searchParams.get("deleted") === "true";
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "20"), 50);
  const offset = (page - 1) * pageSize;

  const searchPattern = searchTerm ? `%${searchTerm}%` : null;

  // 先查总数
  const countResult = await sql`
    SELECT COUNT(*) as total FROM notes n
    WHERE n.user_id = ${user.id}
      AND n.is_deleted = ${showDeleted}
      AND (${folderId}::uuid IS NULL OR n.folder_id = ${folderId}::uuid)
      AND (${favorite} = false OR n.is_favorite = true)
      AND (${searchPattern}::text IS NULL
           OR n.title ILIKE ${searchPattern}
           OR n.content ILIKE ${searchPattern})
  `;
  const total = Number(countResult[0].total);

  const result = await sql`
    SELECT n.id, n.folder_id, n.title, n.is_favorite, n.is_deleted, n.created_at, n.updated_at
    FROM notes n
    WHERE n.user_id = ${user.id}
      AND n.is_deleted = ${showDeleted}
      AND (${folderId}::uuid IS NULL OR n.folder_id = ${folderId}::uuid)
      AND (${favorite} = false OR n.is_favorite = true)
      AND (${searchPattern}::text IS NULL
           OR n.title ILIKE ${searchPattern}
           OR n.content ILIKE ${searchPattern})
    ORDER BY n.updated_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  // 获取 canvas 标记
  const noteIds = result.map((r: any) => r.id);
  const canvasMap: Record<string, string[]> = {};
  if (noteIds.length > 0) {
    const cr = await sql`
      SELECT note_id, canvas_type FROM canvas_records
      WHERE note_id = ANY(${noteIds})
    `;
    cr.forEach((r: any) => {
      if (!canvasMap[r.note_id]) canvasMap[r.note_id] = [];
      canvasMap[r.note_id].push(r.canvas_type);
    });
  }

  return NextResponse.json({
    notes: result.map((r: any) => ({ ...r, canvasTypes: canvasMap[r.id] || [] })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(req: NextRequest) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { title, content, folderId } = await req.json();

  const result = await sql`
    INSERT INTO notes (user_id, folder_id, title, content)
    VALUES (${user.id}, ${folderId || null}, ${title || "未命名笔记"}, ${content || ""})
    RETURNING *
  `;
  return NextResponse.json({ note: result[0] }, { status: 201 });
}
