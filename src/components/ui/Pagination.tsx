"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {

  // 生成页码按钮
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-green-soft disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        aria-label="上一页"
      >
        <CaretLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-xs text-muted/40 font-mono">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
              p === page
                ? "bg-green-dark text-white shadow-s"
                : "text-muted hover:text-ink hover:bg-green-soft"
            }`}
            style={{ fontFamily: "SFMono-Regular, Consolas, monospace" }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-green-soft disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        aria-label="下一页"
      >
        <CaretRight size={16} />
      </button>

      <span className="ml-3 text-xs text-muted/40 font-mono">
        {page} / {totalPages}
      </span>
    </div>
  );
}
