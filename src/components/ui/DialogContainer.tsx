"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Dialog } from "./dialog-manager";
import { X } from "@phosphor-icons/react";

export function DialogContainer() {
  const [, forceUpdate] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return Dialog.subscribe(() => forceUpdate((n) => n + 1));
  }, []);

  const state = Dialog.getState();
  const isOpen = state?.open ?? false;

  // Auto-focus input for prompt
  useEffect(() => {
    if (state?.type === "prompt" && isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [state?.type, isOpen]);

  // Keyboard: Escape to cancel
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        Dialog.closeDialog(state?.type === "prompt" ? "" : false);
      }
      if (e.key === "Enter" && state?.type === "prompt") {
        const val = inputRef.current?.value ?? "";
        Dialog.closeDialog(val);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, state?.type]);

  const onConfirm = useCallback(() => {
    if (state?.type === "prompt") {
      Dialog.closeDialog(inputRef.current?.value ?? "");
    } else {
      Dialog.closeDialog(true);
    }
  }, [state]);

  const onCancel = useCallback(() => {
    Dialog.closeDialog(state?.type === "prompt" ? "" : false);
  }, [state]);

  if (!isOpen || !state) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
    >
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* 弹窗卡片 */}
      <div
        className="relative bg-white rounded-2xl shadow-xl border border-line w-full max-w-sm overflow-hidden animate-dialog-in"
        role="dialog"
        aria-modal="true"
        aria-label={state.title || state.message}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="text-sm font-bold text-ink">
            {state.title || (state.type === "confirm" ? "确认操作" : "输入内容")}
          </h3>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-green-soft transition-colors"
            aria-label="关闭"
          >
            <X size={15} />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-5 py-4">
          <p className="text-sm text-muted leading-relaxed">{state.message}</p>

          {state.type === "prompt" && (
            <input
              ref={inputRef}
              type="text"
              defaultValue={state.defaultValue}
              placeholder={state.placeholder || "请输入..."}
              className="mt-3 w-full h-[46px] px-3 rounded-xl bg-input-bg border border-[#D4DDD6] text-sm font-semibold text-ink placeholder:text-muted/40 outline-none focus:border-green focus:ring-3 focus:ring-green/15 transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter") onConfirm();
              }}
            />
          )}
        </div>

        {/* 按钮组 */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-line bg-[#FAFBF8]">
          <button
            onClick={onCancel}
            className="h-[38px] px-5 rounded-xl border border-[#D2DBD4] bg-white text-sm font-bold text-muted hover:bg-[#EDF3EE] hover:text-ink transition-all"
          >
            {state.cancelLabel || "取消"}
          </button>
          <button
            onClick={onConfirm}
            className="h-[38px] px-5 rounded-xl bg-green-dark text-white text-sm font-bold hover:bg-[#205541] hover:-translate-y-0.5 shadow-m hover:shadow-l transition-all"
          >
            {state.confirmLabel || "确定"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* 弹窗入场动画 */
const style =
  typeof document !== "undefined" ? document.createElement("style") : null;
if (style) {
  style.textContent = `
    @keyframes dialogIn {
      from { opacity: 0; transform: scale(0.95) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-dialog-in { animation: dialogIn 200ms ease; }
  `;
  document.head.appendChild(style);
}
