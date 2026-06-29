import { NextRequest, NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteFromMinio } from "@/lib/minio";
import { unlink } from "fs/promises";
import path from "path";

/** 从 HTML 内容中提取所有媒体 URL */
function extractMediaUrls(html: string): string[] {
  const urls: string[] = [];
  // 匹配 src="..." 或 href="..." 中的 MinIO(biji-uploads) 或本地 /uploads/ URL
  const regex = /(?:src|href)\s*=\s*["']([^"']*(?:\/uploads\/|biji-uploads|117\.72\.47\.130)[^"']*)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

// 获取单篇笔记
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const result = await sql`
    SELECT * FROM notes WHERE id = ${id} AND user_id = ${user.id}
  `;
  if (result.length === 0) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }

  // 同时获取 canvas 数据
  const cr = await sql`
    SELECT canvas_type, canvas_data, preview_image_url, panel_status
    FROM canvas_records WHERE note_id = ${id}
  `;

  return NextResponse.json({
    note: result[0],
    canvasRecords: cr,
  });
}

// 更新笔记（只更新传了的字段）
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // 先查出现有值
  const existing = await sql`
    SELECT title, content, folder_id, is_favorite, is_deleted
    FROM notes WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid
  `;
  if (existing.length === 0) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }

  const row = existing[0] as any;

  const result = await sql`
    UPDATE notes SET
      title = ${body.title !== undefined ? body.title : row.title},
      content = ${body.content !== undefined ? body.content : row.content},
      folder_id = ${body.folderId !== undefined ? body.folderId : row.folder_id}::uuid,
      is_favorite = ${body.isFavorite !== undefined ? body.isFavorite : row.is_favorite}::boolean,
      is_deleted = ${body.isDeleted !== undefined ? body.isDeleted : row.is_deleted}::boolean,
      deleted_at = CASE WHEN ${body.isDeleted !== undefined && body.isDeleted === true}::boolean
        THEN NOW() ELSE deleted_at END,
      updated_at = NOW()
    WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid
    RETURNING *
  `;

  // 清理已删除的媒体文件
  let cleanedCount = 0;

  // isDeleted=true 或 content 变化时触发清理
  const shouldCleanup = body.isDeleted === true || body.content !== undefined;
  if (shouldCleanup) {
    const newUrls = body.content !== undefined ? extractMediaUrls(body.content) : [];

    // 方案1: 对比旧内容差集
    const oldUrls = row.content ? extractMediaUrls(row.content) : [];
    const removedFromContent = body.isDeleted ? oldUrls : oldUrls.filter((u) => !newUrls.includes(u));

    // 方案2: 从 note_uploads 追踪表
    const tracked = await sql`SELECT url FROM note_uploads WHERE note_id = ${id}::uuid`;
    const trackedUrls = tracked.map((r: any) => r.url);
    const removedFromTracked = body.isDeleted ? trackedUrls : trackedUrls.filter((u) => !newUrls.includes(u));

    const allRemoved = [...new Set([...removedFromContent, ...removedFromTracked])];

    if (allRemoved.length > 0) {
      console.log(`[cleanup] Removing ${allRemoved.length} files from note ${id} (deleted=${body.isDeleted}, content diff: ${removedFromContent.length}, tracked: ${removedFromTracked.length})`);
      const results = await Promise.allSettled(
        allRemoved.map(async (url) => {
          let ok = false;
          if (url.startsWith("/uploads/")) {
            try { await unlink(path.join(process.cwd(), "public", url)); ok = true; } catch {}
          } else {
            ok = await deleteFromMinio(url);
          }
          if (ok) {
            try { await sql`DELETE FROM note_uploads WHERE note_id = ${id}::uuid AND url = ${url}`; } catch {}
          }
          return ok;
        })
      );
      cleanedCount = results.filter((r) => r.status === "fulfilled" && r.value).length;
      console.log(`[cleanup] Done: ${cleanedCount}/${allRemoved.length} files deleted`);
    }
  }

  return NextResponse.json({ note: result[0], cleaned: cleanedCount });
}

// 永久删除笔记
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDB();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;

  // 删除前先清理所有媒体文件
  const note = await sql`SELECT content FROM notes WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid`;
  if (note.length > 0) {
    const urls = extractMediaUrls(note[0].content || "");
    const tracked = await sql`SELECT url FROM note_uploads WHERE note_id = ${id}::uuid`;
    const allUrls = [...new Set([...urls, ...tracked.map((r: any) => r.url)])];
    await Promise.allSettled(allUrls.map(async (url) => {
      if (url.startsWith("/uploads/")) {
        try { await unlink(path.join(process.cwd(), "public", url)); } catch {}
      } else {
        await deleteFromMinio(url);
      }
    }));
  }

  await sql`DELETE FROM notes WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid`;
  return NextResponse.json({ ok: true });
}
