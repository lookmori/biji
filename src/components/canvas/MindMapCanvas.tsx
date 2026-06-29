"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Plus, Trash, CaretRight, CaretDown, ArrowCounterClockwise } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog-manager";

// ---- 数据模型 ----
interface MindNode {
  id: string;
  text: string;
  children: MindNode[];
  collapsed: boolean;
  color: string;
}

const BRANCH_COLORS = ["#1F6F54", "#B94B3F", "#F0C96B", "#3D9E7A", "#65726D", "#5B8FB9"];
let _idCounter = 1;
const uid = () => `mn${_idCounter++}`;

const defaultRoot: MindNode = {
  id: uid(), text: "中心主题", collapsed: false, color: "#173E31",
  children: [
    { id: uid(), text: "分支 1", collapsed: false, color: BRANCH_COLORS[0], children: [
      { id: uid(), text: "子节点 1.1", collapsed: false, color: BRANCH_COLORS[0], children: [] },
      { id: uid(), text: "子节点 1.2", collapsed: false, color: BRANCH_COLORS[0], children: [] },
    ]},
    { id: uid(), text: "分支 2", collapsed: false, color: BRANCH_COLORS[1], children: [
      { id: uid(), text: "子节点 2.1", collapsed: false, color: BRANCH_COLORS[1], children: [] },
    ]},
    { id: uid(), text: "分支 3", collapsed: false, color: BRANCH_COLORS[2], children: [] },
  ],
};

// ---- 布局常量 ----
const NODE_W = 140;
const NODE_H = 38;
const LEVEL_GAP = 100;  // 层级水平间距
const NODE_GAP = 12;     // 同级垂直间距
const PADDING = 60;

interface LayoutNode {
  node: MindNode;
  x: number;
  y: number;
  depth: number;
  parentId: string | null;
}

// 递归布局：计算每个节点的 (x, y)
function layoutTree(root: MindNode): LayoutNode[] {
  const result: LayoutNode[] = [];

  function layout(
    node: MindNode,
    depth: number,
    parentId: string | null,
    startY: number
  ): { nodes: LayoutNode[]; totalHeight: number } {
    const nodes: LayoutNode[] = [];

    if (node.collapsed || node.children.length === 0) {
      const ln: LayoutNode = {
        node,
        x: PADDING + depth * (NODE_W + LEVEL_GAP),
        y: startY + NODE_H / 2,
        depth,
        parentId,
      };
      nodes.push(ln);
      return { nodes, totalHeight: NODE_H };
    }

    // 递归布局子节点
    let childY = startY;
    const childResults: { nodes: LayoutNode[]; totalHeight: number }[] = [];
    for (const child of node.children) {
      const cr = layout(child, depth + 1, node.id, childY);
      childResults.push(cr);
      childY += cr.totalHeight + NODE_GAP;
    }

    const totalChildrenHeight = childY - startY - (node.children.length > 0 ? NODE_GAP : 0);
    const myY = startY + totalChildrenHeight / 2 - NODE_H / 2;

    const ln: LayoutNode = {
      node,
      x: PADDING + depth * (NODE_W + LEVEL_GAP),
      y: myY,
      depth,
      parentId,
    };
    nodes.push(ln);

    for (const cr of childResults) {
      nodes.push(...cr.nodes);
    }

    return { nodes, totalHeight: Math.max(NODE_H, totalChildrenHeight) };
  }

  const { nodes } = layout(root, 0, null, PADDING);
  return nodes;
}

// ---- 组件 ----
interface MindMapCanvasProps {
  onExportImage?: (dataUrl: string) => void;
  noteId?: string;
}

export function MindMapCanvas({ onExportImage, noteId }: MindMapCanvasProps) {
  const [root, setRoot] = useState<MindNode>(structuredClone(defaultRoot));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [dragOffsets, setDragOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<{ nodeId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const layoutNodes = layoutTree(root);
  const nodeMap = new Map(layoutNodes.map(n => [n.node.id, n]));

  // 自动保存到数据库
  useEffect(() => {
    if (!noteId || noteId === "new") return;
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/canvas/${noteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ canvasType: "mindMap", canvasData: root }),
        });
      } catch {}
    }, 3000);
    return () => clearTimeout(timer);
  }, [root, noteId]);

  // 加载已保存的数据
  useEffect(() => {
    if (!noteId || noteId === "new") return;
    fetch(`/api/canvas/${noteId}?type=mindMap`)
      .then((r) => r.json())
      .then((d) => { if (d.record?.canvas_data) setRoot(d.record.canvas_data); })
      .catch(() => {});
  }, [noteId]);

  // 全局拖拽事件
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragging.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setDragOffsets((prev) => ({
        ...prev,
        [drag.nodeId]: {
          x: drag.origX + dx,
          y: drag.origY + dy,
        },
      }));
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // 画布尺寸
  const maxX = Math.max(...layoutNodes.map(n => n.x + NODE_W)) + PADDING;
  const maxY = Math.max(...layoutNodes.map(n => n.y + NODE_H)) + PADDING;

  // 查找节点
  const findNode = useCallback((id: string, node: MindNode): MindNode | null => {
    if (node.id === id) return node;
    for (const c of node.children) {
      const found = findNode(id, c);
      if (found) return found;
    }
    return null;
  }, []);

  // 更新根节点（不可变更新）
  const updateRoot = useCallback((updater: (root: MindNode) => MindNode) => {
    setRoot(prev => updater(structuredClone(prev)));
  }, []);

  // 添加子节点
  const addChild = (parentId: string) => {
    updateRoot(r => {
      const p = findNode(parentId, r);
      if (p) {
        p.collapsed = false;
        const colorIdx = p.children.length % BRANCH_COLORS.length;
        const childColor = p.id === r.id ? BRANCH_COLORS[colorIdx] : p.color;
        p.children.push({
          id: uid(), text: "新节点", collapsed: false,
          color: childColor, children: [],
        });
      }
      return r;
    });
  };

  // 删除节点
  const removeNode = (id: string) => {
    if (id === root.id) return;
    updateRoot(r => {
      const remove = (node: MindNode): boolean => {
        const idx = node.children.findIndex(c => c.id === id);
        if (idx >= 0) { node.children.splice(idx, 1); return true; }
        for (const c of node.children) { if (remove(c)) return true; }
        return false;
      };
      remove(r);
      return r;
    });
  };

  // 切换折叠
  const toggleCollapse = (id: string) => {
    updateRoot(r => {
      const n = findNode(id, r);
      if (n) n.collapsed = !n.collapsed;
      return r;
    });
  };

  // 开始编辑
  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };
  const commitEdit = () => {
    if (!editingId) return;
    updateRoot(r => {
      const n = findNode(editingId, r);
      if (n && editText.trim()) n.text = editText.trim();
      return r;
    });
    setEditingId(null);
  };

  // 导出为 PNG
  const exportPNG = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    // 使用 canvas 绘制简化版
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(maxX + 200, 800) * 2;
    canvas.height = Math.max(maxY + 100, 500) * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = "#EEF2ED";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画连线
    layoutNodes.forEach(ln => {
      if (ln.parentId) {
        const parent = nodeMap.get(ln.parentId);
        if (parent) {
          ctx.strokeStyle = ln.node.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const py = parent.y + NODE_H / 2;
          const ny = ln.y + NODE_H / 2;
          ctx.moveTo(parent.x + NODE_W, py);
          ctx.bezierCurveTo(
            parent.x + NODE_W + LEVEL_GAP * 0.4, py,
            ln.x - LEVEL_GAP * 0.4, ny,
            ln.x, ny
          );
          ctx.stroke();
        }
      }
    });

    // 画节点
    layoutNodes.forEach(ln => {
      const r = 8;
      ctx.fillStyle = ln.node.color;
      ctx.beginPath();
      ctx.roundRect(ln.x, ln.y, NODE_W, NODE_H, r);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = '600 13px "PingFang SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // 截断文字
      const maxChars = Math.floor((NODE_W - 16) / 8);
      let txt = ln.node.text;
      if (txt.length > maxChars) txt = txt.slice(0, maxChars - 1) + "…";
      ctx.fillText(txt, ln.x + NODE_W / 2, ln.y + NODE_H / 2);
    });

    const url = canvas.toDataURL("image/png");
    onExportImage?.(url);
  }, [layoutNodes, nodeMap, maxX, maxY, onExportImage]);

  // 重置
  const reset = async () => {
    const ok = await Dialog.confirm("重置后所有节点将恢复为默认模板，确定要继续吗？", {
      title: "重置思维导图",
      confirmLabel: "重置",
    });
    if (ok) {
      _idCounter = 1;
      setRoot(structuredClone(defaultRoot));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-line bg-white/85 flex-shrink-0">
        <span className="text-xs font-bold text-ink mr-2">思维导图</span>
        <span className="w-px h-4 bg-line mx-1" />
        <button onClick={() => addChild(root.id)}
          className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-xs font-semibold text-green hover:bg-green-soft transition"
          title="添加主分支"><Plus size={14} />主分支</button>
        <button onClick={reset}
          className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-xs font-semibold text-muted hover:text-ink hover:bg-green-soft transition"
          title="重置"><ArrowCounterClockwise size={14} />重置</button>
        <span className="flex-1" />
        <button onClick={exportPNG}
          className="flex items-center gap-1 px-3 h-7 rounded-lg text-xs font-bold text-white bg-green hover:bg-green-dark transition"
          title="导出 PNG 并插入笔记">📥 插入笔记</button>
      </div>

      {/* 画布 */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-canvas-bg relative"
        style={{ minHeight: 400 }}>
        <div className="relative" style={{ width: maxX + 200, height: Math.max(maxY + 100, 500) }}>
          {/* SVG 连线 */}
          <svg ref={svgRef} className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%", overflow: "visible" }}>
            {layoutNodes.filter(ln => ln.parentId).map(ln => {
              const parent = nodeMap.get(ln.parentId!);
              if (!parent) return null;
              const po = dragOffsets[parent.node.id] || { x: 0, y: 0 };
              const no = dragOffsets[ln.node.id] || { x: 0, y: 0 };
              const px = parent.x + NODE_W + po.x;
              const py = parent.y + NODE_H / 2 + po.y;
              const nx = ln.x + no.x;
              const ny = ln.y + NODE_H / 2 + no.y;
              const cpx1 = px + LEVEL_GAP * 0.35;
              const cpx2 = nx - LEVEL_GAP * 0.35;
              const d = `M ${px} ${py} C ${cpx1} ${py}, ${cpx2} ${ny}, ${nx} ${ny}`;
              return (
                <path key={`${ln.parentId}-${ln.node.id}`} d={d}
                  stroke={ln.node.color} strokeWidth={2} fill="none"
                  strokeLinecap="round" opacity={0.7} />
              );
            })}
          </svg>

          {/* 节点 */}
          {layoutNodes.map(ln => {
            const offset = dragOffsets[ln.node.id] || { x: 0, y: 0 };
            const nodeX = ln.x + offset.x;
            const nodeY = ln.y + offset.y;

            const onMouseDown = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (editingId) return;
              dragging.current = {
                nodeId: ln.node.id,
                startX: e.clientX,
                startY: e.clientY,
                origX: offset.x,
                origY: offset.y,
              };
            };

            return (
            <div key={ln.node.id}
              className="absolute flex items-center group"
              style={{ left: nodeX, top: nodeY, cursor: dragging.current?.nodeId === ln.node.id ? "grabbing" : "grab" }}
              onMouseDown={onMouseDown}>
              {/* 折叠按钮 */}
              {ln.node.children.length > 0 && (
                <button
                  onClick={() => toggleCollapse(ln.node.id)}
                  className="absolute -right-7 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-muted hover:text-ink transition"
                  aria-label={ln.node.collapsed ? "展开" : "折叠"}>
                  {ln.node.collapsed ? <CaretRight size={14} /> : <CaretDown size={14} />}
                </button>
              )}

              {/* 节点卡片 */}
              {editingId === ln.node.id ? (
                <input
                  autoFocus
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
                  className="h-[38px] w-[140px] rounded-lg border-2 border-green bg-white px-3 text-sm font-semibold text-ink outline-none"
                  style={{ fontFamily: '"PingFang SC", sans-serif' }}
                />
              ) : (
                <div
                  onClick={() => startEdit(ln.node.id, ln.node.text)}
                  className="h-[38px] min-w-[100px] max-w-[180px] px-4 rounded-lg flex items-center justify-center cursor-text text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ backgroundColor: ln.node.color }}
                  title="点击编辑文字"
                >
                  {ln.node.text}
                </div>
              )}

              {/* Hover 操作按钮 */}
              <div className="hidden group-hover:flex items-center gap-0.5 ml-1.5">
                <button onClick={() => addChild(ln.node.id)}
                  className="w-5 h-5 flex items-center justify-center rounded text-green hover:bg-green-soft transition"
                  title="添加子节点"><Plus size={12} /></button>
                {ln.node.id !== root.id && (
                  <button onClick={() => removeNode(ln.node.id)}
                    className="w-5 h-5 flex items-center justify-center rounded text-red hover:bg-red/10 transition"
                    title="删除"><Trash size={12} /></button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-1 border-t border-line bg-[#FAFBF8] flex items-center gap-3 flex-shrink-0">
        <span className="text-[10px] text-muted/50 font-mono">
          {layoutNodes.length} 个节点
        </span>
        <span className="text-[10px] text-muted/40 font-mono">
          点击节点编辑 · hover 显示操作 · 点击 ◀ 折叠
        </span>
      </div>
    </div>
  );
}
