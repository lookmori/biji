"use client";

import {
  Minus,
  LockSimple,
  LockSimpleOpen,
  ArrowsOut,
  ArrowsIn,
  TreeStructure,
  FlowArrow,
  PencilSimple,
  X,
} from "@phosphor-icons/react";
import { useState, useRef, useCallback, useEffect } from "react";
import { DrawingCanvas } from "@/components/canvas/DrawingCanvas";
import { MindMapCanvas } from "@/components/canvas/MindMapCanvas";
import { FlowChartCanvas } from "@/components/canvas/FlowChartCanvas";

export type PanelType = "mindMap" | "flowChart" | "draw";
export type PanelMode = "min" | "half" | "full";

interface FloatingPanelProps {
  type: PanelType;
  noteId?: string;
}

function getLabel(type: PanelType) {
  return type === "mindMap" ? "思维导图" : type === "flowChart" ? "流程图" : "自由绘图";
}

function getIcon(type: PanelType) {
  return type === "mindMap" ? TreeStructure : type === "flowChart" ? FlowArrow : PencilSimple;
}

export function FloatingPanel({ type, noteId }: FloatingPanelProps) {
  const [mode, setMode] = useState<PanelMode>("min");
  const [locked, setLocked] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const label = getLabel(type);
  const Icon = getIcon(type);

  const clearTimers = useCallback(() => {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
  }, []);

  const handleBallEnter = useCallback(() => {
    if (locked || mode === "full") return;
    clearTimers();
    hoverTimer.current = setTimeout(() => setMode("half"), 300);
  }, [locked, mode, clearTimers]);

  const handleBallLeave = useCallback(() => {
    if (locked || mode === "full") return;
    clearTimers();
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
  }, [locked, mode, clearTimers]);

  const handlePanelLeave = useCallback(() => {
    if (locked || mode === "full") return;
    clearTimers();
    leaveTimer.current = setTimeout(() => setMode("min"), 400);
  }, [locked, mode, clearTimers]);

  const toggleFullscreen = () => {
    setMode(prev => prev === "full" ? "half" : "full");
    setLocked(true);
  };
  const minimize = () => { setMode("min"); setLocked(false); };

  useEffect(() => { if (mode === "full") setLocked(true); }, [mode]);
  useEffect(() => clearTimers, [clearTimers]);

  // 导出图片后的处理：上传 → 触发插入事件
  const handleExportImage = useCallback(async (dataUrl: string) => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append("file", blob, `${type}-${Date.now()}.png`);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (json.url) {
        window.dispatchEvent(new CustomEvent("biji:insert-image", {
          detail: {
            url: json.url,
            alt: `${label}`,
            canvasType: type === "mindMap" ? "mindMap" : type === "flowChart" ? "flowChart" : "draw",
          },
        }));
      }
    } catch (err) {
      console.error("上传失败，使用 data URL:", err);
      window.dispatchEvent(new CustomEvent("biji:insert-image", {
        detail: {
          url: dataUrl,
          alt: `${label}`,
          canvasType: type === "mindMap" ? "mindMap" : type === "flowChart" ? "flowChart" : "draw",
        },
      }));
    }
  }, [type, label]);

  // 面板样式
  const panelStyle: React.CSSProperties =
    mode === "full"
      ? { position: "fixed", inset: "16px", zIndex: 70, width: "auto", height: "auto", borderRadius: "16px" }
      : { position: "fixed", right: "20px", bottom: "24px", width: type === "draw" ? "420px" : "420px",
          height: "70vh", maxHeight: "calc(100vh - 100px)", zIndex: 60, borderRadius: "16px" };

  const isExpanded = mode === "half" || mode === "full";

  return (
    <>
      {isExpanded && (
        <div className="flex flex-col bg-white shadow-xl border border-line overflow-hidden"
          style={{
            ...panelStyle,
            animation: mode === "full" ? "panelFullExpand 400ms ease" : "panelExpand 460ms ease",
            fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif',
          }}
          onMouseEnter={() => { if (mode !== "full") clearTimers(); }}
          onMouseLeave={mode === "full" ? undefined : handlePanelLeave}>

          {/* 标题栏 */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-[#FAFBF8] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Icon size={17} className="text-green" weight="fill" />
              <span className="text-sm font-bold text-ink">{label}</span>
              <span className="text-[10px] text-muted/40 font-mono">{mode === "full" ? "全屏" : "半屏"}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={toggleFullscreen}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-green-soft transition"
                aria-label={mode === "full" ? "退出全屏" : "全屏"} title={mode === "full" ? "退出全屏" : "全屏"}>
                {mode === "full" ? <ArrowsIn size={15} /> : <ArrowsOut size={15} />}
              </button>
              <button onClick={() => { if (mode !== "full") setLocked(!locked); }}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition ${locked ? "text-green bg-green-soft" : "text-muted hover:text-ink hover:bg-green-soft"}`}
                aria-label={locked ? "已锁定" : "锁定"} title={locked ? "面板已锁定" : "锁定面板"}>
                {locked ? <LockSimple size={15} /> : <LockSimpleOpen size={15} />}
              </button>
              <button onClick={minimize}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-green-soft transition"
                aria-label="最小化" title="最小化">
                <Minus size={15} />
              </button>
              {mode === "full" && (
                <button onClick={minimize}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-red hover:bg-red/10 transition"
                  aria-label="关闭"><X size={15} /></button>
              )}
            </div>
          </div>

          {/* 画布内容 */}
          <div className="flex-1 min-h-0">
            {type === "draw" && <DrawingCanvas onExportImage={handleExportImage} />}
            {type === "mindMap" && <MindMapCanvas onExportImage={handleExportImage} noteId={noteId} />}
            {type === "flowChart" && <FlowChartCanvas onExportImage={handleExportImage} />}
          </div>

          {/* 状态栏 */}
          {mode === "full" && (
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-line bg-[#FAFBF8] flex-shrink-0">
              <span className="text-[10px] text-muted/40 font-mono">全屏模式 · 已锁定</span>
              <span className="text-[10px] text-muted/40 font-mono">{label} · Canvas 2D</span>
            </div>
          )}
        </div>
      )}

      {/* 悬浮球 */}
      {mode === "min" && (
        <button
          className="fixed z-60 w-10 h-10 rounded-lg bg-green-dark text-white shadow-m flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-l"
          style={{ right: "20px", bottom: getBallBottom(type) }}
          onMouseEnter={handleBallEnter} onMouseLeave={handleBallLeave}
          onClick={() => { setMode("half"); setLocked(true); }}
          aria-label={`打开${label}面板`} title={`${label} — 点击展开 / hover 预览`}>
          <Icon size={19} />
        </button>
      )}

      {/* 动画样式 */}
      <PanelStyles />
    </>
  );
}

function getBallBottom(type: PanelType): string {
  // 三个悬浮球从下到上排列：draw, flowChart, mindMap
  if (type === "draw") return "24px";
  if (type === "flowChart") return "calc(24px + 56px)";
  return "calc(24px + 112px)";
}

function PanelStyles() {
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @keyframes panelExpand {
        from { opacity: 0; transform: scale(0.95) translateY(12px); transform-origin: bottom right; }
        to   { opacity: 1; transform: scale(1) translateY(0); transform-origin: bottom right; }
      }
      @keyframes panelFullExpand {
        from { opacity: 0; transform: scale(0.98); }
        to   { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);
  return null;
}
