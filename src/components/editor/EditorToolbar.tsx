"use client";

import type { Editor } from "@tiptap/react";
import {
  TextHOne, TextHTwo, TextHThree, TextB, TextItalic, TextUnderline,
  Code, Table, Quotes, ListBullets, ListNumbers, LinkSimple, CheckSquare,
  ImageSquare, Minus,
} from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog-manager";

interface EditorToolbarProps {
  editor: Editor | null;
  onTriggerUpload?: (type: "image" | "video" | "audio" | "file") => void;
}

function ToolBtn({
  onClick,
  active = false,
  label,
  icon,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5
        ${active ? "bg-green-dark text-white shadow-s" : "text-muted hover:text-ink hover:bg-green-soft"}`}
      aria-label={label}
      title={label}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

export function EditorToolbar({ editor, onTriggerUpload }: EditorToolbarProps) {
  if (!editor) return null;

  // ---- 内联样式：每个按钮显式调用，保证 this 绑定正确 ----
  const bold = () => editor.chain().focus().toggleBold().run();
  const italic = () => editor.chain().focus().toggleItalic().run();
  const underline = () => editor.chain().focus().toggleUnderline().run();

  // ---- 标题 ----
  const h1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run();
  const h2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
  const h3 = () => editor.chain().focus().toggleHeading({ level: 3 }).run();

  // ---- 块级 ----
  const bulletList = () => editor.chain().focus().toggleBulletList().run();
  const orderedList = () => editor.chain().focus().toggleOrderedList().run();
  const taskList = () => editor.chain().focus().toggleTaskList().run();
  const blockquote = () => editor.chain().focus().toggleBlockquote().run();
  const codeBlock = () => editor.chain().focus().toggleCodeBlock().run();

  // ---- 插入 ----
  const insertTable = () =>
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  const insertImage = () => {
    // 直接触发本地上传
    onTriggerUpload?.("image");
  };

  const insertLink = async () => {
    const prev = editor.getAttributes("link").href || "";
    const url = await Dialog.prompt(prev ? "修改或清空链接：" : "输入链接 URL：", {
      title: prev ? "编辑链接" : "插入链接",
      placeholder: "https://example.com",
      defaultValue: prev,
      confirmLabel: "确定",
    });
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertHr = () => editor.chain().focus().setHorizontalRule().run();

  return (
    <div
      className="flex items-center gap-0.5 px-3 py-1.5 border-b border-line overflow-x-auto flex-shrink-0 flex-wrap"
      style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
    >
      {/* 标题 */}
      <ToolBtn label="H1" icon={<TextHOne size={16} />} active={editor.isActive("heading", { level: 1 })} onClick={h1} />
      <ToolBtn label="H2" icon={<TextHTwo size={16} />} active={editor.isActive("heading", { level: 2 })} onClick={h2} />
      <ToolBtn label="H3" icon={<TextHThree size={16} />} active={editor.isActive("heading", { level: 3 })} onClick={h3} />
      <span className="w-px h-5 bg-line mx-0.5" />

      {/* 内联样式 */}
      <ToolBtn label="粗体" icon={<TextB size={16} />} active={editor.isActive("bold")} onClick={bold} />
      <ToolBtn label="斜体" icon={<TextItalic size={16} />} active={editor.isActive("italic")} onClick={italic} />
      <ToolBtn label="下划线" icon={<TextUnderline size={16} />} active={editor.isActive("underline")} onClick={underline} />
      <span className="w-px h-5 bg-line mx-0.5" />

      {/* 块级元素 */}
      <ToolBtn label="列表" icon={<ListBullets size={16} />} active={editor.isActive("bulletList")} onClick={bulletList} />
      <ToolBtn label="编号" icon={<ListNumbers size={16} />} active={editor.isActive("orderedList")} onClick={orderedList} />
      <ToolBtn label="任务" icon={<CheckSquare size={16} />} active={editor.isActive("taskList")} onClick={taskList} />
      <ToolBtn label="引用" icon={<Quotes size={16} />} active={editor.isActive("blockquote")} onClick={blockquote} />
      <ToolBtn label="代码" icon={<Code size={16} />} active={editor.isActive("codeBlock")} onClick={codeBlock} />
      <span className="w-px h-5 bg-line mx-0.5" />

      {/* 插入 */}
      <ToolBtn label="表格" icon={<Table size={15} />} onClick={insertTable} />
      <ToolBtn label="图片" icon={<ImageSquare size={15} />} onClick={insertImage} />
      <ToolBtn label="链接" icon={<LinkSimple size={15} />} onClick={insertLink} />
      <ToolBtn label="分隔" icon={<Minus size={15} />} onClick={insertHr} />
    </div>
  );
}
