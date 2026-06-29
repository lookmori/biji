"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Dialog } from "@/components/ui/dialog-manager";

// ---- 类型 ----
export type DrawTool = "pen" | "rect" | "circle" | "line" | "arrow" | "text" | "eraser";

export interface DrawAction {
  tool: DrawTool;
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
  text?: string;
}

interface DrawingCanvasProps {
  showGrid?: boolean;
  onExportImage?: (dataUrl: string) => void;
}

const COLORS = ["#17231F", "#1F6F54", "#B94B3F", "#F0C96B", "#65726D", "#3D9E7A"];
const WIDTHS = [1, 2, 3, 5, 8, 12];

export function DrawingCanvas({ showGrid = true, onExportImage }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<DrawTool>("pen");
  const [color, setColor] = useState("#17231F");
  const [lineWidth, setLineWidth] = useState(3);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [undone, setUndone] = useState<DrawAction[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [curPts, setCurPts] = useState<{ x: number; y: number }[]>([]);
  const [size, setSize] = useState({ w: 800, h: 500 });

  const dpr = useRef(2);

  // 容器尺寸监听
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width || 800, h: r.height || 500 });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 获取鼠标/触摸在 canvas 逻辑坐标系中的位置
  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    // canvas.style.width/size.w 与 rect.width 的比例
    const scaleX = size.w / rect.width;
    const scaleY = size.h / rect.height;
    return {
      x: (cx - rect.left) * scaleX,
      y: (cy - rect.top) * scaleY,
    };
  }, [size]);

  // 绘制单个 action（ctx 已 scale 到 dpr）
  const drawOne = (ctx: CanvasRenderingContext2D, a: DrawAction) => {
    const { tool: t, points: pts, color: cl, lineWidth: lw, text } = a;
    if (pts.length === 0) return;
    ctx.save();
    ctx.strokeStyle = cl;
    ctx.fillStyle = cl;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (t === "eraser") ctx.globalCompositeOperation = "destination-out";

    switch (t) {
      case "pen": case "eraser":
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke(); break;
      case "rect": {
        const [s, e] = [pts[0], pts[pts.length - 1]];
        ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y); break;
      }
      case "circle": {
        const [s, e] = [pts[0], pts[pts.length - 1]];
        ctx.beginPath();
        ctx.ellipse(s.x + (e.x - s.x) / 2, s.y + (e.y - s.y) / 2,
          Math.abs(e.x - s.x) / 2, Math.abs(e.y - s.y) / 2, 0, 0, Math.PI * 2);
        ctx.stroke(); break;
      }
      case "line":
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y); ctx.stroke(); break;
      case "arrow": {
        const [f, to] = [pts[0], pts[pts.length - 1]];
        const ang = Math.atan2(to.y - f.y, to.x - f.x);
        const hl = lw * 4;
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(to.x, to.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - hl * Math.cos(ang - Math.PI / 6), to.y - hl * Math.sin(ang - Math.PI / 6));
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - hl * Math.cos(ang + Math.PI / 6), to.y - hl * Math.sin(ang + Math.PI / 6));
        ctx.stroke(); break;
      }
      case "text":
        if (text) {
          ctx.font = `${lw * 5}px "PingFang SC", sans-serif`;
          ctx.fillText(text, pts[0].x, pts[0].y);
        }
        break;
    }
    ctx.restore();
  };

  // 全量重绘（还原到干净状态）
  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    dpr.current = Math.max(2, window.devicePixelRatio || 1);
    const D = dpr.current;

    // 设置 canvas 物理尺寸 → 重置所有状态
    c.width = size.w * D;
    c.height = size.h * D;
    c.style.width = `${size.w}px`;
    c.style.height = `${size.h}px`;

    // 背景
    ctx.fillStyle = "#EEF2ED";
    ctx.fillRect(0, 0, c.width, c.height);

    // 网格
    if (showGrid) {
      ctx.strokeStyle = "#D8DFD8";
      ctx.lineWidth = 0.5;
      const gs = 28;
      for (let x = gs; x < size.w; x += gs) {
        ctx.beginPath(); ctx.moveTo(x * D, 0); ctx.lineTo(x * D, c.height); ctx.stroke();
      }
      for (let y = gs; y < size.h; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y * D); ctx.lineTo(c.width, y * D); ctx.stroke();
      }
    }

    // 所有动作 — 这里 ctx 不 scale，直接用物理像素画
    actions.forEach((a) => {
      // 把逻辑坐标转为物理坐标
      const scaled: DrawAction = {
        ...a,
        points: a.points.map(p => ({ x: p.x * D, y: p.y * D })),
        lineWidth: a.lineWidth * D,
      };
      // 对于 text，字体大小在 drawOne 里用 lineWidth*5，所以已经 scale 了
      drawOneScaled(ctx, scaled);
    });
  }, [actions, size, showGrid]);

  // 和 drawOne 一样但不做额外 save/restore（性能优化）
  const drawOneScaled = (ctx: CanvasRenderingContext2D, a: DrawAction) => {
    const { tool: t, points: pts, color: cl, lineWidth: lw, text } = a;
    if (pts.length === 0) return;
    ctx.save();
    ctx.strokeStyle = cl; ctx.fillStyle = cl; ctx.lineWidth = lw;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (t === "eraser") ctx.globalCompositeOperation = "destination-out";

    switch (t) {
      case "pen": case "eraser":
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke(); break;
      case "rect": {
        const [s, e] = [pts[0], pts[pts.length - 1]];
        ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y); break;
      }
      case "circle": {
        const [s, e] = [pts[0], pts[pts.length - 1]];
        ctx.beginPath();
        ctx.ellipse(s.x + (e.x - s.x) / 2, s.y + (e.y - s.y) / 2,
          Math.abs(e.x - s.x) / 2, Math.abs(e.y - s.y) / 2, 0, 0, Math.PI * 2);
        ctx.stroke(); break;
      }
      case "line":
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y); ctx.stroke(); break;
      case "arrow": {
        const [f, to] = [pts[0], pts[pts.length - 1]];
        const ang = Math.atan2(to.y - f.y, to.x - f.x);
        const hl = lw * 4;
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(to.x, to.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - hl * Math.cos(ang - Math.PI / 6), to.y - hl * Math.sin(ang - Math.PI / 6));
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - hl * Math.cos(ang + Math.PI / 6), to.y - hl * Math.sin(ang + Math.PI / 6));
        ctx.stroke(); break;
      }
      case "text":
        if (text) {
          ctx.font = `${lw}px "PingFang SC", sans-serif`;
          ctx.fillText(text, pts[0].x, pts[0].y);
        }
        break;
    }
    ctx.restore();
  };

  // 尺寸变化时重绘
  useEffect(() => { redraw(); }, [redraw]);

  // ---- 事件处理 ----
  const onDown = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const p = getPos(e);

    if (tool === "text") {
      const t = await Dialog.prompt("输入要添加的文字：", {
        placeholder: "输入文字内容...",
        confirmLabel: "添加",
      });
      if (t) {
        const a: DrawAction = { tool: "text", points: [p], color, lineWidth, text: t };
        setActions(prev => [...prev, a]);
        setUndone([]);
      }
      return;
    }

    setDrawing(true);
    setCurPts([p]);
  }, [tool, color, lineWidth, getPos]);

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    setCurPts(prev => [...prev, p]);

    // 实时预览：直接在物理像素上画
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // 先全量重绘已有内容
    redraw();

    // 再画当前预览笔划（物理像素坐标）
    const D = dpr.current;
    const previewPts = [...curPts, p].map(pt => ({ x: pt.x * D, y: pt.y * D }));
    const preview: DrawAction = { tool, points: previewPts, color, lineWidth: lineWidth * D };
    drawOneScaled(ctx, preview);
  }, [drawing, tool, color, lineWidth, curPts, redraw, getPos]);

  const onUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    setDrawing(false);

    const p = getPos(e);
    const pts = [...curPts, p];
    if (tool === "text") { setCurPts([]); return; }

    let finalPts = pts;
    if (["rect", "circle", "line", "arrow"].includes(tool)) {
      finalPts = [pts[0], pts[pts.length - 1]];
    }
    if (finalPts.length < 1) { setCurPts([]); return; }

    const a: DrawAction = { tool, points: finalPts, color, lineWidth };
    setActions(prev => [...prev, a]);
    setUndone([]);
    setCurPts([]);
  }, [drawing, tool, color, lineWidth, curPts, getPos]);

  // ---- 操作 ----
  const undo = () => {
    if (!actions.length) return;
    setUndone(prev => [actions[actions.length - 1], ...prev]);
    setActions(prev => prev.slice(0, -1));
  };
  const redo = () => {
    if (!undone.length) return;
    setActions(prev => [...prev, undone[0]]);
    setUndone(prev => prev.slice(1));
  };
  const clearAll = async () => {
    if (!actions.length) return;
    const ok = await Dialog.confirm("清空后无法恢复，确定要继续吗？", {
      title: "清空画布",
      confirmLabel: "清空",
    });
    if (!ok) return;
    setActions([]); setUndone([]);
  };
  const exportPNG = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const url = c.toDataURL("image/png");
    onExportImage?.(url);
  }, [onExportImage]);

  // 键盘快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions, undone]);

  // ---- UI ----
  const ToolBtn = ({ t, label, icon }: { t: DrawTool; label: string; icon: string }) => (
    <button onClick={() => setTool(t)}
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all
        ${tool === t ? "bg-green-dark text-white shadow-s" : "text-muted hover:text-ink hover:bg-green-soft"}`}
      aria-label={label} title={label}>{icon}</button>
  );

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-canvas-bg">
      {/* 工具栏 */}
      <div className="flex items-center gap-0.5 px-2.5 py-1.5 border-b border-line bg-white/85 backdrop-blur flex-wrap flex-shrink-0">
        <ToolBtn t="pen" label="画笔" icon="✏️" />
        <ToolBtn t="eraser" label="橡皮擦" icon="🧹" />
        <span className="w-px h-5 bg-line mx-0.5" />
        <ToolBtn t="rect" label="矩形" icon="▭" />
        <ToolBtn t="circle" label="圆形" icon="○" />
        <ToolBtn t="line" label="直线" icon="╲" />
        <ToolBtn t="arrow" label="箭头" icon="→" />
        <ToolBtn t="text" label="文字" icon="T" />
        <span className="w-px h-5 bg-line mx-0.5" />
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full border-2 transition ${color === c ? "border-ink scale-110" : "border-transparent"}`}
            style={{ backgroundColor: c }} aria-label={c} title={c} />
        ))}
        <span className="w-px h-5 bg-line mx-0.5" />
        {WIDTHS.map(w => (
          <button key={w} onClick={() => setLineWidth(w)}
            className={`w-7 h-5 flex items-center justify-center rounded text-xs transition
              ${lineWidth === w ? "bg-green-soft text-green font-bold" : "text-muted"}`}
            aria-label={`${w}px`} title={`${w}px`}>
            <span className="rounded-full bg-ink" style={{ width: Math.min(w, 8), height: Math.min(w, 8) }} />
          </button>
        ))}
        <span className="flex-1" />
        <button onClick={undo} disabled={!actions.length}
          className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-ink hover:bg-green-soft disabled:opacity-25 transition"
          aria-label="撤销" title="撤销 Ctrl+Z">↩</button>
        <button onClick={redo} disabled={!undone.length}
          className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-ink hover:bg-green-soft disabled:opacity-25 transition"
          aria-label="重做" title="重做 Ctrl+Shift+Z">↪</button>
        <button onClick={clearAll} disabled={!actions.length}
          className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-red hover:bg-red/10 disabled:opacity-25 transition"
          aria-label="清空画布" title="清空">🗑</button>
        <button onClick={exportPNG}
          className="w-7 h-7 flex items-center justify-center rounded text-green hover:bg-green-soft transition"
          aria-label="导出并插入笔记" title="导出 PNG 并插入笔记">📥</button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden canvas-touch">
        <canvas ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        />
        {!actions.length && !drawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted/25 text-sm font-semibold select-none">自由绘制 ✏️</p>
          </div>
        )}
      </div>
    </div>
  );
}
