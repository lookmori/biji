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

  // 4. 找出孤儿文件
  const orphans: string[] = [];
  for (const objName of objects) {
    const url = `https://117.72.47.130:9000/${BUCKET}/${objName}`;
    if (!contentUrls.has(url)) {
      orphans.push(objName);
    }
  }

  // 5. 删除孤儿文件
  let deleted = 0;
  const failed: string[] = [];
  for (const objName of orphans) {
    const url = `https://117.72.47.130:9000/${BUCKET}/${objName}`;
    const ok = await deleteFromMinio(url);
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
