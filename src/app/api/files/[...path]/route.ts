import { NextRequest, NextResponse } from "next/server";
import { minioClient } from "@/lib/minio";

const BUCKET = "biji-uploads";

// MIME 类型决定是否 inline 显示
function isInlineType(mimeType: string): boolean {
  return /^(image|video|audio)\//.test(mimeType) || mimeType === "application/pdf";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // 安全校验
  if (!path || path.length < 2) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (path.some((seg) => seg === ".." || seg.includes("/") || seg.includes("\\"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const bucketName = path[0];
  if (bucketName !== BUCKET) {
    return NextResponse.json({ error: "Unknown bucket" }, { status: 400 });
  }

  const objectName = path.slice(1).join("/");

  try {
    // 获取文件元数据
    const stat = await minioClient.statObject(BUCKET, objectName);
    const mimeType =
      (stat.metaData["content-type"] as string) || "application/octet-stream";
    const disposition = isInlineType(mimeType) ? "inline" : "attachment";

    // 提取原始文件名（去掉时间戳前缀）
    const originalName = objectName.replace(/^\d+-/, "");

    // 获取文件流
    const nodeStream = await minioClient.getObject(BUCKET, objectName);

    return new NextResponse(nodeStream as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(stat.size),
        "Content-Disposition":
          `${disposition}; filename*=UTF-8''${encodeURIComponent(originalName)}`,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: stat.etag || "",
      },
    });
  } catch (err: any) {
    if (err?.code === "NoSuchKey") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    console.error("[files proxy]", err);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 502 }
    );
  }
}
