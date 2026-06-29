"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import { createLowlight, common } from "lowlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Node } from "@tiptap/core";
import { useEffect, useCallback } from "react";
import { EditorToolbar } from "./EditorToolbar";
import { useMediaUpload } from "./useMediaUpload";
import { Dialog } from "@/components/ui/dialog-manager";

const lowlight = createLowlight(common);

// ---- 自定义节点：Canvas 图形 ----
const CanvasFigure = Node.create({
  name: "canvasFigure",
  group: "block", atom: true,
  addAttributes() {
    return { src: { default: "" }, alt: { default: "Canvas 图形" }, canvasType: { default: "draw" } };
  },
  parseHTML() {
    return [{
      tag: 'div[data-canvas-figure]',
      getAttrs: (dom) => {
        if (typeof dom === "string") return {};
        const el = dom as HTMLElement;
        const img = el.querySelector("img");
        return {
          src: img?.getAttribute("src") || el.getAttribute("data-src") || "",
          alt: img?.getAttribute("alt") || el.getAttribute("data-alt") || "Canvas 图形",
        };
      },
    }];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, alt, canvasType } = HTMLAttributes;
    const labels: Record<string, string> = { draw: "手绘", mindMap: "思维导图", flowChart: "流程图" };
    const icons: Record<string, string> = { draw: "✏️", mindMap: "🧠", flowChart: "🔀" };
    if (!src) {
      return ["div", { "data-canvas-figure": "", class: "canvas-figure-placeholder" },
        ["div", { class: "canvas-figure-inner" },
          ["span", { class: "canvas-figure-icon" }, icons[canvasType] || "🖼"],
          ["span", {}, labels[canvasType] || "图形"],
        ]];
    }
    return ["div", { "data-canvas-figure": "", class: "canvas-figure" },
      ["img", { src, alt, class: "canvas-figure-img" }],
      ["div", { class: "canvas-figure-caption" }, ["span", {}, alt]]];
  },
});

// ---- 自定义节点：视频（真实 <video> 播放器）----
const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block", atom: true,
  addAttributes() { return { src: { default: "" }, title: { default: "" } }; },
  parseHTML() { return [{ tag: 'div[data-video-embed]' }]; },
  renderHTML({ HTMLAttributes }) {
    const { src, title } = HTMLAttributes;
    const children: any[] = [];
    if (src) {
      children.push(["video", { src, controls: "true", playsinline: "true", preload: "metadata",
        class: "video-embed-player", style: "width:100%;max-height:400px;display:block;" }]);
    } else {
      children.push(["div", { class: "video-embed-placeholder" },
        ["span", { class: "video-embed-icon" }, "▶"],
        ["span", {}, title || "视频"],
      ]);
    }
    if (title) {
      children.push(["div", { class: "canvas-figure-caption" }, ["span", {}, title]]);
    }
    return ["div", { "data-video-embed": "", class: "video-embed" }, ...children];
  },
});

// ---- 自定义节点：音频（真实 <audio> 播放器）----
const AudioEmbed = Node.create({
  name: "audioEmbed",
  group: "block", atom: true,
  addAttributes() { return { src: { default: "" }, title: { default: "" } }; },
  parseHTML() { return [{ tag: 'div[data-audio-embed]' }]; },
  renderHTML({ HTMLAttributes }) {
    const { src, title } = HTMLAttributes;
    const children: any[] = [["span", { class: "audio-embed-icon" }, "🎵"]];
    if (src) {
      children.push(["audio", { src, controls: "true", preload: "metadata",
        class: "audio-embed-player", style: "width:100%;" }]);
    } else {
      children.push(["span", {}, title || "音频"]);
    }
    if (title) {
      children.push(["span", { class: "audio-embed-title" }, title]);
    }
    return ["div", { "data-audio-embed": "", class: "audio-embed" }, ...children];
  },
});

// ---- 组件 ----
interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  noteId?: string;
}

export function RichEditor({ content, onChange, placeholder, noteId }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: { levels: [1, 2, 3] } }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ allowBase64: true, inline: false }),
      TaskList, TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
      Placeholder.configure({ placeholder: placeholder || "开始写作..." }),
      CanvasFigure, VideoEmbed, AudioEmbed,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm lg:prose-base max-w-none focus:outline-none min-h-[50vh] px-6 lg:px-8 py-6 leading-7 text-ink",
        style: 'font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif; line-height: 28px;',
      },
    },
    immediatelyRender: false,
  });

  const { inputRef, handleFileChange, triggerUpload, handleDrop, handleDragOver, handlePaste, uploading } =
    useMediaUpload(editor, noteId);

  // 监听 Canvas 插入事件
  const handleInsertCanvasImage = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.url || !editor) return;

      const src = detail.url;
      const alt = detail.alt || "Canvas 图形";
      const canvasType = detail.canvasType || "draw";
      const icons: Record<string, string> = { draw: "✏️", mindMap: "🧠", flowChart: "🔀" };
      const labels: Record<string, string> = { draw: "手绘", mindMap: "思维导图", flowChart: "流程图" };

      // 直接用 HTML 插入，比 setNode 更可靠
      const html = `
        <div data-canvas-figure="" class="canvas-figure">
          <img src="${src}" alt="${alt}" class="canvas-figure-img" />
          <div class="canvas-figure-caption">
            <span>${icons[canvasType] || "🖼"} ${labels[canvasType] || "图形"}</span>
          </div>
        </div>
      `;

      editor.chain().focus().insertContent(html).run();
    },
    [editor]
  );

  useEffect(() => {
    window.addEventListener("biji:insert-image", handleInsertCanvasImage);
    return () => window.removeEventListener("biji:insert-image", handleInsertCanvasImage);
  }, [handleInsertCanvasImage]);

  return (
    <div className="flex flex-col" onDrop={handleDrop} onDragOver={handleDragOver}>
      {/* 隐藏的文件上传 input */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        multiple
      />

      {/* 工具栏 */}
      <EditorToolbar editor={editor} onTriggerUpload={triggerUpload} />

      {/* 多媒体快捷按钮 */}
      <div
        className="flex items-center gap-1 px-3 py-1.5 border-b border-line bg-[#FAFBF8] flex-shrink-0 overflow-x-auto"
        style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
      >
        <MediaBtn icon="🖼" label="图片" onClick={() => triggerUpload("image")} />
        <MediaBtn icon="▶" label="视频" onClick={() => triggerUpload("video")} />
        <MediaBtn icon="🎵" label="音频" onClick={() => triggerUpload("audio")} />
        <MediaBtn icon="📎" label="文件" onClick={() => triggerUpload("file")} />
        <span className="w-px h-5 bg-line mx-1" />
        {uploading ? (
          <span className="text-[10px] text-yellow font-semibold animate-pulse">⏳ 上传中...</span>
        ) : (
          <span className="hidden sm:inline text-[10px] text-muted/40 font-mono">
            支持拖拽上传 · 粘贴图片 · 点击选择文件
          </span>
        )}
      </div>

      {/* 编辑器 */}
      <div onPaste={handlePaste}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function MediaBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-muted hover:text-ink hover:bg-green-soft transition-colors"
      aria-label={`上传${label}`}
      title={`上传本地${label}文件`}
      style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
