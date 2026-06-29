"use client";

import { useCallback, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

type MediaType = "image" | "video" | "audio" | "file";

const ACCEPT: Record<MediaType, string> = {
  image: "image/*",
  video: "video/mp4,video/webm,video/quicktime",
  audio: "audio/mp3,audio/wav,audio/ogg,audio/m4a",
  file: "*",
};

const MAX_SIZES: Record<MediaType, number> = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  file: 50 * 1024 * 1024,
};

/** 安全的文件名 */
function safeName(original: string): string {
  const ext = original.lastIndexOf(".") > 0
    ? original.substring(original.lastIndexOf("."))
    : "";
  const base = original.substring(0, original.lastIndexOf(".") > 0 ? original.lastIndexOf(".") : original.length);
  // 只保留字母数字和短横线
  const safe = base
    .replace(/[^a-zA-Z0-9一-鿿\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
  return `${safe || "file"}${ext}`;
}

/** 计算 SHA-256 哈希（用于去重） */
async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}

/** 图片压缩（quality 0.75，最大宽 2000px） */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 小于 500KB 不压缩
    if (file.size < 500 * 1024 || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const maxW = 2000;
      let w = img.width;
      let h = img.height;
      if (w > maxW) { h = (h * maxW) / w; w = maxW; }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(blob); // 压缩后更小才使用
          } else {
            resolve(file); // 否则用原图
          }
        },
        file.type,
        0.75
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export function useMediaUpload(editor: Editor | null, noteId?: string) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingType = useRef<MediaType>("image");
  const [uploading, setUploading] = useState(false);

  const uploadOne = useCallback(
    async (file: File, type: MediaType) => {
      if (!editor) return;

      const maxSize = MAX_SIZES[type];
      if (file.size > maxSize) {
        const mb = (maxSize / 1024 / 1024).toFixed(0);
        alert(`${type === "image" ? "图片" : type === "video" ? "视频" : "音频"}上限 ${mb}MB`);
        return;
      }

      setUploading(true);
      try {
        // 1. 图片压缩
        let body: Blob | File = file;
        if (type === "image") {
          body = await compressImage(file);
        }

        // 2. 计算哈希 + 安全文件名
        const buffer = await body.arrayBuffer();
        const hash = await sha256(buffer);
        const name = `${hash}-${safeName(file.name)}`;

        // 3. 上传（带 noteId 用于追踪）
        const formData = new FormData();
        formData.append("file", new Blob([buffer], { type: file.type }), name);
        if (noteId && noteId !== "new") formData.append("noteId", noteId);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const json = await res.json();
        const url = json.url as string;

        // 4. 插入编辑器
        switch (type) {
          case "image":
            editor.chain().focus().setImage({ src: url, alt: file.name }).run();
            break;
          case "video":
            editor.chain().focus().setNode("videoEmbed", { src: url, title: file.name }).run();
            break;
          case "audio":
            editor.chain().focus().setNode("audioEmbed", { src: url, title: file.name }).run();
            break;
          case "file":
            editor.chain().focus().insertContent({
              type: "paragraph",
              content: [
                { type: "text", text: `📎 ${file.name} ` },
                { type: "text", marks: [{ type: "link", attrs: { href: url } }], text: "下载" },
              ],
            }).run();
            break;
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("上传失败，请重试");
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  const triggerUpload = useCallback((type: MediaType) => {
    pendingType.current = type;
    const input = inputRef.current;
    if (input) {
      input.accept = ACCEPT[type];
      input.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const type = pendingType.current;
      for (let i = 0; i < files.length; i++) {
        uploadOne(files[i], type);
      }
      e.target.value = "";
    },
    [uploadOne]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (!files?.length) return;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.type.startsWith("image/")) uploadOne(f, "image");
        else if (f.type.startsWith("video/")) uploadOne(f, "video");
        else if (f.type.startsWith("audio/")) uploadOne(f, "audio");
        else uploadOne(f, "file");
      }
    },
    [uploadOne]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) uploadOne(file, "image");
        }
      }
    },
    [uploadOne]
  );

  return {
    inputRef,
    handleFileChange,
    triggerUpload,
    handleDrop,
    handleDragOver: (e: React.DragEvent) => e.preventDefault(),
    handlePaste,
    uploading,
  };
}
