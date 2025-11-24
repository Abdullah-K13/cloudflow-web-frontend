"use client";

import React, { useCallback, useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import CredentialsModal from "./ui/credentials-modal";
import SuccessModal from "./ui/success-modal";
import ServiceConfigPanel from "./service-config-panel";
import RequirementsModal from "./requirements-modal";
import OptimizationResults from "./optimization-results";
import { DollarSign, TrendingDown } from "lucide-react";
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
const ServiceNode: React.FC<{ data: { label: string; img: string; cost?: number } }> = ({ data }) => {
  const c = { base: "#fff", border: "#E2E8F0", text: "#334155" };
  return (
    <div
      style={{
        width: 150,
        height: 70, // Increased height for cost
        background: c.base,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column", // Changed to column
        padding: "6px 10px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        position: "relative"
      }}
    >
      <Handle type="source" position={Position.Right} style={{ top: 27 }} />
      <Handle type="target" position={Position.Left} style={{ top: 27 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "white",
            border: `1px solid ${c.border}`,
            display: "grid",
            placeItems: "center",
            flexShrink: 0
          }}
        >
          <img src={data.img} alt={data.label} style={{ width: 20, height: 20 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <div style={{ fontWeight: 600, color: c.text, fontSize: 14 }}>{data.label}</div>
        </div>
      </div>

      {/* Cost Badge */}
      <div style={{
        marginTop: 6,
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: "#64748b",
        backgroundColor: "#f1f5f9",
        padding: "2px 6px",
        borderRadius: 4,
        alignSelf: "flex-start"
      }}>
        <DollarSign size={10} />
        <span>{data.cost !== undefined ? `$${data.cost.toFixed(2)}/mo` : "Calc..."}</span>
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
  // New Services
  { id: "ecs", label: "AWS ECS", img: "/aws-icons/ecs.png" },
  { id: "ecr", label: "AWS ECR", img: "/aws-icons/ecr.png" },
  { id: "secretsmanager", label: "Secrets Manager", img: "/aws-icons/secretsmanager.png" },
  { id: "cognito", label: "Cognito", img: "/aws-icons/cognito.png" },
  { id: "vpc", label: "AWS VPC", img: "/aws-icons/vpc.png" },
  { id: "cloudwatch", label: "CloudWatch", img: "/aws-icons/cloudwatch.png" },
  { id: "elasticache", label: "ElastiCache", img: "/aws-icons/elasticache.png" },
  { id: "sfn", label: "Step Functions", img: "/aws-icons/stepfunctions.png" },
  { id: "events_rule", label: "EventBridge Rule", img: "/aws-icons/eventbridge.png" },
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
  | "firestore"
  | "ec2"
  | "rds";
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
  rds: "rds",
  ec2: "ec2",
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
  ec2: "aws.ec2",
  rds: "aws.rds",
  ecs: "aws.ecs",
  ecr: "aws.ecr",
  secretsmanager: "aws.secretsmanager",
  cognito: "aws.cognito",
  vpc: "aws.vpc",
  cloudwatch: "aws.cloudwatch",
  elasticache: "aws.elasticache",
  cloudfront: "aws.cloudfront",
  other: "aws.other",
  // GCP
  "gcp-storage": "gcp.storage",
  pubsub: "gcp.pubsub",
  "cloud-run": "gcp.run",
  "secret-manager": "gcp.secretmanager",
  firestore: "gcp.firestore",
};

// friendly label (not used by backend payload now, but handy for debugging)
function computeIntent(src: string, tgt: string): "notify" | "consume" | "invoke" | "read" | "write" | "deliver" | "access" | "connect" | "pull" {
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

  // --- NEW INTENTS ---
  // EC2 -> RDS/ElastiCache
  if (src === "ec2" && (tgt === "rds" || tgt === "elasticache")) return "connect";
  // ECS -> RDS/ElastiCache
  if (src === "ecs" && (tgt === "rds" || tgt === "elasticache")) return "connect";
  // Lambda -> Secrets Manager
  if (src === "lambda" && tgt === "secretsmanager") return "read";
  // ECS -> ECR
  if (src === "ecs" && tgt === "ecr") return "pull";
  // Lambda -> CloudWatch
  if (src === "lambda" && tgt === "cloudwatch") return "write";

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

// Connection Rules based on CAPABILITIES.md
const CONNECTION_RULES: Record<string, string[]> = {
  s3: ["sqs", "lambda", "sns", "events_rule"],
  sns: ["lambda", "sqs"],
  sqs: ["lambda"],
  events_rule: ["lambda"],
  apigateway: ["lambda"],
  lambda: ["dynamodb", "sfn", "secretsmanager", "cloudwatch"],
  dynamodb: ["lambda"],
  kinesis: ["lambda"],
  ec2: ["rds", "elasticache"],
  ecs: ["rds", "elasticache", "ecr"],
  // GCP
  "gcp-storage": ["pubsub"],
  pubsub: ["cloud-run"],
  "cloud-run": ["secret-manager"],
};

const isValidConnection = (src: string, tgt: string): boolean => {
  // Normalize types if needed (e.g. remove 'aws.' prefix if present in internal types, though here we use internal IDs)
  const allowed = CONNECTION_RULES[src];
  return allowed ? allowed.includes(tgt) : false;
};

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
  // --- NEW SERVICES ---
  if (kind === "aws.ec2") {
    return {
      instanceType: d.instanceType || "t3.micro",
      ami: d.ami || undefined,
      physicalName: d.physicalName ?? undefined,
    };
  }
  if (kind === "aws.rds") {
    return {
      engine: d.engine || "postgres",
      instanceClass: d.dbClass || "db.t3.micro",
      allocatedStorage: Number(d.storage || 20),
      multiAZ: !!d.multiAZ,
      physicalName: d.dbIdentifier ?? undefined,
    };
  }
  if (kind === "aws.ecs") {
    return {
      launchType: d.launchType || "FARGATE",
      physicalName: d.clusterName ?? undefined,
    };
  }
  if (kind === "aws.ecr") {
    return {
      physicalName: d.repositoryName ?? undefined,
    };
  }
  if (kind === "aws.secretsmanager") {
    return {
      physicalName: d.secretName ?? undefined,
      description: d.description ?? undefined,
    };
  }
  if (kind === "aws.cognito") {
    return {
      physicalName: d.userPoolName ?? undefined,
    };
  }
  if (kind === "aws.vpc") {
    return {
      cidr: d.cidrBlock || "10.0.0.0/16",
      physicalName: d.vpcName ?? undefined,
    };
  }
  if (kind === "aws.cloudwatch") {
    return {
      retention: Number(d.retentionDays || 30),
      physicalName: d.logGroupName ?? undefined,
    };
  }
  if (kind === "aws.elasticache") {
    return {
      engine: d.engine || "redis",
      nodeType: d.nodeType || "cache.t3.micro",
      numCacheNodes: Number(d.numCacheNodes || 1),
      physicalName: d.clusterId ?? undefined,
    };
  }
  if (kind === "aws.cloudfront") {
    return {
      priceClass: d.priceClass || "PriceClass_100",
      physicalName: d.distributionId ?? undefined,
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
  { items, updateItemPosition, onSelectedNodesChange, onCanvasNodesChange, currentPipelineId, onPipelineCreated }: CanvasProps,
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
    onCanvasNodesChange?.(nodes.map((n) => ({
      id: n.id,
      type: String(n.type),
      data: {
        cost: (n.data as any).cost,
        label: (n.data as any).label
      }
    })));
  }, [nodes, onCanvasNodesChange]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const srcNode = nodes.find((n) => n.id === params.source);
      const tgtNode = nodes.find((n) => n.id === params.target);
      const srcType = String(srcNode?.type);
      const tgtType = String(tgtNode?.type);

      if (!isValidConnection(srcType, tgtType)) {
        alert(`Invalid connection: ${srcNode?.data.label} cannot connect to ${tgtNode?.data.label}.\n\nRefer to CAPABILITIES.md for valid connections.`);
        return;
      }

      setEdges((eds) => addEdge({ ...params, type: "bezier", markerEnd: { type: MarkerType.ArrowClosed } }, eds));
    },
    [setEdges, nodes]
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

      setNodes((nds) => {
        const newNode = {
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
            cost: 0, // Init cost
          },
        };
        // Trigger cost fetch for the new node
        setTimeout(() => fetchNodeCost(newNode as any), 100);
        return nds.concat(newNode);
      });
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

  // Cost Optimization State
  // Cost Optimization State
  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<any[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);

  // Fetch cost for a single node (simple estimate)
  const fetchNodeCost = async (node: Node) => {
    try {
      const svc = (node.data as any).service;
      // Map node type to service name for pricing API
      // The pricing API expects simple names like "lambda", "s3", "vm"
      // We can derive this from the node type or KIND_MAP
      let serviceName = String(node.type);

      // Normalize service names to match pricing API expectations
      if (serviceName.startsWith("aws.")) serviceName = serviceName.replace("aws.", "");
      if (serviceName.startsWith("gcp.")) serviceName = serviceName.replace("gcp.", "");

      // Manual mapping for some services if needed
      const typeMap: Record<string, string> = {
        "gcp-storage": "cloud_storage",
        "pubsub": "pubsub",
        "cloud-run": "cloud_run",
        "secret-manager": "secret_manager",
        "firestore": "firestore",
        "rds": "rds",
        "lambda": "lambda",
        "s3": "s3",
        "ec2": "ec2",
        "dynamodb": "dynamodb",
        "sqs": "sqs",
        "sns": "sns",
        "apigateway": "apigw",
        "kinesis": "kinesis",
        "sfn": "sfn",
        "events_rule": "events",
        "cloudfront": "cloudfront",
        "ecs": "ecs",
        "ecr": "ecr",
        "secretsmanager": "secretsmanager",
        "cognito": "cognito",
        "vpc": "vpc",
        "cloudwatch": "cloudwatch",
        "elasticache": "elasticache"
      };

      const apiService = typeMap[serviceName] || serviceName;

      // Prepare config
      // We mix normalized props and raw config to ensure we capture everything
      const kind = KIND_MAP[node.type as ExtendedPlanNodeType] || "aws.other";
      const normalizedProps = normalizeToDesiredProps(kind, svc.config);
      const config = { ...svc.config, ...normalizedProps };

      const res = await fetch(`${API_BASE}/cost-optimization/price`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({
          service: apiService,
          cloud: provider,
          region: svc.config.region || (provider === "gcp" ? "us-central1" : "us-east-1"),
          config: config
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.price !== undefined) {
          setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, cost: data.price } } : n));
        }
      }
    } catch (e) {
      console.error("Failed to fetch cost", e);
    }
  };

  // Recalculate total cost whenever nodes change
  useEffect(() => {
    const total = nodes.reduce((sum, node) => sum + ((node.data as any).cost || 0), 0);
    setTotalSavings(total); // Reusing setTotalSavings state for total cost for now, or we should add a new state
  }, [nodes]);

  // We need a separate state for Total Monthly Cost vs Total Savings (from optimization)
  // Let's add one.
  const [currentTotalCost, setCurrentTotalCost] = useState(0);

  useEffect(() => {
    const total = nodes.reduce((sum, node) => sum + ((node.data as any).cost || 0), 0);
    setCurrentTotalCost(total);
  }, [nodes]);

  const handleRequirementsSubmit = async (requirements: any) => {
    setIsAnalyzing(true);
    try {
      const plan = buildPlan();
      const payload = buildDeploymentPayload(plan);

      // Construct IR from payload
      const ir = {
        project: payload.project,
        env: payload.env,
        region: payload.region,
        nodes: payload.nodes,
        edges: payload.edges
      };

      const res = await fetch(`${API_BASE}/cost-optimization/analyze`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({
          ir,
          cloud: provider,
          requirements
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOptimizationSuggestions(data.suggestions);
        setTotalSavings(data.totalSavings);
        setIsRequirementsOpen(false);
        setIsResultsOpen(true);
      }
    } catch (e) {
      alert("Optimization analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
    setNodes((nds) => nds.map((n) => {
      if (n.id === activeNodeId) {
        const updatedNode = { ...n, data: { ...(n.data || {}), service: svc } };
        // Trigger cost fetch
        fetchNodeCost(updatedNode as any);
        return updatedNode;
      }
      return n;
    }));
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

  /* ----------------- Auto-save pipeline if needed ----------------- */
  const ensurePipelineExists = async (): Promise<string | null> => {
    // If pipeline already exists, return its ID
    if (currentPipelineId) {
      return currentPipelineId;
    }

    // Otherwise, create a new pipeline
    try {
      const token = getAccessToken();
      if (!token) {
        console.log("No auth token, cannot auto-save pipeline");
        return null;
      }

      const plan = buildPlan();
      const payload = buildDeploymentPayload(plan);

      const env = payload.env || "dev";
      const region = payload.region || payload.location || "us-east-1";
      const cloud = provider === "gcp" ? "gcp" : provider === "azure" ? "azure" : "aws";

      const API_BASE =
        typeof window === "undefined"
          ? process.env.API_BASE_URL || "http://127.0.0.1:8000"
          : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

      const pipelineData = {
        name: "Untitled Pipeline",
        env: env as "dev" | "staging" | "prod",
        cloud: cloud as "aws" | "gcp" | "azure",
        region: region,
        payload: payload,
        status: "draft" as const,
      };

      const res = await fetch(`${API_BASE}/pipelines/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(pipelineData),
      });

      if (res.ok) {
        const savedPipeline = await res.json();
        const pipelineId = typeof savedPipeline.id === 'string' ? savedPipeline.id : String(savedPipeline.id);
        console.log("Pipeline auto-saved:", pipelineId);

        // Notify parent component about the auto-created pipeline
        if (onPipelineCreated) {
          onPipelineCreated(pipelineId);
        }

        return pipelineId;
      } else {
        console.error("Failed to auto-save pipeline:", await res.text());
        return null;
      }
    } catch (error) {
      console.error("Error auto-saving pipeline:", error);
      return null;
    }
  };

  /* ----------------- Update Pipeline Status ----------------- */
  const updatePipelineStatus = async (status: "draft" | "ready" | "deploying" | "deployed" | "failed") => {
    // First, ensure pipeline exists
    const pipelineId = currentPipelineId || await ensurePipelineExists();

    if (!pipelineId) {
      console.log("No pipeline ID available, skipping status update");
      return;
    }

    try {
      const token = getAccessToken();
      if (!token) {
        console.log("No auth token, skipping status update");
        return;
      }

      const API_BASE =
        typeof window === "undefined"
          ? process.env.API_BASE_URL || "http://127.0.0.1:8000"
          : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

      const res = await fetch(`${API_BASE}/pipelines/${pipelineId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        console.log(`Pipeline status updated to: ${status}`);
      } else {
        console.error("Failed to update pipeline status:", await res.text());
      }
    } catch (error) {
      console.error("Error updating pipeline status:", error);
      // Silently fail - status update is not critical
    }
  };

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

      // Update pipeline status to "ready" on successful deployment
      await updatePipelineStatus("ready");

      setSuccessModal({
        isOpen: true,
        title: "Deployed Successfully! 🎉",
        message: "Your infrastructure has been deployed to the cloud.",
        details: data?.output || undefined,
      });
    } catch (e: any) {
      console.error("Deployment error:", e?.message || e);

      // Update pipeline status to "failed" on deployment error
      await updatePipelineStatus("failed");

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

      // Update pipeline status to "ready" on successful compile
      await updatePipelineStatus("ready");

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

      // Update pipeline status to "ready" on successful preview
      await updatePipelineStatus("ready");

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

  // Get all services from nodes
  const getAllServices = useCallback((): ServiceItem[] => {
    return nodes
      .map((n) => (n.data as any)?.service as ServiceItem | undefined)
      .filter((s): s is ServiceItem => s !== undefined);
  }, [nodes]);

  useImperativeHandle(ref, () => ({
    getPlan: () => buildPlan(),
    getPrompt: () => buildPrompt(buildPlan()),
    buildDeploymentPayload: (plan: Plan) => buildDeploymentPayload(plan),
    getProvider: () => provider,
    getAllServices: () => getAllServices(),
  }));

  const [search, setSearch] = useState("");

  const filteredServices = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return currentServices;
    return currentServices.filter((s) => s.label.toLowerCase().includes(q));
  }, [currentServices, search]);

  return (
    <div className="w-full h-screen flex min-h-0">
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

      <RequirementsModal
        isOpen={isRequirementsOpen}
        onClose={() => setIsRequirementsOpen(false)}
        onSubmit={handleRequirementsSubmit}
        isLoading={isAnalyzing}
      />

      <OptimizationResults
        isOpen={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
        suggestions={optimizationSuggestions}
        totalSavings={totalSavings}
        onApply={(id) => alert(`Applying suggestion ${id} (Implementation coming soon)`)}
      />

      {/* Total Cost Panel */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur border border-gray-200 rounded-xl shadow-lg p-4 w-64">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
          <DollarSign size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Total Monthly Cost</span>
        </div>
        <div className="text-2xl font-bold text-slate-800">
          ${currentTotalCost.toFixed(2)}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Estimated based on configuration
        </div>
      </div>

      {/* ===== New Right-side Palette Panel ================================== */}
      <aside
        className="w-[320px] shrink-0 border-l border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 flex flex-col h-full overflow-hidden"
        aria-label="Cloud services palette"
      >
        {/* Provider switcher */}
        <div className="p-3 border-b border-gray-200 shrink-0">
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

        {/* Actions - Fixed at top, scrollable if needed */}
        <div className="p-3 border-b border-gray-200 space-y-2 shrink-0 max-h-[35vh] overflow-y-auto">
          {/* Optimization Button */}
          <button
            onClick={() => setIsRequirementsOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-200/70"
          >
            <TrendingDown size={16} />
            Optimize Costs
          </button>

          <div className="grid grid-cols-2 gap-2">
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
        </div>

        {/* Services list - Scrollable */}
        <div className="relative flex-1 min-h-0 overflow-y-auto p-3 space-y-2" id="serviceScrollArea">

          {/* Scroll buttons */}
          <button
            onClick={() => {
              const container = document.getElementById("serviceScrollArea");
              container?.scrollBy({ top: -100, behavior: "smooth" });
            }}
            className="absolute top-2 right-2 z-10 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-gray-50"
          >
            ↑
          </button>

          <button
            onClick={() => {
              const container = document.getElementById("serviceScrollArea");
              container?.scrollBy({ top: 100, behavior: "smooth" });
            }}
            className="absolute bottom-2 right-2 z-10 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-gray-50"
          >
            ↓
          </button>

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
