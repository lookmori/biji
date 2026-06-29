"use client";

import {
  Plus,
  FolderPlus,
  Note,
  Folder,
  Trash,
  CaretDown,
  CaretRight,
  MagnifyingGlass,
  Spinner,
} from "@phosphor-icons/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type Folder as FolderType, type Note as NoteType } from "@/lib/api-client";
import { useAuth } from "@/components/auth/AuthContext";
import { Dialog } from "@/components/ui/dialog-manager";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}


export function AppSidebar({ isOpen, onClose }: SidebarProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  const fetchFolders = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await api.folders.list();
      setFolders(data.folders);
    } catch (err) { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  // 监听笔记更新事件，刷新侧栏
  useEffect(() => {
    const handler = () => { fetchFolders(); setRefreshKey((k) => k + 1); };
    window.addEventListener("biji:note-updated", handler);
    return () => window.removeEventListener("biji:note-updated", handler);
  }, [fetchFolders]);

  const toggleFolder = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const createFolder = async () => {
    const name = await Dialog.prompt("输入文件夹名称：", {
      title: "新建文件夹",
      placeholder: "文件夹名称...",
      confirmLabel: "创建",
    });
    if (!name) return;
    try {
      await api.folders.create({ name });
      fetchFolders();
    } catch (err) { console.error(err); }
  };

  const createNote = async (folderId?: string) => {
    try {
      const data = await api.notes.create({ folderId });
      setRefreshKey((k) => k + 1);
      router.push(`/notes/${data.note.id}`);
    } catch (err) { console.error(err); }
  };

  const navItemClass = (active = false) =>
    `flex items-center gap-2.5 w-full px-3 py-[12px] rounded-xl text-sm font-semibold transition-all duration-200 text-left ${
      active
        ? "bg-green-dark text-white shadow-m"
        : "text-muted hover:text-ink hover:bg-green-soft"
    }`;

  const sidebarContent = (
    <aside className="w-[232px] h-full flex flex-col glass-sidebar border-r border-[#DCE3DD]">
      {/* 顶部操作 */}
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => createNote()}
            className="flex-1 flex items-center justify-center gap-2 h-[46px] rounded-xl bg-green-dark hover:bg-[#205541] text-white text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-m"
            style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
          >
            <Plus size={17} />
            新建笔记
          </button>
          <button
            onClick={createFolder}
            className="w-[46px] h-[46px] flex items-center justify-center rounded-xl border border-[#D2DBD4] hover:bg-[#EDF3EE] text-muted hover:text-ink transition-colors"
            aria-label="新建文件夹" title="新建文件夹"
          >
            <FolderPlus size={17} />
          </button>
        </div>

        {/* 快速搜索 */}
        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="筛选..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-input-bg border border-[#D4DDD6] text-xs font-semibold text-ink placeholder:text-muted focus:outline-none focus:border-green transition-colors"
            style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
          />
        </div>
      </div>

      {/* 分隔线 */}
      <div className="mx-5 border-t border-line" />

      {/* 文件夹树 */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-0.5">
        {/* 未归属文件夹的笔记 */}
        <RootNotes refreshKey={refreshKey} onCreateNote={createNote} />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size={18} className="animate-spin text-muted/30" />
          </div>
        ) : folders.length === 0 ? (
          <p className="text-center py-8 text-xs text-muted/40">点击 + 创建文件夹</p>
        ) : (
          folders.map((folder) => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              expanded={expanded}
              onToggle={toggleFolder}
              onCreateNote={createNote}
              onRefresh={fetchFolders}
              search={search}
              refreshKey={refreshKey}
            />
          ))
        )}
      </div>

      {/* 底部：回收站 */}
      <div className="px-5 py-4 border-t border-line">
        <Link href="/notes?deleted=true" className={navItemClass()}>
          <Trash size={17} />
          回收站
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* 桌面固定侧栏 */}
      <div className="hidden md:block">{sidebarContent}</div>

      {/* 移动抽屉 */}
      {isOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-[285px]">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}

/** 递归文件夹树项 */
function FolderTreeItem({
  folder, expanded, onToggle, onCreateNote, onRefresh, search, depth = 0, refreshKey = 0,
}: {
  folder: FolderType;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onCreateNote: (folderId?: string) => void;
  onRefresh: () => void;
  search: string;
  depth?: number;
  refreshKey?: number;
}) {
  const deleteFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await Dialog.confirm(`确定删除文件夹「${folder.name}」吗？其中的笔记将移入根目录。`, {
      title: "删除文件夹", confirmLabel: "删除",
    });
    if (!ok) return;
    try { await api.folders.delete(folder.id); onRefresh(); } catch {}
  };
  const isOpen = expanded.has(folder.id);
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);

  // 加载文件夹下的笔记
  useEffect(() => {
    if (!isOpen) return;
    setNotesLoaded(false);
    api.notes.list({ folderId: folder.id })
      .then((data) => setNotes(data.notes))
      .catch(() => {})
      .finally(() => setNotesLoaded(true));
  }, [isOpen, folder.id, refreshKey]);

  const filtered = search
    ? notes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))
    : notes;

  return (
    <div>
      <button
        onClick={() => onToggle(folder.id)}
        className="flex items-center gap-1.5 w-full px-2 py-[10px] rounded-xl text-sm font-semibold text-ink hover:bg-green-soft transition-colors text-left group"
        style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
      >
        {isOpen ? <CaretDown size={14} className="text-muted" /> : <CaretRight size={14} className="text-muted" />}
        <Folder size={17} className="text-muted" />
        <span className="flex-1 truncate">{folder.name}</span>
        <button onClick={deleteFolder} className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-muted/50 hover:text-red transition-all" title="删除文件夹">
          <Trash size={12} />
        </button>
      </button>

      {isOpen && (
        <div className="ml-2">
          {/* 子文件夹 */}
          {folder.children?.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              expanded={expanded}
              onToggle={onToggle}
              onCreateNote={onCreateNote}
              onRefresh={onRefresh}
              search={search}
              depth={depth + 1}
              refreshKey={refreshKey}
            />
          ))}

          {/* 文件夹下的笔记 */}
          {!notesLoaded && <p className="ml-5 py-2 text-[10px] text-muted/40">加载中...</p>}
          {filtered.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="flex items-center gap-2 ml-5 px-2 py-[10px] rounded-xl text-sm font-semibold text-muted hover:text-ink hover:bg-green-soft transition-colors"
              style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
            >
              <Note size={15} className={note.canvasTypes.length > 0 ? "text-green" : ""} />
              <span className="flex-1 truncate">{note.title || "未命名笔记"}</span>
            </Link>
          ))}

          {/* 在此文件夹新建笔记 */}
          <button
            onClick={() => onCreateNote(folder.id)}
            className="flex items-center gap-1.5 ml-5 px-2 py-[10px] rounded-xl text-xs font-semibold text-muted/50 hover:text-green hover:bg-green-soft transition-colors w-full text-left"
          >
            <Plus size={12} />新建笔记
          </button>
        </div>
      )}
    </div>
  );
}

/** 未归属文件夹的笔记 */
function RootNotes({ refreshKey, onCreateNote }: { refreshKey: number; onCreateNote: (folderId?: string) => void }) {
  const [notes, setNotes] = useState<NoteType[]>([]);

  const loadNotes = useCallback(() => {
    api.notes.list({ pageSize: 50 })
      .then((data) => setNotes(data.notes.filter((n) => !n.folder_id)))
      .catch(() => {});
  }, []);

  useEffect(() => { loadNotes(); }, [refreshKey, loadNotes]);

  const router = useRouter();

  const deleteNote = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    const ok = await Dialog.confirm("笔记将移入回收站，确定删除吗？", { title: "删除笔记", confirmLabel: "删除" });
    if (!ok) return;
    try {
      await api.notes.update(id, { isDeleted: true } as any);
      window.dispatchEvent(new CustomEvent("biji:note-updated"));
      loadNotes();
      if (window.location.pathname.includes(id)) router.push("/notes");
    } catch {}
  };

  if (notes.length === 0) return null;

  return (
    <div className="mb-2">
      {notes.map((note) => (
        <Link key={note.id} href={`/notes/${note.id}`}
          className="flex items-center gap-2 px-2 py-[10px] rounded-xl text-sm font-semibold text-muted hover:text-ink hover:bg-green-soft transition-colors group"
          style={{ fontFamily: '"PingFang SC", sans-serif' }}>
          <Note size={15} />
          <span className="flex-1 truncate">{note.title || "未命名笔记"}</span>
          <button onClick={(e) => deleteNote(e, note.id)}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-muted/50 hover:text-red transition-all" title="删除">
            <Trash size={12} />
          </button>
        </Link>
      ))}
    </div>
  );
}

