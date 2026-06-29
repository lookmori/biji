"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-paper">
      <AppHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />

      <div className="flex flex-1 pt-[72px]">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-4xl py-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
