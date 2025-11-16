"use client";

import React, { useCallback, useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import ServiceConfigPanel from "./service-config-panel";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { ServiceItem, CanvasProps } from "./types";
import LeftPanel from "./leftpanel";

/* ---- node component & palette (unchanged) ---- */
const ServiceNode: React.FC<{ data: { label: string; img: string } }> = ({ data }) => {
  const c = { base: "#fff", border: "#E2E8F0", text: "#334155" };
  return (
    <div
      style={{
        width: 150,
        height: 55,
        background: c.base,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 10px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: "white",
          border: `1px solid ${c.border}`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <img src={data.img} alt={data.label} style={{ width: 20, height: 20 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <div style={{ fontWeight: 600, color: c.text, fontSize: 14 }}>{data.label}</div>
      </div>
    </div>
  );
};

/* === Service catalog =======================================================
   We keep *internal ids* the same (s3, lambda, etc.) so your existing TYPE_MAP,
   KIND_MAP, and plan builder remain unchanged. Only label/img swap per provider.
============================================================================ */
type Provider = "aws" | "gcp" | "azure";

const AWS_SERVICES: ServiceItem[] = [
  { id: "rds", label: "AWS RDS", img: "/aws-icons/rds.png" },
  { id: "lambda", label: "AWS Lambda", img: "/aws-icons/lambda.png" },
  { id: "sns", label: "AWS SNS", img: "/aws-icons/sns.png" },
  { id: "s3", label: "AWS S3", img: "/aws-icons/s3.png" },
  { id: "ec2", label: "AWS EC2", img: "/aws-icons/ec2.png" },
  { id: "kinesis", label: "AWS Kinesis", img: "/aws-icons/kinesis.png" },
  { id: "sqs", label: "AWS SQS", img: "/aws-icons/sqs.png" },
  { id: "dynamodb", label: "DynamoDB", img: "/aws-icons/DynamoDB.png" },
  { id: "cloudfront", label: "CloudFront", img: "/placeholder-gtzyx.png" },
  { id: "apigateway", label: "API Gateway", img: "/aws-api-gateway-icon.png" },
];

const GCP_SERVICES: ServiceItem[] = [
  { id: "rds", label: "Cloud SQL", img: "/gcp-icons/cloud-sql.png" },
  { id: "lambda", label: "Cloud Functions", img: "/gcp-icons/cloud-functions.png" },
  { id: "sns", label: "Pub/Sub (Topic)", img: "/gcp-icons/pubsub.png" },
  { id: "s3", label: "Cloud Storage", img: "/gcp-icons/storage.png" },
  { id: "ec2", label: "Compute Engine", img: "/gcp-icons/compute-engine.png" },
  { id: "kinesis", label: "Dataflow", img: "/gcp-icons/dataflow.png" },
  { id: "sqs", label: "Pub/Sub (Subscription)", img: "/gcp-icons/pubsub.png" },
  { id: "dynamodb", label: "Firestore", img: "/gcp-icons/firestore.png" },
  { id: "cloudfront", label: "Cloud CDN", img: "/gcp-icons/cdn.png" },
  { id: "apigateway", label: "API Gateway", img: "/gcp-icons/api-gateway.png" },
];

const AZURE_SERVICES: ServiceItem[] = [
  { id: "rds", label: "Azure Database (Postgres)", img: "/azure-icons/postgres.png" },
  { id: "lambda", label: "Azure Functions", img: "/azure-icons/functions.png" },
  { id: "sns", label: "Event Grid", img: "/azure-icons/event-grid.png" },
  { id: "s3", label: "Blob Storage", img: "/azure-icons/blob.png" },
  { id: "ec2", label: "Virtual Machines", img: "/azure-icons/vm.png" },
  { id: "kinesis", label: "Event Hubs", img: "/azure-icons/event-hubs.png" },
  { id: "sqs", label: "Service Bus Queue", img: "/azure-icons/service-bus.png" },
  { id: "dynamodb", label: "Cosmos DB", img: "/azure-icons/cosmos.png" },
  { id: "cloudfront", label: "Front Door / CDN", img: "/azure-icons/cdn.png" },
  { id: "apigateway", label: "API Management", img: "/azure-icons/apim.png" },
];

/* default catalog = AWS (ids unchanged) */
const DEFAULT_SERVICES: ServiceItem[] = AWS_SERVICES;

/* node types: keep as-is using the superset of ids you already support */
const nodeTypes = DEFAULT_SERVICES.reduce((acc, s) => {
  acc[s.id] = ServiceNode;
  return acc;
}, {} as Record<string, React.FC<any>>);

const gridSize = 60;

/* ---------- types for your internal plan builder (kept) ---------- */
type PlanNodeType = "s3" | "sqs" | "lambda" | "dynamodb" | "apigateway" | "sns" | "other";
// Extend known types to align with CAPABILITIES.md (optional types included)
type ExtendedPlanNodeType =
  | PlanNodeType
  | "events_rule"
  | "sfn"
  | "kinesis";
type PlanEdgeType = `${ExtendedPlanNodeType}_to_${ExtendedPlanNodeType}`;
type PlanNode = { id: string; type: ExtendedPlanNodeType; name: string; props?: Record<string, any> };
type PlanEdge = { type: PlanEdgeType; from: string; to: string; props?: Record<string, any> };
type Plan = { awsRegion: string; variables?: Record<string, string>; nodes: PlanNode[]; edges: PlanEdge[] };

const TYPE_MAP: Record<string, ExtendedPlanNodeType> = {
  s3: "s3",
  sqs: "sqs",
  lambda: "lambda",
  dynamodb: "dynamodb",
  apigateway: "apigateway",
  sns: "sns",
  // Optional/Planned
  kinesis: "kinesis",
  sfn: "sfn",
  events: "events_rule",
  "events.rule": "events_rule",
  rds: "other",
  ec2: "other",
  cloudfront: "other",
};

const classifyEdge = (src: ExtendedPlanNodeType, tgt: ExtendedPlanNodeType): PlanEdgeType =>
  `${src}_to_${tgt}` as PlanEdgeType;

/* --------------------- helpers (kept/adjusted) --------------------- */

// map your node "type" → desired backend "kind"
const KIND_MAP: Record<ExtendedPlanNodeType, string> = {
  s3: "aws.s3",
  sqs: "aws.sqs",
  lambda: "aws.lambda",
  dynamodb: "aws.dynamodb",
  apigateway: "aws.apigw",
  sns: "aws.sns",
  events_rule: "aws.events.rule",
  sfn: "aws.sfn",
  kinesis: "aws.kinesis",
  other: "aws.other",
};

// friendly label (not used by backend payload now, but handy for debugging)
function computeIntent(src: ExtendedPlanNodeType, tgt: ExtendedPlanNodeType): "notify" | "consume" | "invoke" | "read" | "write" | "deliver" {
  // S3
  if (src === "s3" && (tgt === "sqs" || tgt === "lambda" || tgt === "sns" || tgt === "events_rule")) return "notify";
  // SNS
  if (src === "sns" && (tgt === "lambda" || tgt === "sqs")) return "deliver";
  // SQS
  if (src === "sqs" && tgt === "lambda") return "consume";
  // EventBridge Rule
  if (src === "events_rule" && tgt === "lambda") return "notify";
  // API Gateway
  if (src === "apigateway" && tgt === "lambda") return "invoke";
  // DynamoDB Streams
  if (src === "dynamodb" && tgt === "lambda") return "consume";
  // Lambda to DynamoDB grants
  if (src === "lambda" && tgt === "dynamodb") return "write"; // default to write; user can add read via separate edge
  // Step Functions
  if (src === "lambda" && tgt === "sfn") return "invoke";
  // Kinesis
  if (src === "kinesis" && tgt === "lambda") return "consume";
  // Fallback
  return "notify";
}

// minimal props normalization for UI → payload mapping
function normalizeToDesiredProps(kind: string, raw: any): Record<string, any> {
  const d = raw || {};
  if (kind === "aws.lambda") {
    return {
      runtime: d.runtime || "python3.12",
      memory: Number(d.memory ?? d.memory_mb ?? 256),
      timeout: Number(d.timeout ?? d.timeout_s ?? 30),
      handler: d.handler || "app.lambda_handler",
      codeUri: d.codeUri || d.package_path || "src/processor",
    };
  }
  if (kind === "aws.s3") {
    return {
      versioning: d.versioning !== undefined ? !!d.versioning : true,
      // turn on EventBridge if the bucket has any outgoing edges (we set this later)
      eventBridge: !!d.eventBridge,
    };
  }
  if (kind === "aws.sqs") {
    return {
      visibilityTimeout: Number(d.visibilityTimeout ?? 60),
      dlq: d.dlq ?? undefined,
      physicalName: d.physicalName ?? undefined,
    };
  }
  if (kind === "aws.sns") {
    return {
      displayName: d.displayName ?? undefined,
      physicalName: d.physicalName ?? undefined,
    };
  }
  if (kind === "aws.events.rule") {
    return {
      pattern: d.pattern ?? undefined,
    };
  }
  if (kind === "aws.apigw") {
    return {
      apiName: d.apiName ?? undefined,
    };
  }
  if (kind === "aws.dynamodb") {
    return {
      partitionKey: d.partitionKey ?? "pk",
      sortKey: d.sortKey ?? undefined,
      billing: d.billing ?? "PAY_PER_REQUEST",
      stream: d.stream !== undefined ? !!d.stream : true,
      physicalName: d.physicalName ?? undefined,
    };
  }
  if (kind === "aws.sfn") {
    return {
      physicalName: d.physicalName ?? undefined,
    };
  }
  if (kind === "aws.kinesis") {
    return {
      shards: d.shards ?? 1,
      physicalName: d.physicalName ?? undefined,
    };
  }
  // pass-through for others
  return { ...d };
}

function sanitizeName(name: string): string {
  const base = (name || "").trim().toLowerCase().replace(/\s+/g, "-");
  return base || `res-${Date.now()}`;
}

const makeDefaultConfig = (label: string) => ({
  name: label || "",
  description: "",
  environment: "development" as const,
  region: "",
  details: {},
});

/* --------------------- component --------------------- */

const CanvasInner = (
  { items, updateItemPosition, onSelectedNodesChange, onCanvasNodesChange }: CanvasProps,
  ref: React.Ref<{ getPlan: () => Plan; getPrompt: () => string }>
) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const memoNodeTypes = React.useMemo(() => nodeTypes, []);

  /* ===== New: provider + palette state (UI only) ====================== */
  const [provider, setProvider] = useState<Provider>("aws");
  const currentServices = React.useMemo<ServiceItem[]>(() => {
    switch (provider) {
      case "gcp":
        return GCP_SERVICES;
      case "azure":
        return AZURE_SERVICES;
      default:
        return AWS_SERVICES;
    }
  }, [provider]);

  // init from items ONCE
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    const initial: Node[] = items.map((item) => ({
      id: item.id,
      type: item.id,
      position: { x: item.x ?? 0, y: item.y ?? 0 },
      data: { label: item.label, img: item.img, service: item },
    }));
    setNodes(initial);
    didInitRef.current = true;
  }, [items, setNodes]);

  useEffect(() => {
    onCanvasNodesChange?.(nodes.map((n) => ({ id: n.id, type: String(n.type) })));
  }, [nodes, onCanvasNodesChange]);

  const onConnect = useCallback(
    (params: Connection | Edge) =>
      setEdges((eds) => addEdge({ ...params, type: "bezier", markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );

  const onNodeDrag = useCallback(
    (_e: any, node: Node) => setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))),
    []
  );
  const onNodeDragStop = useCallback(
    (_e: any, node: Node) => {
      const snappedX = Math.round(node.position.x / gridSize) * gridSize;
      const snappedY = Math.round(node.position.y / gridSize) * gridSize;
      setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, position: { x: snappedX, y: snappedY } } : n)));
      const index = items.findIndex((i) => i.id === node.id);
      if (index !== -1) updateItemPosition(index, snappedX, snappedY);
    },
    [items, updateItemPosition, setNodes]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      const position = reactFlowInstance.current?.project({
        x: event.clientX - (reactFlowWrapper.current?.getBoundingClientRect().left ?? 0),
        y: event.clientY - (reactFlowWrapper.current?.getBoundingClientRect().top ?? 0),
      });

      // look up in current provider set
      const svc = currentServices.find((s) => s.id === type);
      if (!svc || !position) return;

      const newId = `${svc.id}-${+new Date()}`;
      const snappedX = Math.round(position.x / gridSize) * gridSize;
      const snappedY = Math.round(position.y / gridSize) * gridSize;

      setNodes((nds) =>
        nds.concat({
          id: newId,
          type: svc.id,
          position: { x: snappedX, y: snappedY },
          data: {
            label: svc.label,
            img: svc.img,
            service: {
              id: newId,
              label: svc.label,
              img: svc.img,
              x: snappedX,
              y: snappedY,
              config: makeDefaultConfig(svc.label),
            } as ServiceItem,
            selected: true,
          },
        })
      );
      onSelectedNodesChange?.([{ id: newId, type: svc.id }]);
    },
    [setNodes, onSelectedNodesChange, currentServices]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // single, controlled panel state
  const [activeService, setActiveService] = useState<ServiceItem | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const openPanelForNode = useCallback((node: Node) => {
    const svc: ServiceItem | undefined = (node?.data as any)?.service;
    if (svc) {
      setActiveService(svc);
      setActiveNodeId(node.id);
    }
  }, []);

  const closePanel = () => {
    setActiveService(null);
    setActiveNodeId(null);
  };

  const handleUpdateFromPanel = (svc: ServiceItem) => {
    if (!activeNodeId) return;
    setNodes((nds) => nds.map((n) => (n.id === activeNodeId ? { ...n, data: { ...(n.data || {}), service: svc } } : n)));
  };

  const handleDeleteFromPanel = (serviceId: string) => {
    const idToRemove = activeNodeId ?? serviceId;
    setNodes((nds) => nds.filter((n) => n.id !== idToRemove));
    closePanel();
  };

  /* ----------------- existing plan builder (kept) ----------------- */
  const buildPlan = useCallback((): Plan => {
    const configuredRegion =
      nodes
        .map((n) => {
          const s = (n.data as any)?.service;
          return (s?.config?.region as string | undefined) || (s?.config?.details as any)?.region || "";
        })
        .find((r) => r && r.trim().length > 0) || "ap-southeast-2";

    const planNodes: PlanNode[] = nodes.map((n) => {
      const svc: ServiceItem | undefined = (n.data as any)?.service;
      const type = TYPE_MAP[String(n.type) as keyof typeof TYPE_MAP] || "other";
      const details: Record<string, any> = (svc as any)?.config?.details || {};
      const name = sanitizeName(svc?.config?.name?.trim?.() || svc?.label || n.id);
      return { id: n.id, type, name, props: { label: svc?.label, region: svc?.config?.region || (details as any).region || "", ...details } };
    });

    const indexById = Object.fromEntries(planNodes.map((pn) => [pn.id, pn]));

    const planEdges: PlanEdge[] = edges.flatMap((e) => {
      const src = indexById[e.source as string];
      const tgt = indexById[e.target as string];
      if (!src || !tgt) return [];
      const type = classifyEdge(src.type, tgt.type);
      const props: Record<string, any> = {};
      const s3Node = src.type === "s3" ? src : tgt.type === "s3" ? tgt : null;
      if (s3Node) {
        props.prefix = s3Node.props?.prefix ?? "";
        props.suffix = s3Node.props?.suffix ?? "";
      }
      return [{ type, from: src.id, to: tgt.id, props }];
    });

    const variables: Record<string, string> = {};
    planNodes.forEach((pn) => {
      if (pn.type === "s3") variables[`bucket_${pn.id}_name`] = (pn.props as any)?.bucketName || pn.name;
      if (pn.type === "sqs") variables[`queue_${pn.id}_name`] = (pn.props as any)?.queueName || pn.name;
      if (pn.type === "lambda") variables[`lambda_${pn.id}_name`] = (pn.props as any)?.functionName || pn.name;
    });

    return { awsRegion: configuredRegion, variables, nodes: planNodes, edges: planEdges };
  }, [nodes, edges]);

  /* ----------------- NEW: build desired /deploy payload ----------------- */
  type DeployNode = { id: string; kind: string; name: string; props: Record<string, any> };
  type DeployEdge = { from: string; to: string; intent: "notify" | "consume" | "invoke" | "read" | "write" | "deliver"; path?: string; method?: string; batchSize?: number };
  type DeployPayload = {
    project: string;
    env: string;
    region: string;
    nodes: DeployNode[];
    edges: DeployEdge[];
  };

  function buildDeploymentPayload(plan: Plan): DeployPayload {
    const project = "canvas-project";
    const env = "dev";
    const region = plan.awsRegion || "ap-southeast-2";

    // quick lookups to compute props that depend on connectivity
    const outgoingById = new Map<string, number>();
    plan.edges.forEach((e) => outgoingById.set(e.from, (outgoingById.get(e.from) || 0) + 1));

    const nodes: DeployNode[] = plan.nodes.map((pn) => {
      const kind = KIND_MAP[pn.type] || "aws.other";
      const raw = pn.props || {};

      // normalize props to the exact keys you requested
      const props = normalizeToDesiredProps(kind, raw);

      // S3: turn on eventBridge if it has any outgoing links
      if (kind === "aws.s3") {
        const hasOutgoing = (outgoingById.get(pn.id) || 0) > 0;
        if (props.eventBridge === undefined) props.eventBridge = hasOutgoing ? true : false;
      }

      return {
        id: pn.id, // keep your RF node id (e.g., "s3-172705...")
        kind,
        name: pn.name, // sanitized name (e.g., "images-bucket")
        props,
      };
    });

    const indexById = Object.fromEntries(plan.nodes.map((n) => [n.id, n]));

    const edges: DeployEdge[] = plan.edges.map((pe) => {
      const src = indexById[pe.from];
      const tgt = indexById[pe.to];
      const intent = computeIntent(src?.type as ExtendedPlanNodeType, tgt?.type as ExtendedPlanNodeType);

      const edge: DeployEdge = { from: pe.from, to: pe.to, intent };

      // API Gateway -> Lambda supports path/method on the edge
      if (src?.type === "apigateway" && tgt?.type === "lambda") {
        edge.path = (pe.props as any)?.path || "/";
        edge.method = (pe.props as any)?.method || "ANY";
      }

      // SQS/DynamoDB/Kinesis Streams to Lambda may support batchSize
      if ((src?.type === "sqs" || src?.type === "dynamodb" || src?.type === "kinesis") && tgt?.type === "lambda") {
        const batchSize = Number((pe.props as any)?.batchSize ?? NaN);
        if (!Number.isNaN(batchSize)) edge.batchSize = batchSize;
      }

      return edge;
    });

    return { project, env, region, nodes, edges };
  }

  /* ----------------- LLM prompt kept (for completeness) ----------------- */
  const buildPrompt = useCallback((plan: Plan): string => {
    const planJson = JSON.stringify(plan, null, 2);
    return [
      "You are a Terraform generator. Output ONLY valid Terraform HCL for AWS.",
      "",
      "### Architecture Plan (JSON)",
      planJson,
      "",
      "### (Prompt preserved for printing / debugging only; backend no longer needs it)",
    ].join("\n");
  }, []);

  // Pretty-print what we’ll send to /deploy
  const printGraphPayload = () => {
    const plan = buildPlan();
    const payload = buildDeploymentPayload(plan);
    console.log("=== /deploy payload ===\n", JSON.stringify(payload, null, 2));
  };

  /* ----------------- API helpers ----------------- */
  const API_BASE = process.env.NEXT_PUBLIC_API || "http://localhost:8000/aws";

  const [deploying, setDeploying] = useState(false);
  const [compiling, setCompiling] = useState(false);

  /* ----------------- NEW: deploy via /deploy (single POST, no auth) ----------------- */
  const handleDeploy = async () => {
    try {
      setDeploying(true);

      const plan = buildPlan();
      const payload = buildDeploymentPayload(plan);

      const res = await fetch(`${API_BASE}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        /* keep raw text */
      }

      if (!res.ok) {
        const msg = data?.detail || data?.error || text || `Deploy failed (${res.status})`;
        throw new Error(msg);
      }

      console.log("Deploy ok:", data || text);
      alert("Deployed successfully! 🎉");
    } catch (e: any) {
      console.error("Deployment error:", e?.message || e);
      alert(e?.message || "Something went wrong while deploying.");
    } finally {
      setDeploying(false);
    }
  };

  const handleCompile = async () => {
    try {
      setCompiling(true);

      const plan = buildPlan();
      const payload = buildDeploymentPayload(plan);

      const res = await fetch(`${API_BASE}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        /* keep raw text */
      }

      if (!res.ok) {
        const msg = data?.detail || data?.error || text || `Compile failed (${res.status})`;
        throw new Error(msg);
      }

      console.log("Compile ok:", data || text);
      alert("Compiled successfully (CDK synth).");
    } catch (e: any) {
      console.error("Compile error:", e?.message || e);
      alert(e?.message || "Something went wrong while compiling.");
    } finally {
      setCompiling(false);
    }
  };

  useImperativeHandle(ref, () => ({
    getPlan: () => buildPlan(),
    getPrompt: () => buildPrompt(buildPlan()),
  }));

  const [search, setSearch] = useState("");

  const filteredServices = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return currentServices;
    return currentServices.filter((s) => s.label.toLowerCase().includes(q));
  }, [currentServices, search]);

  return (
    <div className="w-full h-full flex min-h-0">
      {/* Canvas area */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          snapToGrid={false}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={(_, node) => openPanelForNode(node)}
          onInit={(instance) => (reactFlowInstance.current = instance)}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={memoNodeTypes}
          snapGrid={[gridSize, gridSize]}
          onSelectionChange={({ nodes }) => {
            const next = nodes.map((n) => ({ id: n.id, type: String(n.type) }));
            const key = JSON.stringify(next.map((x) => x.id + ":" + x.type).sort());
            (CanvasInner as any)._lastSelKey = (CanvasInner as any)._lastSelKey || "";
            if ((CanvasInner as any)._lastSelKey !== key) {
              (CanvasInner as any)._lastSelKey = key;
              onSelectedNodesChange?.(next);
            }
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <MiniMap />
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>

        {/* SINGLE controlled panel; keyed to force fresh state per node */}
        {activeService && (
          <ServiceConfigPanel
            key={activeNodeId ?? "panel"}
            service={activeService}
            isOpen={!!activeService}
            onClose={closePanel}
            onUpdate={handleUpdateFromPanel}
            onDelete={() => handleDeleteFromPanel(activeService.id)}
          />
        )}
      </div>

      {/* ===== New Right-side Palette Panel ================================== */}
      <aside
        className="w-[320px] shrink-0 border-l border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 flex flex-col h-full min-h-0"
        aria-label="Cloud services palette"
      >
         {/* Actions */}
        <div className="p-3 border-t border-gray-200 grid grid-cols-2 gap-2">
    
          <button
            onClick={() => {
              const plan = buildPlan();
              const prompt = buildPrompt(plan);
              console.log("=== Prompt ===\n", prompt);
              // still keeping your existing printer to match behavior
              // (and a visual button since topbar is gone)
              // You can remove either of the two calls if you want one log.
              const payload = (function () {
                // inline to avoid accidental refactor of your functions
                const _plan = plan;
                return (function (_p: Plan) {
                  const project = "canvas-project";
                  const env = "dev";
                  const region = _p.awsRegion || "ap-southeast-2";
                  const outgoingById = new Map<string, number>();
                  _p.edges.forEach((e) => outgoingById.set(e.from, (outgoingById.get(e.from) || 0) + 1));
                  const nodes = _p.nodes.map((pn) => {
                    const kind = KIND_MAP[pn.type] || "aws.other";
                    const raw = pn.props || {};
                    const props = normalizeToDesiredProps(kind, raw);
                    if (kind === "aws.s3") {
                      const hasOutgoing = (outgoingById.get(pn.id) || 0) > 0;
                      if (props.eventBridge === undefined) props.eventBridge = hasOutgoing ? true : false;
                    }
                    return { id: pn.id, kind, name: pn.name, props };
                  });
                  const indexById = Object.fromEntries(_p.nodes.map((n) => [n.id, n]));
                  const edges = _p.edges.map((pe) => {
                    const src = indexById[pe.from] as PlanNode | undefined;
                    const tgt = indexById[pe.to] as PlanNode | undefined;
                    const intent = computeIntent(src?.type as ExtendedPlanNodeType, tgt?.type as ExtendedPlanNodeType);
                    const edge: any = { from: pe.from, to: pe.to, intent };
                    if (src?.type === "apigateway" && tgt?.type === "lambda") {
                      edge.path = (pe.props as any)?.path || "/";
                      edge.method = (pe.props as any)?.method || "ANY";
                    }
                    if ((src?.type === "sqs" || src?.type === "dynamodb" || src?.type === "kinesis") && tgt?.type === "lambda") {
                      const batchSize = Number((pe.props as any)?.batchSize ?? NaN);
                      if (!Number.isNaN(batchSize)) edge.batchSize = batchSize;
                    }
                    return edge;
                  });
                  return { project, env, region, nodes, edges };
                })(_plan);
              })();
              console.log("=== /deploy payload ===\n", JSON.stringify(payload, null, 2));
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border border-teal-200 text-teal-700 hover:bg-teal-50"
            title="Print Prompt"
          >
            Print Prompt
          </button>

          <button
            type="button"
            onClick={handleCompile}
            disabled={compiling}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
              "bg-amber-600 text-white hover:bg-amber-700",
              "focus:outline-none focus:ring-4 focus:ring-amber-200/70",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "shadow-sm transition-all",
            ].join(" ")}
            title="Compile (CDK synth)"
          >
            {compiling ? "Compiling…" : "Compile"}
          </button>

          <button
            type="button"
            onClick={handleDeploy}
            disabled={deploying}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
              "bg-teal-600 text-white hover:bg-teal-700",
              "focus:outline-none focus:ring-4 focus:ring-teal-200/70",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "shadow-sm transition-all",
            ].join(" ")}
            title="Deploy"
          >
            {deploying ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" />
                </svg>
                Deploying…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2c3.5 0 6 2.5 6 6 0 3.2-2.2 6.4-5 8l-1 6-3-4-4-3 6-1c1.6-2.8 4.8-5 8-5 0-3.5-2.5-6-6-6z" />
                </svg>
                Deploy
              </>
            )}
          </button>
        </div>
        {/* Provider switcher */}
        <div className="p-3 border-b border-gray-200">
          <div className="text-sm font-semibold text-slate-700 mb-2">Cloud Provider</div>
          <div className="grid grid-cols-3 rounded-xl overflow-hidden border border-gray-200">
            {(["aws", "gcp", "azure"] as Provider[]).map((p) => {
              const active = provider === p;
              return (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={[
                    "px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? p === "aws"
                        ? "bg-orange-500/90 text-white"
                        : p === "gcp"
                        ? "bg-teal-600/90 text-white"
                        : "bg-sky-600/90 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {p.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-teal-200/60"
            />
          </div>
        </div>

        {/* Services list */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
          {filteredServices.map((service) => (
            <div
              key={`${provider}-${service.id}-${service.label}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("application/reactflow", service.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              title={service.label}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md cursor-move"
            >
              <div className="h-9 w-9 rounded-lg border border-gray-200 grid place-items-center">
                <img src={service.img} alt={service.label} className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-800">{service.label}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wide">{service.id}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
            </div>
          ))}

          {filteredServices.length === 0 && (
            <div className="text-sm text-slate-500 py-6 text-center">No services match your search.</div>
          )}
        </div>

       
      </aside>
    </div>
  );
};

const Canvas = forwardRef(CanvasInner);
export default Canvas;
