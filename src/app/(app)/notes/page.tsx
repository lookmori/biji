"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { Plus, Note, TreeStructure, FlowArrow, ImageSquare, MagnifyingGlass, Spinner, ArrowCounterClockwise, Trash } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Pagination } from "@/components/ui/Pagination";
import { api, type Note as NoteType } from "@/lib/api-client";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog-manager";

type NoteView = "all" | "favorite" | "recent";

function NotesContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deletedParam = searchParams.get("deleted") === "true";

  const [view, setView] = useState<NoteView>("all");
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const isTrash = deletedParam;

  useEffect(() => { if (!authLoading && !user) router.push("/auth/login"); }, [user, authLoading, router]);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.notes.list({
        favorite: view === "favorite" ? true : undefined,
        search: search || undefined,
        page, pageSize: 20,
        deleted: isTrash || undefined,
      });
      setNotes(data.notes);
      setPagination(data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [view, search, page, isTrash]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);
  useEffect(() => { setPage(1); }, [view, search, isTrash]);

  // 监听侧栏删除/更新事件，刷新列表
  useEffect(() => {
    const handler = () => fetchNotes();
    window.addEventListener("biji:note-updated", handler);
    return () => window.removeEventListener("biji:note-updated", handler);
  }, [fetchNotes]);

  const createNote = async () => {
    try { const data = await api.notes.create({}); router.push(`/notes/${data.note.id}`); } catch {}
  };

  // Ctrl+N 新建笔记
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") { e.preventDefault(); createNote(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 恢复笔记
  const restoreNote = async (id: string) => {
    await api.notes.update(id, { isDeleted: false } as any);
    fetchNotes();
  };

  // 永久删除
  const permDelete = async (id: string) => {
    const ok = await Dialog.confirm("永久删除后无法恢复，确定吗？", { title: "永久删除", confirmLabel: "删除" });
    if (!ok) return;
    await api.notes.delete(id);
    fetchNotes();
  };

  // 清空回收站
  const emptyTrash = async () => {
    const ok = await Dialog.confirm("回收站中的所有笔记将被永久删除，确定吗？", { title: "清空回收站", confirmLabel: "清空" });
    if (!ok) return;
    for (const n of notes) { await api.notes.delete(n.id); }
    fetchNotes();
  };

  if (authLoading) return null;

  const canvasIcon = (types: string[]) => {
    const icons: Record<string, React.ReactNode> = { mindMap: <TreeStructure size={12} />, flowChart: <FlowArrow size={12} />, draw: <ImageSquare size={12} /> };
    const labels: Record<string, string> = { mindMap: "脑图", flowChart: "流程图", draw: "手绘" };
    return types.map((t, i) => (
      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-soft text-[11px] font-semibold text-green">{icons[t]}{labels[t]}</span>
    ));
  };

  const timeAgo = (t: string) => {
    const diff = Date.now() - new Date(t).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    return `${Math.floor(hours / 24)} 天前`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs tracking-[0.14em] uppercase text-muted font-mono mb-2">{isTrash ? "TRASH" : "WORKSPACE"}</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-ink" style={{ fontFamily: '"Songti SC", "STSong", "SimSun", serif' }}>
            {isTrash ? "回收站" : "我的笔记"}
          </h1>
        </div>
        {isTrash ? (
          notes.length > 0 && (
            <button onClick={emptyTrash} className="inline-flex items-center gap-2 h-[46px] px-5 rounded-xl bg-red hover:bg-[#A64036] text-white text-sm font-bold transition-all shadow-m"
              style={{ fontFamily: '"PingFang SC", sans-serif' }}>
              <Trash size={17} />清空回收站
            </button>
          )
        ) : (
          <button onClick={createNote} className="inline-flex items-center gap-2 h-[46px] px-5 rounded-xl bg-green-dark hover:bg-[#205541] text-white text-sm font-bold transition-all hover:-translate-y-0.5 shadow-m"
            style={{ fontFamily: '"PingFang SC", sans-serif' }}>
            <Plus size={17} />新建笔记
          </button>
        )}
      </div>

      {!isTrash && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <SegmentedControl options={[
            { value: "all", label: "全部" },
            { value: "favorite", label: "收藏" },
            { value: "recent", label: "最近" },
          ]} value={view} onChange={(v) => setView(v as NoteView)} />
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="搜索笔记..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-input-bg border border-[#D4DDD6] text-sm font-semibold text-ink placeholder:text-muted/40 outline-none focus:border-green focus:ring-3 focus:ring-green/15 transition-colors"
              style={{ fontFamily: '"PingFang SC", sans-serif' }} />
          </div>
        </div>
      )}

      {loading && <div className="flex items-center justify-center py-20"><Spinner size={24} className="animate-spin text-muted/40" /></div>}

      {!loading && notes.length === 0 && (
        <div className="text-center py-20">
          <Note size={40} className="mx-auto text-muted/20 mb-4" />
          <p className="text-muted/50 font-semibold text-sm">{isTrash ? "回收站为空" : search ? "没有匹配的笔记" : "还没有笔记"}</p>
        </div>
      )}

      {!loading && notes.length > 0 && (
        <>
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-2xl border border-line px-6 py-4 transition-all hover:shadow-l hover:border-[#9FB5A7]">
                <div className="flex items-center gap-3">
                  {isTrash ? (
                    <>
                      <Note size={18} className="text-muted/40 flex-shrink-0" />
                      <h3 className="flex-1 text-base font-bold text-muted/60 truncate" style={{ fontFamily: '"Songti SC", serif' }}>{note.title || "未命名笔记"}</h3>
                      <span className="text-xs text-muted/40 font-mono flex-shrink-0">{note.deleted_at ? timeAgo(note.deleted_at) : ""}</span>
                      <button onClick={() => restoreNote(note.id)} className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-green hover:bg-green-soft transition-colors">
                        <ArrowCounterClockwise size={13} />恢复
                      </button>
                      <button onClick={() => permDelete(note.id)} className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-red hover:bg-red/5 transition-colors">
                        <Trash size={13} />删除
                      </button>
                    </>
                  ) : (
                    <Link href={`/notes/${note.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <Note size={18} className="text-green flex-shrink-0" weight="fill" />
                      <h3 className="flex-1 text-base font-bold text-ink truncate" style={{ fontFamily: '"Songti SC", serif' }}>{note.title || "未命名笔记"}</h3>
                      <span className="text-xs text-muted/50 font-mono flex-shrink-0">{timeAgo(note.updated_at)}</span>
                      {canvasIcon(note.canvasTypes)}
                      {note.is_favorite && <span className="text-yellow text-xs flex-shrink-0">⭐</span>}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={(p) => setPage(p)} />
        </>
      )}
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size={24} className="animate-spin text-muted/40" /></div>}>
      <NotesContent />
    </Suspense>
  );
}
