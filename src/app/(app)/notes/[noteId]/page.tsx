"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, DotsThree, Spinner, FloppyDisk, Star, Trash, Share, Check, X, Warning } from "@phosphor-icons/react";
import Link from "next/link";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { RichEditor } from "@/components/editor/RichEditor";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/auth/AuthContext";
import { FloatingPanel } from "@/components/layout/FloatingPanel";
import { Dialog } from "@/components/ui/dialog-manager";

type EditorMode = "edit" | "preview";
type ToastType = "success" | "error" | "info";

export default function NoteEditPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.noteId as string;
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<EditorMode>("edit");
  const [title, setTitle] = useState("未命名笔记");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState<"saved" | "saving" | "error">("saved");
  const [loading, setLoading] = useState(noteId !== "new");
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentNoteId = useRef(noteId);
  const prevMediaCount = useRef(0);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!user || noteId === "new") { setLoading(false); return; }
    setLoading(true);
    api.notes.get(noteId)
      .then((data) => {
        setTitle(data.note.title || "未命名笔记");
        setContent(data.note.content || "");
        setIsFavorite(data.note.is_favorite || false);
        currentNoteId.current = data.note.id;
      })
      .catch(() => router.push("/notes"))
      .finally(() => setLoading(false));
  }, [noteId, user, router]);

  const doSave = useCallback(async (t: string, c: string, silent = false) => {
    if (!user) return;
    setSaving("saving");
    try {
      if (currentNoteId.current === "new") {
        const data = await api.notes.create({ title: t, content: c });
        currentNoteId.current = data.note.id;
        router.replace(`/notes/${data.note.id}`);
        if (!silent) showToast("success", "笔记已创建");
      } else {
        await api.notes.update(currentNoteId.current, { title: t, content: c });
        window.dispatchEvent(new CustomEvent("biji:note-updated"));
        if (!silent) showToast("success", "保存成功");
      }
      setSaving("saved");
    } catch (err: any) {
      setSaving("error");
      if (!silent) showToast("error", err.message || "保存失败");
    }
  }, [user, router, showToast]);

  const autoSave = useCallback((t: string, c: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving("saving");
    const mediaRegex = /(?:src|href)\s*=\s*["'][^"']*(?:\/uploads\/|biji-uploads|117\.72\.47\.130)[^"']*["']/gi;
    const currentCount = (c.match(mediaRegex) || []).length;
    if (currentCount !== prevMediaCount.current) {
      prevMediaCount.current = currentCount;
      doSave(t, c, true);
      return;
    }
    prevMediaCount.current = currentCount;
    saveTimer.current = setTimeout(() => doSave(t, c, true), 2000);
  }, [doSave]);

  const toggleFavorite = useCallback(async () => {
    if (currentNoteId.current === "new") return;
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    try { await api.notes.update(currentNoteId.current, { isFavorite: newVal } as any); }
    catch { setIsFavorite(!newVal); }
  }, [isFavorite]);

  const handleDelete = useCallback(async () => {
    if (currentNoteId.current === "new") return;
    const ok = await Dialog.confirm("笔记将移入回收站，7 天内可恢复。确定删除吗？", { title: "删除笔记", confirmLabel: "删除" });
    if (!ok) return;
    try {
      await api.notes.update(currentNoteId.current, { isFavorite: false, isDeleted: true } as any);
      window.dispatchEvent(new CustomEvent("biji:note-updated"));
      showToast("success", "已移入回收站");
      setTimeout(() => router.push("/notes"), 500);
    } catch { showToast("error", "删除失败"); }
  }, [showToast, router]);

  const handleShare = useCallback(async () => {
    if (currentNoteId.current === "new") return;
    try {
      const res = await fetch(`/api/notes/${currentNoteId.current}/share`, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        await navigator.clipboard.writeText(window.location.origin + data.url);
        showToast("success", "分享链接已复制到剪贴板");
      }
    } catch { showToast("error", "分享失败"); }
  }, [showToast]);

  const manualSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    doSave(title, content, false);
  }, [title, content, doSave]);

  const handleTitleChange = (t: string) => { setTitle(t); autoSave(t, content); };
  const handleContentChange = (c: string) => { setContent(c); autoSave(title, c); };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.url) showToast("info", `已插入 ${detail.alt || "图形"} — 自动保存中...`);
    };
    window.addEventListener("biji:insert-image", handler);
    return () => window.removeEventListener("biji:insert-image", handler);
  }, [showToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); manualSave(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [manualSave]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const previewHtml = useMemo(() => content, [content]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center py-40"><Spinner size={28} className="animate-spin text-muted/30" /></div>;
  }

  const saveStatus = {
    saved: { color: "text-green", dot: "bg-green", text: "已保存" },
    saving: { color: "text-yellow", dot: "bg-yellow animate-pulse", text: "保存中..." },
    error: { color: "text-red", dot: "bg-red", text: "保存失败" },
  }[saving];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/notes" className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-ink hover:bg-green-soft transition-colors" aria-label="返回列表"><ArrowLeft size={18} /></Link>
          <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} className="bg-transparent text-2xl font-bold text-ink border-none outline-none placeholder:text-muted/40" placeholder="未命名笔记" style={{ fontFamily: '"Songti SC", "STSong", "SimSun", serif' }} />
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold flex items-center gap-1.5 font-mono ${saveStatus.color}`}><span className={`w-2 h-2 rounded-full inline-block ${saveStatus.dot}`} />{saveStatus.text}</span>
          <button onClick={manualSave} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold bg-green-dark hover:bg-[#205541] text-white transition-all hover:-translate-y-0.5 shadow-m" title="手动保存 (Ctrl+S)"><FloppyDisk size={14} /><span className="hidden sm:inline">保存</span></button>
          <button onClick={toggleFavorite} className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all hover:-translate-y-0.5 ${isFavorite ? "bg-yellow text-ink shadow-m" : "bg-white border border-[#D2DBD4] text-muted hover:text-yellow hover:border-yellow"}`} title={isFavorite ? "取消收藏" : "收藏"}><Star size={16} weight={isFavorite ? "fill" : "regular"} /></button>
          <button onClick={handleShare} className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-[#D2DBD4] text-muted hover:text-green hover:border-green hover:bg-green-soft transition-all" title="分享笔记"><Share size={16} /></button>
          <button onClick={handleDelete} className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-[#D2DBD4] text-muted hover:text-red hover:border-red hover:bg-red/5 transition-all" title="删除笔记"><Trash size={16} /></button>
          <SegmentedControl options={[{ value: "edit", label: "编辑" }, { value: "preview", label: "预览" }]} value={mode} onChange={(v) => setMode(v as EditorMode)} />
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-ink hover:bg-green-soft transition-colors" aria-label="更多操作"><DotsThree size={18} /></button>
        </div>
      </div>

      {mode === "edit" && (
        <div className="bg-white rounded-2xl border border-line min-h-[60vh] overflow-hidden">
          <RichEditor content={content} onChange={handleContentChange} noteId={currentNoteId.current} placeholder="开始写作... Ctrl+S 保存 · 右下角悬浮球画图" />
          <div className="flex items-center justify-between px-6 py-2.5 border-t border-line bg-[#FAFBF8]">
            <span className="text-[10px] text-muted/50 font-mono">HTML 格式 · 自动保存 · Ctrl+S 手动保存</span>
            <span className="text-[10px] text-muted/50 font-mono">noteId: {currentNoteId.current}</span>
          </div>
        </div>
      )}

      {mode === "preview" && (
        <div className="bg-white rounded-2xl border border-line min-h-[60vh]">
          <div className="tiptap px-6 lg:px-8 py-6 leading-7 text-ink" style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif', lineHeight: "28px" }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      )}

      <FloatingPanel type="draw" noteId={currentNoteId.current} />
      <FloatingPanel type="flowChart" noteId={currentNoteId.current} />
      <FloatingPanel type="mindMap" noteId={currentNoteId.current} />

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl animate-rise text-sm font-semibold text-white"
          style={{ fontFamily: '"PingFang SC", sans-serif', background: toast.type === "success" ? "#173E31" : toast.type === "error" ? "#B94B3F" : "#17231F" }}>
          {toast.type === "success" ? <Check size={16} /> : toast.type === "error" ? <X size={16} /> : <Warning size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
