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

  // 公开 URL
  return `http://www.minio.lookmori.cn:9000/${BUCKET}/${objectName}`;
}

/** 从 MinIO 删除文件 */
export async function deleteFromMinio(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    // URL-decode：中文文件名被 encodeURI → 需解码才能匹配 MinIO 中的实际文件名
    const objectName = decodeURIComponent(pathParts.slice(2).join("/"));
    if (!objectName) return false;

    await minioClient.removeObject(BUCKET, objectName);
    return true;
  } catch (err) {
    console.warn("[minio] delete failed:", err);
    return false;
  }
}
