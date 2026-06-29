import { NextRequest, NextResponse } from "next/server";
import { uploadToMinio, deleteFromMinio } from "@/lib/minio";
import { sql, initDB } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const noteId = formData.get("noteId") as string | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name || "file";
    const mimeType = file.type || "application/octet-stream";

    let url: string;

    try {
      url = await uploadToMinio(buffer, filename, mimeType);
    } catch (minioErr) {
      console.warn("[upload] MinIO 不可用，降级到本地存储:", minioErr);
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      const localName = `${Date.now()}-${filename}`;
      await writeFile(path.join(uploadsDir, localName), buffer);
      url = `/uploads/${localName}`;
    }

    // 记录上传文件与笔记的关联
    if (noteId && noteId !== "new") {
      try {
        await initDB();
        await sql`
          INSERT INTO note_uploads (note_id, url) VALUES (${noteId}::uuid, ${url})
        `;
      } catch (e) { /* 非关键 */ }
    }

    return NextResponse.json({ url, filename, size: buffer.length });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// DELETE — 删除 MinIO 文件
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const ok = await deleteFromMinio(url);
  return NextResponse.json({ ok, deleted: ok });
}
