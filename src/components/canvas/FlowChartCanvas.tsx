"use client";

import { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Trash, ArrowCounterClockwise } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog-manager";

// ---- 自定义节点 ----
type FlowNodeData = { label?: string };

function StartNode({ data }: NodeProps & { data: FlowNodeData }) {
  return (
    <div className="relative">
      <Handle type="source" position={Position.Bottom} className="!bg-green" />
      <div className="px-6 py-2.5 rounded-full bg-green text-white text-sm font-bold shadow-m"
        style={{ fontFamily: '"PingFang SC", sans-serif' }}>
        {String(data.label || "开始")}
      </div>
    </div>
  );
}

function ProcessNode({ data }: NodeProps & { data: FlowNodeData }) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-muted" />
      <div className="px-5 py-2.5 rounded-xl bg-white border-2 border-green text-ink text-sm font-semibold shadow-s min-w-[100px] text-center"
        style={{ fontFamily: '"PingFang SC", sans-serif' }}>
        {String(data.label || "流程")}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-muted" />
    </div>
  );
}

function DecisionNode({ data }: NodeProps & { data: FlowNodeData }) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-yellow" />
      <div className="px-5 py-3 bg-yellow text-ink text-sm font-bold shadow-s text-center"
        style={{
          fontFamily: '"PingFang SC", sans-serif',
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          width: 120, height: 80,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        <span className="-mt-1">{String(data.label || "判断")}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-yellow" id="bottom" />
      <Handle type="source" position={Position.Right} className="!bg-yellow" id="right" />
    </div>
  );
}

function EndNode({ data }: NodeProps & { data: FlowNodeData }) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-red" />
      <div className="px-6 py-2.5 rounded-full bg-red text-white text-sm font-bold shadow-m"
        style={{ fontFamily: '"PingFang SC", sans-serif' }}>
        {String(data.label || "结束")}
      </div>
    </div>
  );
}

const nodeTypes = {
  start: StartNode,
  process: ProcessNode,
  decision: DecisionNode,
  end: EndNode,
} as const;

// ---- 默认模板 ----
let _nid = 1;
const nid = () => `fn${_nid++}`;
const eid = () => `fe${_nid++}`;

const defaultNodes: Node[] = [
  { id: nid(), type: "start", position: { x: 300, y: 20 }, data: { label: "开始" } },
  { id: nid(), type: "process", position: { x: 300, y: 120 }, data: { label: "处理步骤" } },
  { id: nid(), type: "decision", position: { x: 300, y: 230 }, data: { label: "是否通过?" } },
  { id: nid(), type: "process", position: { x: 180, y: 360 }, data: { label: "处理 A" } },
  { id: nid(), type: "process", position: { x: 420, y: 360 }, data: { label: "处理 B" } },
  { id: nid(), type: "end", position: { x: 300, y: 480 }, data: { label: "结束" } },
];

const defaultEdges: Edge[] = [
  { id: eid(), source: defaultNodes[0].id, target: defaultNodes[1].id },
  { id: eid(), source: defaultNodes[1].id, target: defaultNodes[2].id },
  { id: eid(), source: defaultNodes[2].id, target: defaultNodes[3].id, sourceHandle: "bottom", label: "否" },
  { id: eid(), source: defaultNodes[2].id, target: defaultNodes[4].id, sourceHandle: "right", label: "是" },
  { id: eid(), source: defaultNodes[3].id, target: defaultNodes[5].id },
  { id: eid(), source: defaultNodes[4].id, target: defaultNodes[5].id },
];

// ---- 组件 ----
interface FlowChartCanvasProps {
  onExportImage?: (dataUrl: string) => void;
}

export function FlowChartCanvas({ onExportImage }: FlowChartCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const reactFlowRef = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (conn: Connection) => setEdges(prev => addEdge(conn, prev)),
    [setEdges]
  );

  // 添加节点
  const addNode = (type: string) => {
    const newNode: Node = {
      id: nid(),
      type: type as "start" | "process" | "decision" | "end",
      position: { x: 250 + Math.random() * 200, y: 50 + Math.random() * 200 },
      data: {
        label: type === "start" ? "开始" : type === "end" ? "结束"
          : type === "decision" ? "判断?" : "新步骤",
      } satisfies FlowNodeData,
    };
    setNodes(prev => [...prev, newNode]);
  };

  // 删除选中节点
  const deleteSelected = () => {
    setNodes(prev => prev.filter(n => !n.selected));
    setEdges(prev => prev.filter(e => {
      return !prev.some(n => n.selected && (n.id === e.source || n.id === e.target));
    }));
  };

  // 导出
  const exportPNG = useCallback(() => {
    // 使用 ReactFlow 的截图能力
    const el = reactFlowRef.current?.querySelector(".react-flow__viewport");
    if (!el) return;

    // 简化导出：用 canvas 画基本布局
    const canvas = document.createElement("canvas");
    canvas.width = 800 * 2;
    canvas.height = 600 * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = "#F7F8F3";
    ctx.fillRect(0, 0, 800, 600);

    // 画边
    edges.forEach(e => {
      const s = nodes.find(n => n.id === e.source);
      const t = nodes.find(n => n.id === e.target);
      if (s && t) {
        ctx.strokeStyle = "#65726D";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.position.x + 60, s.position.y + 40);
        ctx.lineTo(t.position.x + 60, t.position.y);
        ctx.stroke();
      }
    });

    // 画节点
    nodes.forEach(n => {
      const x = n.position.x;
      const y = n.position.y;
      ctx.fillStyle = n.type === "start" ? "#1F6F54"
        : n.type === "end" ? "#B94B3F"
        : n.type === "decision" ? "#F0C96B"
        : "white";
      ctx.strokeStyle = n.type === "process" ? "#1F6F54"
        : n.type === "decision" ? "#F0C96B" : "transparent";
      ctx.lineWidth = n.type === "process" ? 2 : 0;

      const r = n.type === "start" || n.type === "end" ? 20 : 8;
      ctx.beginPath();
      if (n.type === "decision") {
        // 菱形
        ctx.moveTo(x + 60, y);
        ctx.lineTo(x + 120, y + 40);
        ctx.lineTo(x + 60, y + 80);
        ctx.lineTo(x, y + 40);
        ctx.closePath();
      } else {
        ctx.roundRect(x, y, 120, n.type === "start" || n.type === "end" ? 40 : 44, r);
      }
      ctx.fill();
      if (n.type === "process") ctx.stroke();

      ctx.fillStyle = n.type === "process" ? "#17231F" : "white";
      ctx.font = '600 12px "PingFang SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((n.data.label as string) || "", x + 60, y + (n.type === "decision" ? 40 : 22));
    });

    const url = canvas.toDataURL("image/png");
    onExportImage?.(url);
  }, [nodes, edges, onExportImage]);

  // 重置
  const reset = async () => {
    const ok = await Dialog.confirm("重置后所有节点和连线将恢复为默认模板，确定要继续吗？", {
      title: "重置流程图",
      confirmLabel: "重置",
    });
    if (!ok) return;
    _nid = 1;
    setNodes(defaultNodes.map(n => ({ ...n, id: nid(), position: { ...n.position } })));
    setEdges(defaultEdges.map(e => ({ ...e, id: eid() })));
  };

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-line bg-white/85 flex-shrink-0 flex-wrap">
        <span className="text-xs font-bold text-ink mr-1">流程图</span>
        <span className="w-px h-4 bg-line mx-0.5" />
        <button onClick={() => addNode("start")}
          className="px-2.5 h-7 rounded-full bg-green text-white text-xs font-semibold hover:bg-green-dark transition"
          title="开始节点">开始</button>
        <button onClick={() => addNode("process")}
          className="px-2.5 h-7 rounded-lg border border-green text-green text-xs font-semibold hover:bg-green-soft transition"
          title="流程节点">流程</button>
        <button onClick={() => addNode("decision")}
          className="px-2.5 h-7 rounded text-ink text-xs font-semibold bg-yellow hover:bg-yellow/80 transition"
          title="判断节点">判断</button>
        <button onClick={() => addNode("end")}
          className="px-2.5 h-7 rounded-full bg-red text-white text-xs font-semibold hover:bg-red/80 transition"
          title="结束节点">结束</button>
        <span className="w-px h-4 bg-line mx-0.5" />
        <button onClick={deleteSelected}
          className="flex items-center gap-1 px-2 h-7 rounded-lg text-xs text-red hover:bg-red/10 transition"
          title="删除选中"><Trash size={12} />删除</button>
        <button onClick={reset}
          className="flex items-center gap-1 px-2 h-7 rounded-lg text-xs text-muted hover:text-ink hover:bg-green-soft transition"
          title="重置"><ArrowCounterClockwise size={12} />重置</button>
        <span className="flex-1" />
        <button onClick={exportPNG}
          className="flex items-center gap-1 px-3 h-7 rounded-lg text-xs font-bold text-white bg-green hover:bg-green-dark transition"
          title="导出并插入笔记">📥 插入笔记</button>
      </div>

      {/* ReactFlow 画布 */}
      <div ref={reactFlowRef} className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={["Backspace", "Delete"]}
          multiSelectionKeyCode="Shift"
          className="bg-canvas-bg"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#D8DFD8" />
          <Controls className="!rounded-xl !border-line !shadow-s" />
          <MiniMap
            className="!rounded-xl !border-line !shadow-s"
            maskColor="rgba(23,35,31,0.04)"
            nodeColor={(n) =>
              n.type === "start" ? "#1F6F54"
                : n.type === "end" ? "#B94B3F"
                : n.type === "decision" ? "#F0C96B"
                : "#FFFFFF"
            }
          />
        </ReactFlow>
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-1 border-t border-line bg-[#FAFBF8] flex items-center gap-3 flex-shrink-0">
        <span className="text-[10px] text-muted/50 font-mono">
          {nodes.length} 节点 · {edges.length} 连线
        </span>
        <span className="text-[10px] text-muted/40 font-mono">
          拖拽节点 · 连线 · Shift 多选 · Del 删除
        </span>
      </div>
    </div>
  );
}
