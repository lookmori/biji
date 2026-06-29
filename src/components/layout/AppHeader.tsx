"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, MagnifyingGlass, Printer, SignOut } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";

interface AppHeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      router.push(`/notes?search=${encodeURIComponent(searchVal)}`);
    }
  };

  // 点击外部关闭菜单
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    window.location.href = "/";
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?";

  return (
    <header className="fixed top-0 inset-x-0 z-30 h-[72px] glass-header border-b border-[#D8E0D9]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-4xl h-full flex items-center justify-between">
        {/* 左侧 */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-ink hover:bg-green-soft transition-colors"
            aria-label="打开菜单"
          >
            <List size={20} />
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green flex items-center justify-center">
              <span className="text-white text-sm font-bold" style={{ fontFamily: '"Songti SC", serif' }}>B</span>
            </div>
            <span className="text-ink text-lg font-bold tracking-[0.12em]" style={{ fontFamily: '"Songti SC", "STSong", "SimSun", serif' }}>BIJI</span>
            <span className="hidden lg:inline text-muted text-xs tracking-[0.2em] font-mono">NOTE STUDIO</span>
          </Link>
        </div>

        {/* 中间 — 搜索 */}
        <div className="hidden sm:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text" placeholder="搜索笔记... 回车跳转"
              value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-input-bg border border-[#D4DDD6] text-sm font-semibold text-ink placeholder:text-muted focus:outline-none focus:border-green focus:ring-3 focus:ring-green/15 transition-colors"
              style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-line text-[10px] font-mono text-muted">⌘K</kbd>
          </div>
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl text-red hover:bg-red/10 transition-colors"
            aria-label="打印" title="打印笔记"
          >
            <Printer size={18} />
          </button>

          {/* 用户头像 + 下拉菜单 */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-green-dark text-white text-sm font-bold flex items-center justify-center hover:bg-green transition-colors"
              aria-label="用户菜单"
              style={{ fontFamily: '"PingFang SC", sans-serif' }}
            >
              {initial}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-line shadow-xl py-1 z-50">
                <div className="px-4 py-2.5 border-b border-line">
                  <p className="text-sm font-bold text-ink truncate">{user?.name || "用户"}</p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red hover:bg-red/5 transition-colors text-left"
                >
                  <SignOut size={16} />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
