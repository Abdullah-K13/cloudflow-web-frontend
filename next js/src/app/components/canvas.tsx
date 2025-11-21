"use client";

import React, { useCallback, useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import CredentialsModal from "./ui/credentials-modal";
import SuccessModal from "./ui/success-modal";
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
  { id: "gcp-storage", label: "GCP Storage", img: "/gcp-icons/Google_Storage-Logo.wine.png" },
  { id: "pubsub", label: "Pub/Sub", img: "/gcp-icons/google-cloud-pub-sub-logo.png" },
  { id: "cloud-run", label: "Cloud Run", img: "/gcp-icons/google-cloud-run-logo-png.png" },
  { id: "secret-manager", label: "GCP Secret Manager", img: "/gcp-icons/secret manager.png" },
  { id: "firestore", label: "GCP Firestore", img: "/gcp-icons/firestore.png" },
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

/* node types: include all service IDs from all providers so all services can be rendered */
const nodeTypes = [
  ...AWS_SERVICES,
  ...GCP_SERVICES,
  ...AZURE_SERVICES,
].reduce((acc, s) => {
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
  | "kinesis"
  | "gcp-storage"
  | "pubsub"
  | "cloud-run"
  | "secret-manager"
  | "firestore";
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
  // GCP Services
  "gcp-storage": "gcp-storage",
  pubsub: "pubsub",
  "cloud-run": "cloud-run",
  "secret-manager": "secret-manager",
  firestore: "firestore",
};

const classifyEdge = (src: ExtendedPlanNodeType | string, tgt: ExtendedPlanNodeType | string): PlanEdgeType => {
  // Normalize GCP service types
  const srcType = (typeof src === "string" ? src : src) as ExtendedPlanNodeType;
  const tgtType = (typeof tgt === "string" ? tgt : tgt) as ExtendedPlanNodeType;
  return `${srcType}_to_${tgtType}` as PlanEdgeType;
};

/* --------------------- helpers (kept/adjusted) --------------------- */

// map your node "type" → desired backend "kind"
const KIND_MAP: Record<string, string> = {
  // AWS
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
  // GCP
  "gcp-storage": "gcp.storage",
  pubsub: "gcp.pubsub",
  "cloud-run": "gcp.run",
  "secret-manager": "gcp.secretmanager",
  firestore: "gcp.firestore",
};

// friendly label (not used by backend payload now, but handy for debugging)
function computeIntent(src: string, tgt: string): "notify" | "consume" | "invoke" | "read" | "write" | "deliver" | "access" {
  // AWS S3
  if (src === "s3" && (tgt === "sqs" || tgt === "lambda" || tgt === "sns" || tgt === "events_rule")) return "notify";
  // AWS SNS
  if (src === "sns" && (tgt === "lambda" || tgt === "sqs")) return "deliver";
  // AWS SQS
  if (src === "sqs" && tgt === "lambda") return "consume";
  // AWS EventBridge Rule
  if (src === "events_rule" && tgt === "lambda") return "notify";
  // AWS API Gateway
  if (src === "apigateway" && tgt === "lambda") return "invoke";
  // AWS DynamoDB Streams
  if (src === "dynamodb" && tgt === "lambda") return "consume";
  // AWS Lambda to DynamoDB grants
  if (src === "lambda" && tgt === "dynamodb") return "write"; // default to write; user can add read via separate edge
  // AWS Step Functions
  if (src === "lambda" && tgt === "sfn") return "invoke";
  // AWS Kinesis
  if (src === "kinesis" && tgt === "lambda") return "consume";
  // GCP Services
  // Storage → Pub/Sub
  if ((src === "gcp-storage" || src === "gcp.storage") && (tgt === "pubsub" || tgt === "gcp.pubsub")) return "notify";
  // Pub/Sub → Cloud Run
  if ((src === "pubsub" || src === "gcp.pubsub") && (tgt === "cloud-run" || tgt === "gcp.run")) return "notify";
  // Cloud Run → Secret Manager
  if ((src === "cloud-run" || src === "gcp.run") && (tgt === "secret-manager" || tgt === "gcp.secretmanager")) return "access";
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
  // GCP Services
  if (kind === "gcp.storage") {
    return {
      uniformAccess: d.uniformAccess !== undefined ? !!d.uniformAccess : true,
      forceDestroy: !!d.forceDestroy,
      labels: d.labels || {},
    };
  }
  if (kind === "gcp.pubsub") {
    return {
      topicName: d.topicName || undefined,
      labels: d.labels || {},
    };
  }
  if (kind === "gcp.run") {
    return {
      image: d.image || "gcr.io/cloudrun/hello",
      env: d.env || {},
      allowUnauthenticated: d.allowUnauthenticated !== undefined ? !!d.allowUnauthenticated : true,
      cpu: d.cpu || "1000m",
      memory: d.memory || "512Mi",
      minInstances: d.minInstances ?? 0,
      maxInstances: d.maxInstances ?? 10,
      concurrency: d.concurrency ?? 80,
    };
  }
  if (kind === "gcp.secretmanager") {
    return {
      secretValue: d.secretValue || undefined,
      labels: d.labels || {},
    };
  }
  if (kind === "gcp.firestore") {
    return {
      locationId: d.locationId || "us-central",
      databaseId: d.databaseId || "(default)",
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
  ref: React.Ref<{ getPlan: () => Plan; getPrompt: () => string; buildDeploymentPayload: (plan: Plan) => any; getProvider: () => Provider }>
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
        .find((r) => r && r.trim().length > 0) || (provider === "gcp" ? "us-central1" : "ap-southeast-2");

    const planNodes: PlanNode[] = nodes.map((n) => {
      const svc: ServiceItem | undefined = (n.data as any)?.service;
      // Map service ID to type - handle both AWS and GCP
      let type: ExtendedPlanNodeType = TYPE_MAP[String(n.type) as keyof typeof TYPE_MAP] || "other";
      // Handle GCP services
      if (String(n.type) === "gcp-storage") type = "gcp-storage" as ExtendedPlanNodeType;
      else if (String(n.type) === "pubsub") type = "pubsub" as ExtendedPlanNodeType;
      else if (String(n.type) === "cloud-run") type = "cloud-run" as ExtendedPlanNodeType;
      else if (String(n.type) === "secret-manager") type = "secret-manager" as ExtendedPlanNodeType;
      else if (String(n.type) === "firestore") type = "firestore" as ExtendedPlanNodeType;
      
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
  type DeployEdge = { from: string; to: string; intent: "notify" | "consume" | "invoke" | "read" | "write" | "deliver" | "access"; path?: string; method?: string; batchSize?: number };
  type DeployPayload = {
    project: string;
    env: string;
    region: string;
    nodes: DeployNode[];
    edges: DeployEdge[];
  };

  function buildDeploymentPayload(plan: Plan): DeployPayload & { location?: string } {
    const project = "canvas-project";
    const env = "dev";
    // Use appropriate default region based on provider
    const region = plan.awsRegion || (provider === "gcp" ? "us-central1" : "ap-southeast-2");
    
    // For GCP, also include location (synonym for region)
    const payload: DeployPayload & { location?: string } = {
      project,
      env,
      region,
      nodes: [],
      edges: [],
    };
    
    if (provider === "gcp") {
      payload.location = region;
    }

    // quick lookups to compute props that depend on connectivity
    const outgoingById = new Map<string, number>();
    plan.edges.forEach((e) => outgoingById.set(e.from, (outgoingById.get(e.from) || 0) + 1));

    const nodes: DeployNode[] = plan.nodes.map((pn) => {
      const kind = KIND_MAP[pn.type] || (provider === "gcp" ? "gcp.other" : "aws.other");
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
      const srcKind = KIND_MAP[src?.type || ""] || "";
      const tgtKind = KIND_MAP[tgt?.type || ""] || "";
      const intent = computeIntent(srcKind || src?.type || "", tgtKind || tgt?.type || "");

      const edge: DeployEdge = { from: pe.from, to: pe.to, intent: intent as any };

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

    payload.nodes = nodes;
    payload.edges = edges;
    
    return payload;
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

  // Pretty-print what we'll send to /deploy
  const printGraphPayload = () => {
    const plan = buildPlan();
    const payload = buildDeploymentPayload(plan);
    
    // For GCP, wrap in {ir: {...}} format for console output
    if (provider === "gcp") {
      const wrappedPayload = { ir: payload };
      console.log("=== /gcp/up payload ===\n", JSON.stringify(wrappedPayload, null, 2));
    } else {
    console.log("=== /deploy payload ===\n", JSON.stringify(payload, null, 2));
    }
  };

  /* ----------------- API helpers ----------------- */
  // Use the same base URL pattern as apiClient
  const API_BASE = 
    typeof window === "undefined"
      ? process.env.API_BASE_URL || "http://127.0.0.1:8000"
      : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const AWS_API_BASE = `${API_BASE}/aws`;
  const GCP_API_BASE = `${API_BASE}/gcp`;

  // Helper to get access token from localStorage
  const getAccessToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  };

  // Helper to create headers with auth if token exists
  const getHeaders = (includeAuth: boolean = false): HeadersInit => {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (includeAuth) {
      const token = getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  };

  // Check if user has GCP credentials configured
  const checkGcpCredentials = async (): Promise<boolean> => {
    try {
      const token = getAccessToken();
      if (!token) {
        return false;
      }

      const res = await fetch(`${API_BASE}/auth/credentials/check`, {
        method: "GET",
        headers: getHeaders(true),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      return data?.has_gcp_credentials === true;
    } catch (error) {
      console.error("Error checking GCP credentials:", error);
      return false;
    }
  };

  const [deploying, setDeploying] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    details?: string;
  }>({
    isOpen: false,
    title: "",
  });
  const router = useRouter();

  /* ----------------- Deploy via /deploy (requires auth) ----------------- */
  const handleDeploy = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("Authentication required. Please log in first.");
      }

      // Check if GCP credentials are configured (only for GCP)
      if (provider === "gcp") {
        const hasCreds = await checkGcpCredentials();
        if (!hasCreds) {
          setShowCredsModal(true);
          return;
        }
      }

      setDeploying(true);

      const plan = buildPlan();
      const payload = buildDeploymentPayload(plan);

      // Use appropriate API endpoint based on provider
      const apiBase = provider === "gcp" ? GCP_API_BASE : AWS_API_BASE;
      const endpoint = provider === "gcp" ? "/up" : "/deploy";
      
      // For GCP, wrap payload in {ir: {...}} format
      const requestBody = provider === "gcp" ? { ir: payload } : payload;
      
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(requestBody),
      });

      const text = await res.text().catch(() => "");
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        /* keep raw text */
      }

      if (!res.ok) {
        // Handle bootstrap error specifically
        const detail = data?.detail;
        if (detail?.message === "CDK environment not bootstrapped" || 
            (typeof detail === "string" && detail.includes("not been bootstrapped")) ||
            (detail?.message && detail.message.includes("not been bootstrapped"))) {
          const hint = detail?.hint || "Please bootstrap the CDK environment first.";
          throw new Error(`CDK environment not bootstrapped. ${hint}`);
        }
        
        // Handle other errors - backend returns {detail: {message: "...", output: "..."}}
        let msg: string;
        if (typeof detail === "string") {
          msg = detail;
        } else if (detail?.message) {
          msg = detail.message;
          if (detail?.output) {
            msg += `\n${detail.output}`;
          }
        } else {
          msg = data?.error || text || `Deploy failed (${res.status})`;
        }
        throw new Error(msg);
      }

      // Success response: {message: "deploy ok", output: "..."}
      console.log("Deploy ok:", data);
      setSuccessModal({
        isOpen: true,
        title: "Deployed Successfully! 🎉",
        message: "Your infrastructure has been deployed to the cloud.",
        details: data?.output || undefined,
      });
    } catch (e: any) {
      console.error("Deployment error:", e?.message || e);
      alert(e?.message || "Something went wrong while deploying.");
    } finally {
      setDeploying(false);
    }
  };

  /* ----------------- Compile via /compile (no auth required) ----------------- */
  const handleCompile = async () => {
    try {
      setCompiling(true);

      const plan = buildPlan();
      const payload = buildDeploymentPayload(plan);

      // Use appropriate API endpoint based on provider
      const apiBase = provider === "gcp" ? GCP_API_BASE : AWS_API_BASE;
      
      const res = await fetch(`${apiBase}/compile`, {
        method: "POST",
        headers: getHeaders(false),
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
        // Backend returns {detail: {message: "synth failed", output: "..."}}
        const detail = data?.detail;
        let msg: string;
        if (typeof detail === "string") {
          msg = detail;
        } else if (detail?.message) {
          msg = detail.message;
          if (detail?.output) {
            msg += `\n${detail.output}`;
          }
        } else {
          msg = data?.error || text || `Compile failed (${res.status})`;
        }
        throw new Error(msg);
      }

      // Success response: {message: "synth ok", ir_path: "...", synth_output: "..."}
      console.log("Compile ok:", data);
      alert(`Compiled successfully (CDK synth).${data?.synth_output ? `\n\n${data.synth_output}` : ""}`);
    } catch (e: any) {
      console.error("Compile error:", e?.message || e);
      alert(e?.message || "Something went wrong while compiling.");
    } finally {
      setCompiling(false);
    }
  };

  /* ----------------- Bootstrap via /bootstrap (requires auth) ----------------- */
  const handleBootstrap = async () => {
    try {
      setBootstrapping(true);

      const token = getAccessToken();
      if (!token) {
        throw new Error("Authentication required. Please log in first.");
      }

      const plan = buildPlan();
      const payload = buildDeploymentPayload(plan);

      // Ensure region is set for bootstrap
      if (!payload.region) {
        throw new Error("Region is required for bootstrap. Please configure a region in your pipeline.");
      }

      const res = await fetch(`${AWS_API_BASE}/bootstrap`, {
        method: "POST",
        headers: getHeaders(true),
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
        // Backend returns {detail: {message: "bootstrap failed", output: "..."}} or {detail: "string"}
        const detail = data?.detail;
        let msg: string;
        if (typeof detail === "string") {
          msg = detail;
        } else if (detail?.message) {
          msg = detail.message;
          if (detail?.output) {
            msg += `\n${detail.output}`;
          }
        } else {
          msg = data?.error || text || `Bootstrap failed (${res.status})`;
        }
        throw new Error(msg);
      }

      // Success response: {message: "bootstrap ok", output: "..."}
      console.log("Bootstrap ok:", data);
      alert(`CDK environment bootstrapped successfully! 🎉${data?.output ? `\n\n${data.output}` : ""}`);
    } catch (e: any) {
      console.error("Bootstrap error:", e?.message || e);
      alert(e?.message || "Something went wrong while bootstrapping.");
    } finally {
      setBootstrapping(false);
    }
  };

  /* ----------------- Destroy via /destroy (requires auth for GCP) ----------------- */
  const handleDestroy = async () => {
    try {
      setDestroying(true);

      // For GCP, destroy needs IR with project and env
      let body: any = {};
      if (provider === "gcp") {
        const plan = buildPlan();
        const payload = buildDeploymentPayload(plan);
        body = payload; // Send full IR for GCP
      }
      
      // Use appropriate API endpoint based on provider
      const apiBase = provider === "gcp" ? GCP_API_BASE : AWS_API_BASE;
      const token = getAccessToken();
      const includeAuth = provider === "gcp"; // GCP destroy requires auth
      
      const res = await fetch(`${apiBase}/destroy`, {
        method: "POST",
        headers: getHeaders(includeAuth),
        body: JSON.stringify(body),
      });

      const text = await res.text().catch(() => "");
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        /* keep raw text */
      }

      if (!res.ok) {
        // Backend returns {detail: {message: "destroy failed", output: "..."}} or {detail: "string"}
        const detail = data?.detail;
        let msg: string;
        if (typeof detail === "string") {
          msg = detail;
        } else if (detail?.message) {
          msg = detail.message;
          if (detail?.output) {
            msg += `\n${detail.output}`;
          }
        } else {
          msg = data?.error || text || `Destroy failed (${res.status})`;
        }
        throw new Error(msg);
      }

      // Success response: {message: "destroy ok", output: "..."}
      console.log("Destroy ok:", data);
      setSuccessModal({
        isOpen: true,
        title: "Resources Destroyed Successfully! ✅",
        message: "All resources have been removed from the cloud.",
        details: data?.output || undefined,
      });
    } catch (e: any) {
      console.error("Destroy error:", e?.message || e);
      alert(e?.message || "Something went wrong while destroying resources.");
    } finally {
      setDestroying(false);
    }
  };

  /* ----------------- Preview via /gcp/preview (requires auth) ----------------- */
  const handlePreview = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("Authentication required. Please log in first.");
      }

      // Check if GCP credentials are configured
      const hasCreds = await checkGcpCredentials();
      if (!hasCreds) {
        setShowCredsModal(true);
        return;
      }

      setPreviewing(true);

      const plan = buildPlan();
      const payload = buildDeploymentPayload(plan);

      // Preview endpoint accepts {ir, creds} format
      // Backend will get credentials from user table if not provided
      const res = await fetch(`${GCP_API_BASE}/preview`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({ ir: payload }),
      });

      const text = await res.text().catch(() => "");
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        /* keep raw text */
      }

      if (!res.ok) {
        const detail = data?.detail;
        let msg: string;
        if (typeof detail === "string") {
          msg = detail;
        } else if (detail?.message) {
          msg = detail.message;
          if (detail?.output) {
            msg += `\n${detail.output}`;
          }
        } else {
          msg = data?.error || text || `Preview failed (${res.status})`;
        }
        throw new Error(msg);
      }

      console.log("Preview ok:", data);
      const previewDetails = data?.preview || data?.changeSummary 
        ? `${data?.preview ? `Preview:\n${data.preview}` : ""}${data?.changeSummary ? `${data?.preview ? "\n\n" : ""}Change Summary:\n${data.changeSummary}` : ""}`
        : undefined;
      setSuccessModal({
        isOpen: true,
        title: "Preview Completed Successfully! 🎉",
        message: "Your infrastructure changes have been previewed.",
        details: previewDetails,
      });
    } catch (e: any) {
      console.error("Preview error:", e?.message || e);
      alert(e?.message || "Something went wrong while previewing.");
    } finally {
      setPreviewing(false);
    }
  };

  /* ----------------- Status via /aws/status (no auth required) ----------------- */
  const handleStatus = async () => {
    try {
      setCheckingStatus(true);

      const res = await fetch(`${AWS_API_BASE}/status`, {
        method: "GET",
        headers: getHeaders(false),
      });

      const text = await res.text().catch(() => "");
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        /* keep raw text */
      }

      if (!res.ok) {
        const detail = data?.detail;
        let msg: string;
        if (typeof detail === "string") {
          msg = detail;
        } else if (detail?.message) {
          msg = detail.message;
        } else {
          msg = data?.error || text || `Status check failed (${res.status})`;
        }
        throw new Error(msg);
      }

      // Success response: {stacks: [...]}
      console.log("Status:", data);
      const stacks = data?.stacks || [];
      if (Array.isArray(stacks) && stacks.length > 0) {
        const stackList = stacks.join("\n");
        alert(`Found ${stacks.length} stack(s):\n\n${stackList}`);
      } else {
        alert("No stacks found.");
      }
    } catch (e: any) {
      console.error("Status error:", e?.message || e);
      alert(e?.message || "Something went wrong while checking status.");
    } finally {
      setCheckingStatus(false);
    }
  };

  /* ----------------- Health check via /aws/health ----------------- */
  const checkHealth = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${AWS_API_BASE}/health`, {
        method: "GET",
        headers: getHeaders(false),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json().catch(() => ({}));
      return data?.status === "ok";
    } catch {
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    getPlan: () => buildPlan(),
    getPrompt: () => buildPrompt(buildPlan()),
    buildDeploymentPayload: (plan: Plan) => buildDeploymentPayload(plan),
    getProvider: () => provider,
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
        <div className="p-3 border-t border-gray-200 space-y-2">
          {/* Print Prompt - Always shown */}
            <button
              onClick={() => {
                const plan = buildPlan();
                const prompt = buildPrompt(plan);
                console.log("=== Prompt ===\n", prompt);
                const payload = buildDeploymentPayload(plan);
              
              // For GCP, wrap in {ir: {...}} format for console output
              if (provider === "gcp") {
                const wrappedPayload = { ir: payload };
                console.log("=== /gcp/up payload ===\n", JSON.stringify(wrappedPayload, null, 2));
              } else {
                console.log("=== /deploy payload ===\n", JSON.stringify(payload, null, 2));
              }
              }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border border-teal-200 text-teal-700 hover:bg-teal-50"
              title="Print Prompt"
            >
              Print Prompt
            </button>

          {/* AWS-specific buttons */}
          {provider === "aws" && (
            <>
              <div className="grid grid-cols-2 gap-2">
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
              onClick={handleBootstrap}
              disabled={bootstrapping}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
                "bg-purple-600 text-white hover:bg-purple-700",
                "focus:outline-none focus:ring-4 focus:ring-purple-200/70",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "shadow-sm transition-all",
              ].join(" ")}
              title="Bootstrap CDK environment"
            >
              {bootstrapping ? "Bootstrapping…" : "Bootstrap"}
            </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
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

            <button
              type="button"
              onClick={handleStatus}
              disabled={checkingStatus}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
                "bg-blue-600 text-white hover:bg-blue-700",
                "focus:outline-none focus:ring-4 focus:ring-blue-200/70",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "shadow-sm transition-all",
              ].join(" ")}
              title="Check CDK stack status"
            >
              {checkingStatus ? "Checking…" : "Status"}
            </button>
              </div>

            <button
              type="button"
              onClick={handleDestroy}
              disabled={destroying}
              className={[
                  "w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
                "bg-red-600 text-white hover:bg-red-700",
                "focus:outline-none focus:ring-4 focus:ring-red-200/70",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "shadow-sm transition-all",
              ].join(" ")}
              title="Destroy all stacks"
            >
              {destroying ? "Destroying…" : "Destroy"}
            </button>
            </>
          )}

          {/* GCP-specific buttons */}
          {provider === "gcp" && (
            <>
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewing}
                className={[
                  "w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
                  "bg-indigo-600 text-white hover:bg-indigo-700",
                  "focus:outline-none focus:ring-4 focus:ring-indigo-200/70",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                  "shadow-sm transition-all",
                ].join(" ")}
                title="Preview changes before deploying"
              >
                {previewing ? "Previewing…" : "Preview"}
              </button>

              <button
                type="button"
                onClick={handleDeploy}
                disabled={deploying}
                className={[
                  "w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
                  "bg-teal-600 text-white hover:bg-teal-700",
                  "focus:outline-none focus:ring-4 focus:ring-teal-200/70",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                  "shadow-sm transition-all",
                ].join(" ")}
                title="Deploy to GCP"
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

              <button
                type="button"
                onClick={handleDestroy}
                disabled={destroying}
                className={[
                  "w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
                  "bg-red-600 text-white hover:bg-red-700",
                  "focus:outline-none focus:ring-4 focus:ring-red-200/70",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                  "shadow-sm transition-all",
                ].join(" ")}
                title="Destroy GCP resources"
              >
                {destroying ? "Destroying…" : "Destroy"}
              </button>
            </>
          )}
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

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={showCredsModal}
        onClose={() => setShowCredsModal(false)}
        provider={provider === "gcp" ? "gcp" : provider === "aws" ? "aws" : "azure"}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, title: "" })}
        title={successModal.title}
        message={successModal.message}
        details={successModal.details}
        autoCloseDelay={successModal.details ? 0 : 3000} // Auto-close only if no details
      />
    </div>
  );
};

const Canvas = forwardRef(CanvasInner);
export default Canvas;
