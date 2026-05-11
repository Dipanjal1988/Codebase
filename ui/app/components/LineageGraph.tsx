"use client";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

export interface LineageNode {
  id: string;
  label: string;
  kind: "source" | "target" | "job" | "neutral";
  sub?: string;
}

export interface LineageEdge {
  source: string;
  target: string;
  label?: string;
}

const KIND_STYLES: Record<LineageNode["kind"], React.CSSProperties> = {
  source: {
    background: "#EFF6FF",
    border: "1.5px solid #3B82F6",
    color: "#1E3A8A",
  },
  target: {
    background: "#ECFDF5",
    border: "1.5px solid #10B981",
    color: "#064E3B",
  },
  job: {
    background: "#FFF7ED",
    border: "1.5px solid #F59E0B",
    color: "#7C2D12",
  },
  neutral: {
    background: "#F8FAFC",
    border: "1.5px solid #94A3B8",
    color: "#0F172A",
  },
};

function layoutNodes(nodes: LineageNode[], edges: LineageEdge[]): Node[] {
  // Quick column-by-kind layout: source | job/neutral | target
  const cols: Record<LineageNode["kind"], number> = {
    source: 0,
    job: 1,
    neutral: 1,
    target: 2,
  };
  const xStep = 360;
  const yStep = 90;
  const grouped: Record<number, LineageNode[]> = {};
  nodes.forEach((n) => {
    const c = cols[n.kind];
    (grouped[c] ||= []).push(n);
  });
  const positioned: Node[] = [];
  Object.entries(grouped).forEach(([cs, list]) => {
    const c = Number(cs);
    const total = list.length;
    list.forEach((n, i) => {
      positioned.push({
        id: n.id,
        position: { x: c * xStep, y: (i - (total - 1) / 2) * yStep + 200 },
        data: {
          label: (
            <div className="text-left leading-tight">
              <div className="text-[11px] font-semibold">{n.label}</div>
              {n.sub && <div className="text-[10px] opacity-70 mt-0.5">{n.sub}</div>}
            </div>
          ),
        },
        style: {
          ...KIND_STYLES[n.kind],
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 12,
          width: 280,
        },
        sourcePosition: "right" as const,
        targetPosition: "left" as const,
      });
    });
  });
  return positioned;
}

export function LineageGraph({
  nodes,
  edges,
  height = 460,
}: {
  nodes: LineageNode[];
  edges: LineageEdge[];
  height?: number;
}) {
  const flowNodes = layoutNodes(nodes, edges);
  const flowEdges: Edge[] = edges.map((e, i) => ({
    id: `e-${i}-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    label: e.label,
    labelStyle: { fontSize: 11, fill: "#475569" },
    labelBgStyle: { fill: "#F8FAFC" },
    style: { stroke: "#94A3B8", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" },
    animated: false,
  }));

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
      style={{ height }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} color="#E2E8F0" />
        <MiniMap pannable zoomable nodeColor={(n) => (n.style?.background as string) || "#fff"} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
