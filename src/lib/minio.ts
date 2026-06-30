import { Client } from "minio";

const BUCKET = "biji-uploads";

// MinIO 客户端（S3 兼容）
export const minioClient = new Client({
  endPoint: "www.minio.lookmori.cn",
  port: 9000,        // S3 API 端口（9001 是 Console 端口）
  useSSL: false,
  accessKey: "minioadmin",
  secretKey: "minioadmin",
});

// 确保 bucket 存在
export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET, "us-east-1");
    // 设置公开读策略
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(BUCKET, JSON.stringify(policy));
  }
}

// 上传文件，返回公开访问 URL
export async function uploadToMinio(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  await ensureBucket();

  const objectName = `${Date.now()}-${filename}`;
  const encodedFilename = encodeURIComponent(filename);

  await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, {
    "Content-Type": mimeType || "application/octet-stream",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
  });

  // 代理 URL（相对路径，适配任何域名和 HTTPS）
  return `/api/files/${BUCKET}/${objectName}`;
}

/** 从 MinIO 删除文件（兼容新旧 URL 格式） */
export async function deleteFromMinio(url: string): Promise<boolean> {
  try {
    let objectName: string;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      // 旧格式：http(s)://domain:port/biji-uploads/xxx
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      // pathParts: ["biji-uploads", "timestamp-filename"]
      objectName = decodeURIComponent(pathParts.slice(1).join("/"));
    } else if (url.startsWith("/api/files/")) {
      // 新代理格式：/api/files/biji-uploads/xxx
      const afterPrefix = url.slice("/api/files/".length);
      const segs = afterPrefix.split("/");
      objectName = decodeURIComponent(segs.slice(1).join("/"));
    } else if (url.startsWith("/uploads/")) {
      // 本地存储兜底（不归 MinIO 管，不报错）
      return false;
    } else {
      console.warn("[minio] Unrecognized URL format:", url);
      return false;
    }

    if (!objectName) return false;

    await minioClient.removeObject(BUCKET, objectName);
    return true;
  } catch (err) {
    console.warn("[minio] delete failed:", err);
    return false;
  }
}
