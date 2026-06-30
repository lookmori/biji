import { NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";
import { minioClient, deleteFromMinio } from "@/lib/minio";

const BUCKET = "biji-uploads";

/** 从 HTML 提取所有 media URL */
function extractUrls(html: string): string[] {
  if (!html) return [];
  const regex = /(?:src|href)\s*=\s*["']([^"']*(?:\/uploads\/|biji-uploads|117\.72\.47\.130)[^"']*)["']/gi;
  const urls: string[] = [];
  let m;
  while ((m = regex.exec(html)) !== null) urls.push(m[1]);
  return urls;
}

export async function GET() {
  await initDB();

  // 1. 收集所有笔记内容中的 URL
  const notes = await sql`SELECT id, content FROM notes`;
  const contentUrls = new Set<string>();
  for (const n of notes as any[]) {
    for (const u of extractUrls(n.content || "")) {
      contentUrls.add(u);
    }
  }

  // 2. 收集追踪表中的 URL
  const tracked = await sql`SELECT url FROM note_uploads`;
  for (const t of tracked as any[]) contentUrls.add(t.url);

  // 3. 扫描 MinIO bucket
  const objects: string[] = [];
  try {
    const stream = minioClient.listObjects(BUCKET, "", true);
    for await (const obj of stream) {
      if (obj.name) objects.push(obj.name);
    }
  } catch (err: any) {
    return NextResponse.json({
      error: `无法列出 MinIO 文件: ${err.message}`,
      referencedCount: contentUrls.size,
    }, { status: 500 });
  }

  // 4. 从所有 URL 提取 objectName，按名称比较（兼容多种 URL 格式）
  function extractObjectName(url: string): string | null {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        const parts = new URL(url).pathname.split("/").filter(Boolean);
        return decodeURIComponent(parts.slice(1).join("/"));
      } catch { return null; }
    }
    if (url.includes("biji-uploads/")) {
      const idx = url.indexOf("biji-uploads/") + "biji-uploads/".length;
      return decodeURIComponent(url.slice(idx));
    }
    return null;
  }

  const referencedObjects = new Set<string>();
  for (const url of contentUrls) {
    const name = extractObjectName(url);
    if (name) referencedObjects.add(name);
  }

  // 5. 找出孤儿文件（按 objectName 比较）
  const orphans: string[] = [];
  for (const objName of objects) {
    if (!referencedObjects.has(objName)) {
      orphans.push(objName);
    }
  }

  // 6. 删除孤儿文件
  let deleted = 0;
  const failed: string[] = [];
  for (const objName of orphans) {
    const delUrl = `/api/files/${BUCKET}/${objName}`;
    const ok = await deleteFromMinio(delUrl);
    if (ok) deleted++;
    else failed.push(objName);
  }

  return NextResponse.json({
    totalInMinio: objects.length,
    referencedUrls: contentUrls.size,
    orphansFound: orphans.length,
    deleted,
    failed,
    orphanFiles: orphans.slice(0, 20), // 只显示前20个
  });
}
