import { NextRequest, NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// 获取画布数据
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { noteId } = await params;
  const type = new URL(req.url).searchParams.get("type") || "draw";

  const result = await sql`
    SELECT * FROM canvas_records
    WHERE note_id = ${noteId} AND canvas_type = ${type}
  `;
  return NextResponse.json({ record: result[0] || null });
}

// 保存画布数据
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { noteId } = await params;
  const { canvasType, canvasData, previewImageUrl, panelStatus } = await req.json();

  if (!canvasType) {
    return NextResponse.json({ error: "缺少 canvasType" }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO canvas_records (note_id, canvas_type, canvas_data, preview_image_url, panel_status)
    VALUES (${noteId}, ${canvasType}, ${JSON.stringify(canvasData || {})}, ${previewImageUrl || ""}, ${panelStatus || "min"})
    ON CONFLICT (note_id, canvas_type)
    DO UPDATE SET
      canvas_data = EXCLUDED.canvas_data,
      preview_image_url = EXCLUDED.preview_image_url,
      panel_status = EXCLUDED.panel_status,
      updated_at = NOW()
    RETURNING *
  `;
  return NextResponse.json({ record: result[0] });
}

// 删除画布数据
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { noteId } = await params;
  const { canvasType } = await req.json();
  await sql`DELETE FROM canvas_records WHERE note_id = ${noteId} AND canvas_type = ${canvasType}`;
  return NextResponse.json({ ok: true });
}
