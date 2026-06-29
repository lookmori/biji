import { NextResponse } from "next/server";
import { minioClient, uploadToMinio } from "@/lib/minio";
import { Client } from "minio";

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

  // 3. 测试文件是否可访问
  try {
    const testContent2 = Buffer.from("可访问性测试");
    const url2 = await uploadToMinio(testContent2, "access-test.txt", "text/plain");
    const response = await fetch(url2);
    if (response.ok) {
      const text = await response.text();
      results.push(`✅ 文件可公开访问！读取内容: "${text}"`);
    } else {
      errors.push(`⚠️ 文件上传成功但无法公开访问 (HTTP ${response.status})，请检查 Bucket 策略`);
    }
  } catch (err: any) {
    errors.push(`⚠️ 公开访问测试失败: ${err.message} (可能是自签名证书问题，浏览器访问时需手动信任)`);
  }

  return NextResponse.json({ results, errors, ok: errors.length === 0 });
}
