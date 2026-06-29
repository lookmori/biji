"use client";

import Link from "next/link";
import { List, X } from "@phosphor-icons/react";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";

export function HomeHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const initial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase();

  const linkClass =
    "text-white/60 hover:text-white transition-colors text-sm font-semibold tracking-[0.04em]";
  const linkStyle = {
    fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif',
  };

  return (
    <header className="fixed top-0 inset-x-0 z-30 h-[72px] bg-hero-bg/90 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-4xl h-full flex items-center justify-between">
        {/* 左侧品牌 */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green flex items-center justify-center">
            <span
              className="text-white text-sm font-bold"
              style={{ fontFamily: '"Songti SC", serif' }}
            >
              B
            </span>
          </div>
          <span
            className="text-white text-lg font-bold tracking-[0.12em]"
            style={{ fontFamily: '"Songti SC", "STSong", "SimSun", serif' }}
          >
            BIJI
          </span>
          <span className="hidden sm:inline text-white/30 text-xs tracking-[0.2em] font-mono">
            NOTE STUDIO
          </span>
        </Link>

        {/* 中间导航 — 桌面 */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className={linkClass} style={linkStyle}>
            功能
          </a>
          <a href="#features" className={linkClass} style={linkStyle}>
            特性
          </a>
          <Link href="/notes" className={linkClass} style={linkStyle}>
            开始使用
          </Link>
        </nav>

        {/* 右侧 */}
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href="/notes"
              className="flex items-center gap-2.5"
            >
              <span className="hidden sm:inline text-white/60 text-sm font-semibold">{user.name || user.email}</span>
              <span className="w-8 h-8 rounded-full bg-green-dark text-white text-sm font-bold flex items-center justify-center"
                style={{ fontFamily: '"PingFang SC", sans-serif' }}>
                {initial}
              </span>
            </Link>
          ) : (
            <Link
              href="/notes"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl bg-green-dark hover:bg-[#205541] text-white text-sm font-semibold transition-all duration-200"
            >
              进入工作台
            </Link>
          )}

          {/* 移动菜单按钮 */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
          >
            {mobileOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {/* 移动菜单 */}
      {mobileOpen && (
        <div className="md:hidden bg-hero-bg/98 backdrop-blur-xl border-b border-white/8">
          <nav className="max-w-[1500px] mx-auto px-6 py-6 flex flex-col gap-4">
            <a
              href="#features"
              className="text-white/70 hover:text-white text-base font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              功能
            </a>
            <a
              href="#features"
              className="text-white/70 hover:text-white text-base font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              特性
            </a>
            <Link
              href="/notes"
              className="text-white/70 hover:text-white text-base font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              开始使用
            </Link>
            <Link
              href="/notes"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-green-dark text-white text-sm font-semibold mt-2"
              onClick={() => setMobileOpen(false)}
            >
              进入工作台
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
