import { NextResponse } from "next/server";
import { minioClient, uploadToMinio } from "@/lib/minio";

export async function GET() {
  const results: string[] = [];
  const errors: string[] = [];

  // 1. 测试连接
  try {
    const buckets = await minioClient.listBuckets();
    results.push(`✅ 连接成功！已有 ${buckets.length} 个 Bucket: ${buckets.map((b) => b.name).join(", ") || "(无)"}`);
  } catch (err: any) {
    errors.push(`❌ 连接失败: ${err.message}`);
    return NextResponse.json({ results, errors, ok: false });
  }

  // 2. 测试上传
  try {
    const testContent = Buffer.from(`BIJI MinIO 测试上传 — ${new Date().toISOString()}`);
    const url = await uploadToMinio(testContent, "test.txt", "text/plain");
    results.push(`✅ 上传成功！文件地址: ${url}`);
  } catch (err: any) {
    errors.push(`❌ 上传失败: ${err.message}`);
  }

  // 3. 测试文件是否可读取
  try {
    const testContent2 = Buffer.from("可访问性测试");
    const url2 = await uploadToMinio(testContent2, "access-test.txt", "text/plain");
    // 从代理 URL 提取 objectName，用 statObject 验证
    const objectName = url2.replace("/api/files/biji-uploads/", "");
    const stat = await minioClient.statObject("biji-uploads", objectName);
    results.push(`✅ 文件可读取！大小: ${stat.size} bytes, 代理 URL: ${url2}`);
  } catch (err: any) {
    errors.push(`⚠️ 可访问性测试失败: ${err.message}`);
  }

  return NextResponse.json({ results, errors, ok: errors.length === 0 });
}
