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
const ServiceNode: React.FC<{ data: { label: string; img: string; cost?: number; costIsEstimated?: boolean } }> = ({ data }) => {
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
        <span>
          {data.cost !== undefined 
            ? `$${data.cost.toFixed(2)}/mo${data.costIsEstimated ? " (est.)" : ""}`
            : "Calc..."}
        </span>
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
  { id: "azure.storage", label: "Azure Storage", img: "/azure-icons/10086-icon-service-Storage-Accounts.png" },
  { id: "azure.servicebus", label: "Azure Service Bus", img: "/azure-icons/10836-icon-service-Azure-Service-Bus.png" },
  { id: "azure.containerapp", label: "Azure Container Apps", img: "/azure-icons/02989-icon-service-Container-Apps-Environments.png" },
  { id: "azure.vm", label: "Azure Virtual Machine", img: "/azure-icons/10021-icon-service-Virtual-Machine.png" },
  { id: "azure.functionapp", label: "Azure Function App", img: "/azure-icons/10029-icon-service-Function-Apps.png" },
  { id: "azure.sql", label: "Azure SQL Database", img: "/azure-icons/10130-icon-service-SQL-Database.png" },
  { id: "azure.cosmosdb", label: "Azure Cosmos DB", img: "/azure-icons/10121-icon-service-Azure-Cosmos-DB.png" },
  { id: "azure.apimanagement", label: "Azure API Management", img: "/azure-icons/10042-icon-service-API-Management-Services.png" },
  { id: "azure.keyvault", label: "Azure Key Vault", img: "/azure-icons/10245-icon-service-Key-Vaults.png" },
  { id: "azure.appinsights", label: "Azure Application Insights", img: "/azure-icons/00012-icon-service-Application-Insights.png" },
  { id: "azure.vnet", label: "Azure Virtual Network", img: "/azure-icons/10061-icon-service-Virtual-Networks.png" },
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
  | "rds"
  | "azure.storage"
  | "azure.servicebus"
  | "azure.containerapp"
  | "azure.vm"
  | "azure.functionapp"
  | "azure.sql"
  | "azure.cosmosdb"
  | "azure.apimanagement"
  | "azure.keyvault"
  | "azure.appinsights"
  | "azure.vnet";
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
  // Azure Services
  "azure.storage": "azure.storage",
  "azure.servicebus": "azure.servicebus",
  "azure.containerapp": "azure.containerapp",
  "azure.vm": "azure.vm",
  "azure.functionapp": "azure.functionapp",
  "azure.sql": "azure.sql",
  "azure.cosmosdb": "azure.cosmosdb",
  "azure.apimanagement": "azure.apimanagement",
  "azure.keyvault": "azure.keyvault",
  "azure.appinsights": "azure.appinsights",
  "azure.vnet": "azure.vnet",
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
  // Azure (IDs already in correct format, map to themselves)
  "azure.storage": "azure.storage",
  "azure.servicebus": "azure.servicebus",
  "azure.containerapp": "azure.containerapp",
  "azure.vm": "azure.vm",
  "azure.functionapp": "azure.functionapp",
  "azure.sql": "azure.sql",
  "azure.cosmosdb": "azure.cosmosdb",
  "azure.apimanagement": "azure.apimanagement",
  "azure.keyvault": "azure.keyvault",
  "azure.appinsights": "azure.appinsights",
  "azure.vnet": "azure.vnet",
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
  // AWS
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
  // Azure - All valid connections from Edge Connections Reference
  "azure.storage": [
    "azure.servicebus",      // Event Grid subscription
    "azure.functionapp",     // Storage connection for blob triggers
    "azure.containerapp",    // Storage connection
    "azure.sql",             // For backups/data import
    "azure.cosmosdb",        // For backups/data import
    "azure.vm",              // For VM disk/file shares
    "azure.apimanagement",   // For API documentation
  ],
  "azure.servicebus": [
    "azure.containerapp",    // Queue connection
    "azure.functionapp",     // Queue connection
    "azure.sql",             // For database notifications
    "azure.cosmosdb",        // For database notifications
    "azure.vm",              // For VM notifications
    "azure.apimanagement",   // For API events
  ],
  "azure.containerapp": [
    "azure.functionapp",     // Function App URL
    "azure.storage",         // Storage connection
    "azure.servicebus",      // Queue connection
    "azure.sql",             // SQL connection
    "azure.cosmosdb",        // Cosmos connection
    "azure.keyvault",        // Key Vault URI
    "azure.appinsights",     // Monitoring
    "azure.apimanagement",   // Gateway URL
    "azure.vnet",            // VNet info
  ],
  "azure.functionapp": [
    "azure.containerapp",    // Container App FQDN
    "azure.storage",         // Storage connection
    "azure.servicebus",      // Queue connection
    "azure.sql",             // SQL connection
    "azure.cosmosdb",        // Cosmos connection
    "azure.keyvault",        // Key Vault URI
    "azure.appinsights",     // Monitoring
    "azure.apimanagement",   // Gateway URL
    "azure.vnet",            // VNet info
  ],
  "azure.vm": [
    "azure.storage",         // Storage connection
    "azure.servicebus",      // Queue connection
    "azure.containerapp",    // Container App FQDN
    "azure.functionapp",     // Function App URL
    "azure.sql",             // SQL connection
    "azure.cosmosdb",        // Cosmos connection
    "azure.keyvault",        // Key Vault URI
    "azure.appinsights",     // Monitoring
    "azure.apimanagement",   // Gateway URL
    "azure.vnet",            // VNet info (for reference)
  ],
  "azure.sql": [
    "azure.functionapp",     // SQL connection info
    "azure.containerapp",    // SQL connection info
    "azure.storage",         // For backups
    "azure.servicebus",       // For database events
    "azure.vm",              // For VM connection
    "azure.vnet",            // For database networking
  ],
  "azure.cosmosdb": [
    "azure.functionapp",     // Cosmos connection info
    "azure.containerapp",    // Cosmos connection info
    "azure.storage",         // For backups
    "azure.servicebus",      // For database events
    "azure.vm",              // For VM connection
    "azure.vnet",            // For database networking
  ],
  "azure.keyvault": [
    "azure.functionapp",     // Key Vault URI
    "azure.containerapp",    // Key Vault URI
    "azure.sql",             // For database credentials
    "azure.cosmosdb",        // For database credentials
    "azure.vm",              // For VM secrets
    "azure.apimanagement",   // For API keys
    "azure.storage",         // For storage account keys
    "azure.servicebus",      // For queue credentials
    "azure.vnet",            // For key vault networking
  ],
  "azure.appinsights": [
    "azure.functionapp",     // Instrumentation
    "azure.containerapp",    // Instrumentation
    "azure.sql",             // Database monitoring
    "azure.cosmosdb",        // Database monitoring
    "azure.vm",              // VM monitoring
    "azure.apimanagement",   // API monitoring
    "azure.storage",         // Storage monitoring
    "azure.servicebus",      // Queue monitoring
  ],
  "azure.apimanagement": [
    "azure.functionapp",     // Gateway URL
    "azure.containerapp",    // Gateway URL
    "azure.vm",              // VM info
    "azure.keyvault",        // Key Vault URI
    "azure.appinsights",     // Instrumentation
    "azure.sql",             // Database APIs
    "azure.cosmosdb",        // Database APIs
    "azure.storage",         // Storage APIs
    "azure.servicebus",      // Queue APIs
    "azure.vnet",            // API gateway networking
  ],
  "azure.vnet": [
    "azure.vm",              // VM networking
    "azure.containerapp",    // Container networking
    "azure.functionapp",     // Function networking
    "azure.sql",             // Database networking
    "azure.cosmosdb",        // Database networking
    "azure.storage",         // Storage networking
    "azure.servicebus",      // Queue networking
    "azure.apimanagement",   // API gateway networking
    "azure.keyvault",        // Key vault networking
    "azure.appinsights",     // For reference
  ],
};

const isValidConnection = (src: string, tgt: string, provider?: Provider): boolean => {
  // Normalize types if needed (e.g. remove 'aws.' prefix if present in internal types, though here we use internal IDs)
  const allowed = CONNECTION_RULES[src];
  if (!allowed) return false;
  
  // Check if target is in allowed list
  return allowed.includes(tgt);
};

// minimal props normalization for UI → payload mapping
function normalizeToDesiredProps(kind: string, raw: any): Record<string, any> {
  const d = raw || {};
  if (kind === "aws.lambda") {
    return {
      runtime: d.runtime || "python3.12",
      memory: Number(d.memory ?? d.memoryMB ?? d.memory_mb ?? 256),
      timeout: Number(d.timeout ?? d.timeoutSec ?? d.timeout_s ?? 30),
      handler: d.handler || "app.lambda_handler",
      codeUri: d.codeUri || d.package_path || "src/processor",
      physicalName: d.lambda_name || d.functionName || d.physicalName || undefined,
    };
  }
  if (kind === "aws.s3") {
    return {
      versioning: d.versioning !== undefined ? !!d.versioning : true,
      // turn on EventBridge if the bucket has any outgoing edges (we set this later)
      eventBridge: !!d.eventBridge,
      physicalName: d.bucketName || d.physicalName || undefined,
    };
  }
  if (kind === "aws.sqs") {
    return {
      visibilityTimeout: Number(d.visibilityTimeout ?? d.visibilityTimeoutSec ?? 60),
      dlq: d.dlq ?? d.deadLetterTargetArn ?? undefined,
      physicalName: d.queueName || d.physicalName || undefined,
    };
  }
  if (kind === "aws.sns") {
    return {
      displayName: d.displayName ?? undefined,
      physicalName: d.topicName || d.physicalName || undefined,
    };
  }
  if (kind === "aws.events.rule") {
    return {
      pattern: d.pattern ?? undefined,
      schedule: d.schedule || undefined,
      ruleName: d.ruleName || undefined,
      targets: d.targets || undefined,
      physicalName: d.ruleName || undefined,
    };
  }
  if (kind === "aws.apigw") {
    return {
      restApiName: d.restApiName || d.apiName || d.api_name || undefined,
      apiName: d.restApiName || d.apiName || d.api_name || undefined,
      description: d.description || undefined,
      deploymentStage: d.deploymentStage || "prod",
      physicalName: d.restApiName || d.apiName || d.api_name || undefined,
    };
  }
  if (kind === "aws.dynamodb") {
    // Handle partitionKey and sortKey which might be objects with name and type
    const partitionKeyObj = d.partitionKey;
    const sortKeyObj = d.sortKey;
    const partitionKey = typeof partitionKeyObj === 'object' ? partitionKeyObj?.name : (partitionKeyObj || "pk");
    const sortKey = typeof sortKeyObj === 'object' ? sortKeyObj?.name : sortKeyObj;
    
    return {
      partitionKey: partitionKey,
      sortKey: sortKey,
      billing: d.billing ?? "PAY_PER_REQUEST",
      stream: d.stream !== undefined ? !!d.stream : true,
      physicalName: d.tableName || d.physicalName || undefined,
    };
  }
  if (kind === "aws.sfn") {
    return {
      stateMachineName: d.stateMachineName || undefined,
      definition: d.definition || undefined,
      physicalName: d.stateMachineName || d.physicalName || undefined,
    };
  }
  if (kind === "aws.kinesis") {
    return {
      shards: d.shards ?? d.shardCount ?? 1,
      physicalName: d.streamName || d.physicalName || undefined,
    };
  }
  // --- NEW SERVICES ---
  if (kind === "aws.ec2") {
    return {
      instanceType: d.instanceType || "t3.micro",
      instanceName: d.instanceName || undefined,
      ami: d.ami || undefined,
      keyName: d.keyName || undefined,
      securityGroups: Array.isArray(d.securityGroups) ? d.securityGroups : (d.securityGroups ? [d.securityGroups] : undefined),
      physicalName: d.instanceName || d.physicalName || undefined,
    };
  }
  if (kind === "aws.rds") {
    return {
      engine: d.engine || "postgres",
      engineVersion: d.engineVersion || "16.3",
      instanceClass: d.instanceClass || d.dbClass || "db.t3.micro",
      allocatedStorage: Number(d.allocatedStorage || d.storage || 20),
      multiAZ: !!d.multiAZ,
      masterUsername: d.masterUsername || "admin",
      masterPassword: d.masterPassword || undefined,
      physicalName: d.instanceIdentifier || d.dbIdentifier || undefined,
    };
  }
  if (kind === "aws.ecs") {
    return {
      launchType: d.launchType || "FARGATE",
      clusterName: d.clusterName || undefined,
      serviceName: d.serviceName || undefined,
      taskDefinition: d.taskDefinition || {
        cpu: d.cpu || "256",
        memory: d.memory || "512",
        image: d.image || "nginx:latest"
      },
      desiredCount: d.desiredCount || 1,
      physicalName: d.clusterName || undefined,
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
      distributionName: d.distributionName || undefined,
      originDomain: d.originDomain || undefined,
      priceClass: d.priceClass || "PriceClass_100",
      enabled: d.enabled !== undefined ? d.enabled : true,
      physicalName: d.distributionName || d.distributionId || undefined,
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
      physicalName: d.topicName || undefined,
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
      secretId: d.secretId || undefined,
      secretValue: d.secretValue || undefined,
      labels: d.labels || {},
      physicalName: d.secretId || undefined,
    };
  }
  if (kind === "gcp.firestore") {
    return {
      locationId: d.locationId || "nam5",
      databaseId: d.databaseName || d.databaseId || "(default)",
      databaseName: d.databaseName || d.databaseId || "(default)",
    };
  }
  // Azure Services
  if (kind === "azure.storage") {
    return {
      accountName: d.accountName || undefined,
      accountKind: d.accountKind || "StorageV2",
      sku: d.sku || "Standard_LRS",
      containerName: d.containerName || undefined,
      physicalName: d.accountName || undefined,
    };
  }
  if (kind === "azure.servicebus") {
    return {
      sku: d.sku || "Basic",
      queueName: d.queueName || undefined,
      partition: d.partition !== undefined ? !!d.partition : false,
      physicalName: d.queueName || undefined,
    };
  }
  if (kind === "azure.containerapp") {
    return {
      image: d.image || "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest",
      cpu: d.cpu || 0.25,
      memory: d.memory || "0.5Gi",
      env: d.env || {},
    };
  }
  if (kind === "azure.vm") {
    return {
      vmSize: d.vmSize || "Standard_B2s",  // Changed default to B2s (more widely available)
      adminUsername: d.adminUsername || "azureuser",
      adminPassword: d.adminPassword || undefined,
      osType: d.osType || "Linux",
      imagePublisher: d.imagePublisher || "Canonical",
      imageOffer: d.imageOffer || "0001-com-ubuntu-server-jammy",
      imageSku: d.imageSku || "22_04-lts-gen2",
    };
  }
  if (kind === "azure.functionapp") {
    return {
      sku: d.sku || "Y1",
      runtime: d.runtime || "python",
      functionsVersion: d.functionsVersion || "~4",
    };
  }
  if (kind === "azure.sql") {
    return {
      serverName: d.serverName || undefined,
      databaseName: d.databaseName || undefined,
      adminLogin: d.adminLogin || "sqladmin",
      adminPassword: d.adminPassword || undefined,
      serviceTier: d.sku?.name || d.serviceTier || "S0",
      sku: d.sku || { name: "S0", tier: "Standard" },
    };
  }
  if (kind === "azure.cosmosdb") {
    return {
      kind: d.kind || "GlobalDocumentDB",
      databaseName: d.databaseName || undefined,
      containerName: d.containerName || undefined,
      partitionKey: d.partitionKey || "/id",
    };
  }
  if (kind === "azure.apimanagement") {
    return {
      publisherName: d.publisherName || "Contoso",
      publisherEmail: d.publisherEmail || "admin@contoso.com",
      sku: d.sku || "Developer",
    };
  }
  if (kind === "azure.keyvault") {
    return {
      tenantId: d.tenantId || undefined,
      vaultName: d.vaultName || undefined,
      physicalName: d.vaultName || undefined,
    };
  }
  if (kind === "azure.appinsights") {
    return {
      applicationType: d.applicationType || "web",
      ingestionMode: d.ingestionMode || "ApplicationInsights",
    };
  }
  if (kind === "azure.vnet") {
    return {
      addressSpaces: d.addressSpaces || ["10.0.0.0/16"],
      subnets: d.subnets || [{ name: "default", addressPrefix: "10.0.1.0/24" }],
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
  { items, updateItemPosition, onSelectedNodesChange, onCanvasNodesChange, currentPipelineId, onPipelineCreated, initialEdges, initialProvider, initialPipelineName }: CanvasProps,
  ref: React.Ref<{ getPlan: () => Plan; getPrompt: () => string; buildDeploymentPayload: (plan: Plan) => any; getProvider: () => Provider }>
) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const memoNodeTypes = React.useMemo(() => nodeTypes, []);

  /* ===== New: provider + palette state (UI only) ====================== */
  const [provider, setProvider] = useState<Provider>(initialProvider || "aws");
  
  // Update provider when initialProvider changes (e.g., when loading a pipeline)
  useEffect(() => {
    if (initialProvider) {
      setProvider(initialProvider);
    }
  }, [initialProvider]);
  
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

  // init from items - reset when items change (e.g., when loading a pipeline)
  const prevItemsRef = useRef<ServiceItem[]>([]);
  const edgesInitializedRef = useRef(false);
  useEffect(() => {
    // Check if items actually changed (by comparing IDs)
    const itemsChanged = 
      items.length !== prevItemsRef.current.length ||
      items.some((item, idx) => {
        const prev = prevItemsRef.current[idx];
        return !prev || item.id !== prev.id || item.x !== prev.x || item.y !== prev.y;
      });

    if (itemsChanged) {
      const initial: Node[] = items.map((item) => {
        // Extract service type from node ID (format: "serviceType-timestamp")
        // The node type should be the service ID (e.g., "s3", "lambda") for proper icon display
        const serviceType = item.id.split('-')[0];
        return {
          id: item.id,
          type: serviceType, // Use service type, not full ID
          position: { x: item.x ?? 0, y: item.y ?? 0 },
          data: { label: item.label, img: item.img, service: item },
        };
      });
      setNodes(initial);
      prevItemsRef.current = items;
      edgesInitializedRef.current = false; // Reset edges flag when items change
    }
  }, [items, setNodes]);

  // Restore edges from initialEdges when loading a pipeline
  useEffect(() => {
    if (initialEdges && initialEdges.length > 0 && !edgesInitializedRef.current) {
      const restoredEdges: Edge[] = initialEdges.map((e) => ({
        id: `${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
        type: "bezier",
        markerEnd: { type: MarkerType.ArrowClosed },
      }));
      setEdges(restoredEdges);
      edgesInitializedRef.current = true;
    }
  }, [initialEdges, setEdges]);

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

  // Create pipeline when canvas opens (if it's a new pipeline with a name)
  useEffect(() => {
    if (!currentPipelineId && initialPipelineName) {
      // Create pipeline immediately when canvas opens with a name
      ensurePipelineExists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-save pipeline periodically when nodes or edges change
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Only auto-save if pipeline exists or can be created
    if (currentPipelineId || initialPipelineName) {
      // Debounce auto-save: wait 3 seconds after last change
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSavePipeline();
      }, 3000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, provider, currentPipelineId, initialPipelineName]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const srcNode = nodes.find((n) => n.id === params.source);
      const tgtNode = nodes.find((n) => n.id === params.target);
      const srcType = String(srcNode?.type);
      const tgtType = String(tgtNode?.type);

      if (!isValidConnection(srcType, tgtType, provider)) {
        alert(`Invalid connection: ${srcNode?.data.label} cannot connect to ${tgtNode?.data.label}.\n\nRefer to Edge Connections Reference for valid connections.`);
        return;
      }

      setEdges((eds) => addEdge({ ...params, type: "bezier", markerEnd: { type: MarkerType.ArrowClosed } }, eds));
    },
    [setEdges, nodes, provider]
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
      
      setNodes((nds) => nds.concat(newNode));
      onSelectedNodesChange?.([{ id: newId, type: svc.id }]);
      
      // Fetch cost after node is added (fetchNodeCost will be available via closure)
      setTimeout(() => {
        // Use a type assertion to avoid dependency issue - fetchNodeCost is defined later but available via closure
        const fetchFn = (fetchNodeCost as any);
        if (typeof fetchFn === 'function') {
          fetchFn(newNode as any);
        }
      }, 100);
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

  /* ----------------- API helpers ----------------- */
  // Use the same base URL pattern as apiClient
  const API_BASE =
    typeof window === "undefined"
      ? process.env.API_BASE_URL || "http://127.0.0.1:8000"
      : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const AWS_API_BASE = `${API_BASE}/aws`;
  const GCP_API_BASE = `${API_BASE}/gcp`;
  const AZURE_API_BASE = `${API_BASE}/azure`;

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

  // Map node type to pricing API service name for all cloud providers
  const getPricingServiceName = (nodeType: string, cloudProvider: Provider): string | null => {
    const typeMap: Record<string, Record<Provider, string>> = {
      // AWS Services
      "lambda": { aws: "lambda", gcp: "cloud_functions", azure: "functions" },
      "ec2": { aws: "ec2", gcp: "compute_engine", azure: "vm" },
      "s3": { aws: "s3", gcp: "cloud_storage", azure: "blob_storage" },
      "dynamodb": { aws: "dynamodb", gcp: "firestore", azure: "cosmosdb" },
      "rds": { aws: "rds", gcp: "cloud_sql", azure: "sql" },
      "sqs": { aws: "sqs", gcp: "pubsub", azure: "servicebus" },
      "sns": { aws: "sns", gcp: "pubsub", azure: "servicebus" },
      "apigateway": { aws: "apigw", gcp: "api_gateway", azure: "apimanagement" },
      "kinesis": { aws: "kinesis", gcp: "pubsub", azure: "servicebus" },
      "sfn": { aws: "sfn", gcp: "workflows", azure: "logic_apps" },
      "events_rule": { aws: "events", gcp: "cloud_scheduler", azure: "eventgrid" },
      "cloudfront": { aws: "cloudfront", gcp: "cloud_cdn", azure: "cdn" },
      "ecs": { aws: "ecs", gcp: "cloud_run", azure: "containerapp" },
      "ecr": { aws: "ecr", gcp: "artifact_registry", azure: "container_registry" },
      "secretsmanager": { aws: "secretsmanager", gcp: "secret_manager", azure: "keyvault" },
      "cognito": { aws: "cognito", gcp: "identity_platform", azure: "active_directory" },
      "vpc": { aws: "vpc", gcp: "vpc", azure: "vnet" },
      "cloudwatch": { aws: "cloudwatch", gcp: "monitoring", azure: "appinsights" },
      "elasticache": { aws: "elasticache", gcp: "memorystore", azure: "redis_cache" },
      
      // GCP Services
      "gcp-storage": { aws: "s3", gcp: "cloud_storage", azure: "blob_storage" },
      "pubsub": { aws: "sns", gcp: "pubsub", azure: "servicebus" },
      "cloud-run": { aws: "ecs", gcp: "cloud_run", azure: "containerapp" },
      "secret-manager": { aws: "secretsmanager", gcp: "secret_manager", azure: "keyvault" },
      "firestore": { aws: "dynamodb", gcp: "firestore", azure: "cosmosdb" },
      
      // Azure Services
      "azure.storage": { aws: "s3", gcp: "cloud_storage", azure: "blob_storage" },
      "azure.servicebus": { aws: "sqs", gcp: "pubsub", azure: "servicebus" },
      "azure.containerapp": { aws: "ecs", gcp: "cloud_run", azure: "containerapp" },
      "azure.vm": { aws: "ec2", gcp: "compute_engine", azure: "vm" },
      "azure.functionapp": { aws: "lambda", gcp: "cloud_functions", azure: "functions" },
      "azure.sql": { aws: "rds", gcp: "cloud_sql", azure: "sql" },
      "azure.cosmosdb": { aws: "dynamodb", gcp: "firestore", azure: "cosmosdb" },
      "azure.apimanagement": { aws: "apigw", gcp: "api_gateway", azure: "apimanagement" },
      "azure.keyvault": { aws: "secretsmanager", gcp: "secret_manager", azure: "keyvault" },
      "azure.appinsights": { aws: "cloudwatch", gcp: "monitoring", azure: "appinsights" },
      "azure.vnet": { aws: "vpc", gcp: "vpc", azure: "vnet" },
    };

    const mapping = typeMap[nodeType];
    if (!mapping) return null;
    return mapping[cloudProvider] || null;
  };

  // Transform service config to pricing API format
  const transformConfigForPricing = (kind: string, config: any, cloudProvider: Provider): Record<string, any> => {
    const details = config?.details || {};
    const normalized = normalizeToDesiredProps(kind, details);
    const pricingConfig: Record<string, any> = {};

    // AWS Lambda / GCP Cloud Functions / Azure Functions
    if (kind === "aws.lambda" || kind === "gcp.run" || kind === "azure.functionapp") {
      if (normalized.memory) pricingConfig.memory = normalized.memory;
      if (normalized.timeout) pricingConfig.timeout = normalized.timeout;
      // Add invocations if available (default to 100K for estimate)
      pricingConfig.invocations = details.invocations || details.estimated_invocations || 100000;
      // Add estimated_duration if available (defaults to timeout/2)
      pricingConfig.estimated_duration = details.estimated_duration || (normalized.timeout ? normalized.timeout / 2 : 1.5);
    }

    // AWS EC2 / GCP Compute Engine / Azure VM
    if (kind === "aws.ec2" || kind === "gcp.run" || kind === "azure.vm") {
      if (normalized.instanceType) pricingConfig.instance_type = normalized.instanceType;
      if (normalized.vmSize) pricingConfig.size = normalized.vmSize;
      pricingConfig.hours = details.hours || 730; // Default to monthly hours
    }

    // AWS S3 / GCP Cloud Storage / Azure Blob Storage
    if (kind === "aws.s3" || kind === "gcp.storage" || kind === "azure.storage") {
      pricingConfig.storage_gb = details.storage_gb || details.storage || 1;
      if (details.requests) pricingConfig.requests = details.requests;
    }

    // AWS DynamoDB
    if (kind === "aws.dynamodb") {
      if (normalized.billing === "PROVISIONED") {
        pricingConfig.billing = "PROVISIONED";
        pricingConfig.rcu = details.rcu || details.read_capacity_units || 10;
        pricingConfig.wcu = details.wcu || details.write_capacity_units || 10;
      } else {
        pricingConfig.billing = "PAY_PER_REQUEST";
      }
    }

    // AWS RDS / Azure SQL
    if (kind === "aws.rds" || kind === "azure.sql") {
      if (normalized.instanceClass) pricingConfig.instance_class = normalized.instanceClass;
      if (normalized.dbClass) pricingConfig.instance_class = normalized.dbClass;
      if (normalized.allocatedStorage) pricingConfig.allocated_storage = normalized.allocatedStorage;
      if (normalized.serviceTier) pricingConfig.service_tier = normalized.serviceTier;
      pricingConfig.hours = details.hours || 730;
    }

    // AWS SQS / SNS
    if (kind === "aws.sqs" || kind === "aws.sns") {
      pricingConfig.requests = details.requests || details.message_count || 1000000;
    }

    // AWS API Gateway
    if (kind === "aws.apigw") {
      pricingConfig.requests = details.requests || details.api_calls || 1000000;
    }

    // AWS Kinesis
    if (kind === "aws.kinesis") {
      pricingConfig.shards = normalized.shards || details.shards || 1;
      pricingConfig.hours = details.hours || 730;
    }

    // AWS Step Functions
    if (kind === "aws.sfn") {
      pricingConfig.transitions = details.transitions || details.state_transitions || 1000;
    }

    // GCP Cloud Run
    if (kind === "gcp.run") {
      if (normalized.memory) {
        // Convert "512Mi" to MB
        const memoryStr = String(normalized.memory);
        const memoryMB = memoryStr.includes("Mi") 
          ? parseInt(memoryStr.replace("Mi", ""))
          : memoryStr.includes("Gi")
          ? parseInt(memoryStr.replace("Gi", "")) * 1024
          : parseInt(memoryStr) || 512;
        pricingConfig.memory = memoryMB;
      }
      if (normalized.cpu) {
        // Convert "1000m" to number
        const cpuStr = String(normalized.cpu);
        pricingConfig.cpu = cpuStr.includes("m") 
          ? parseFloat(cpuStr.replace("m", "")) / 1000
          : parseFloat(cpuStr) || 1;
      }
      pricingConfig.invocations = details.invocations || 100000;
      pricingConfig.estimated_duration = details.estimated_duration || 1.5;
    }

    // Azure Functions
    if (kind === "azure.functionapp") {
      pricingConfig.memory = details.memory || 128;
      pricingConfig.timeout = details.timeout || 30;
      pricingConfig.executions = details.executions || details.invocations || 100000;
      pricingConfig.estimated_duration = details.estimated_duration || 1.5;
    }

    return pricingConfig;
  };

  // Fetch cost for a single node (supports all cloud providers)
  const fetchNodeCost = useCallback(async (node: Node) => {
    try {
      const svc = (node.data as any).service;
      if (!svc) return;

      // Get the pricing API service name for the current provider
      const serviceName = getPricingServiceName(String(node.type), provider);
      if (!serviceName) {
        console.warn(`No pricing mapping for service type: ${node.type} on provider: ${provider}`);
        return;
      }

      // Get the kind for config transformation
      const kind = KIND_MAP[node.type as ExtendedPlanNodeType] || 
        (provider === "gcp" ? "gcp.other" : provider === "azure" ? "azure.other" : "aws.other");

      // Transform config to pricing API format
      const pricingConfig = transformConfigForPricing(kind, svc.config || {}, provider);

      // Get region from config or use default
      const region = svc.config?.region || 
        (provider === "gcp" ? "us-central1" : provider === "azure" ? "eastus" : "us-east-1");

      const res = await fetch(`${API_BASE}/cost-optimization/price`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({
          service: serviceName,
          cloud: provider,
          region: region,
          config: pricingConfig
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.price !== undefined) {
          setNodes(nds => nds.map(n => 
            n.id === node.id 
              ? { 
                  ...n, 
                  data: { 
                    ...n.data, 
                    cost: data.price,
                    costIsEstimated: data.isEstimated || false
                  } 
                } 
              : n
          ));
        }
      } else {
        console.error(`Failed to fetch cost for ${serviceName}:`, await res.text());
      }
    } catch (e) {
      console.error("Failed to fetch cost", e);
    }
  }, [provider, API_BASE]);

  // Refetch costs when provider changes
  useEffect(() => {
    nodes.forEach((node) => {
      if (node.data?.service) {
        fetchNodeCost(node);
      }
    });
  }, [provider, fetchNodeCost]); // Only refetch when provider changes, not on every node change

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
      // Use user-entered name from config panel if available, otherwise use sanitized name
      const userEnteredName = svc?.config?.name?.trim?.();
      // For specific services, prefer the service-specific name field (bucketName, queueName, etc.)
      let preferredName = userEnteredName;
      if (type === "s3" && details.bucketName) preferredName = details.bucketName;
      else if (type === "sqs" && details.queueName) preferredName = details.queueName;
      else if (type === "sns" && details.topicName) preferredName = details.topicName;
      else if (type === "lambda" && details.lambda_name) preferredName = details.lambda_name;
      else if (type === "dynamodb" && details.tableName) preferredName = details.tableName;
      else if (type === "kinesis" && details.streamName) preferredName = details.streamName;
      else if (type === "pubsub" && details.topicName) preferredName = details.topicName;
      else if (type === "azure.servicebus" && details.queueName) preferredName = details.queueName;
      
      const name = preferredName ? sanitizeName(preferredName) : sanitizeName(svc?.label || n.id);
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
  type DeployNode = { id: string; kind: string; name: string; props: Record<string, any>; position?: { x: number; y: number } };
  type DeployEdge = { from: string; to: string; intent: "notify" | "consume" | "invoke" | "read" | "write" | "deliver" | "access"; path?: string; method?: string; batchSize?: number };
  type DeployPayload = {
    project: string;
    env: string;
    region: string;
    nodes: DeployNode[];
    edges: DeployEdge[];
  };

  const buildDeploymentPayload = useCallback((plan: Plan): DeployPayload & { location?: string } => {
    const project = "canvas-project";
    const env = "dev";
    
    // Extract region from node props if available, otherwise use plan.awsRegion or defaults
    let region = plan.awsRegion;
    
    // Check all nodes for region (user may have set it in any service config)
    if (plan.nodes && plan.nodes.length > 0) {
      for (const node of plan.nodes) {
        const nodeRegion = node?.props?.region;
        if (nodeRegion && nodeRegion.trim()) {
          region = nodeRegion.trim();
          break; // Use first found region
        }
      }
    }
    
    // Use appropriate default region based on provider if still not set
    if (!region) {
      region = provider === "gcp" ? "us-central1" : provider === "azure" ? "southeastasia" : "ap-southeast-2";
    }
    
    // Debug: log the region being used
    console.log("Deployment region:", region, "Provider:", provider);

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

    // Create a map of node positions from React Flow nodes
    const nodePositions = new Map<string, { x: number; y: number }>();
    nodes.forEach((n) => {
      nodePositions.set(n.id, { x: n.position.x, y: n.position.y });
    });

    // quick lookups to compute props that depend on connectivity
    const outgoingById = new Map<string, number>();
    plan.edges.forEach((e) => outgoingById.set(e.from, (outgoingById.get(e.from) || 0) + 1));

    const deployNodes: DeployNode[] = plan.nodes.map((pn) => {
      const kind = KIND_MAP[pn.type] || (provider === "gcp" ? "gcp.other" : provider === "azure" ? "azure.other" : "aws.other");
      const raw = pn.props || {};

      // normalize props to the exact keys you requested for backend
      const normalizedProps = normalizeToDesiredProps(kind, raw);

      // S3: turn on eventBridge if it has any outgoing links
      if (kind === "aws.s3") {
        const hasOutgoing = (outgoingById.get(pn.id) || 0) > 0;
        if (normalizedProps.eventBridge === undefined) normalizedProps.eventBridge = hasOutgoing ? true : false;
      }

      // Get position from React Flow nodes
      const position = nodePositions.get(pn.id) || { x: 0, y: 0 };

      // Preserve ALL original props for restoration (including bucketName, queueName, etc.)
      // Merge normalized props with original raw props to ensure we have everything
      // User-entered values from config panel are preserved in raw, and mapped to physicalName in normalizedProps
      const props = {
        ...raw, // Keep all original details (bucketName, queueName, etc.) from config panel
        ...normalizedProps, // Override with normalized versions where applicable (includes physicalName mappings)
      };

      return {
        id: pn.id, // keep your RF node id (e.g., "s3-172705...")
        kind,
        name: pn.name, // sanitized name (e.g., "images-bucket")
        props,
        position, // Include position (x, y) for canvas restoration
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

    payload.nodes = deployNodes;
    payload.edges = edges;

    return payload;
  }, [nodes, provider]);

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

  // Check if user has Azure credentials configured
  const checkAzureCredentials = async (): Promise<boolean> => {
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
      return data?.has_azure_credentials === true;
    } catch (error) {
      console.error("Error checking Azure credentials:", error);
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
        name: initialPipelineName || "Untitled Pipeline",
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

  /* ----------------- Auto-save Pipeline ----------------- */
  const autoSavePipeline = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        return; // Silently fail if no auth
      }

      // Ensure pipeline exists first
      const pipelineId = currentPipelineId || await ensurePipelineExists();
      if (!pipelineId) {
        return; // Silently fail if can't create/get pipeline
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

      // Update pipeline with latest payload
      const res = await fetch(`${API_BASE}/pipelines/${pipelineId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          payload: payload,
          env: env as "dev" | "staging" | "prod",
          cloud: cloud as "aws" | "gcp" | "azure",
          region: region,
        }),
      });

      if (res.ok) {
        console.log("Pipeline auto-saved");
      } else {
        console.error("Failed to auto-save pipeline:", await res.text());
      }
    } catch (error) {
      console.error("Error auto-saving pipeline:", error);
      // Silently fail - auto-save is not critical
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
    const deploymentStartTime = Date.now(); // Track deployment start time
    let pipelineId: string | null = null;
    
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("Authentication required. Please log in first.");
      }

      // Check if credentials are configured (for GCP and Azure)
      if (provider === "gcp") {
        const hasCreds = await checkGcpCredentials();
        if (!hasCreds) {
          setShowCredsModal(true);
          return;
        }
      } else if (provider === "azure") {
        const hasCreds = await checkAzureCredentials();
        if (!hasCreds) {
          setShowCredsModal(true);
          return;
        }
      }

      setDeploying(true);

      // Update pipeline status to "deploying" and record start time
      pipelineId = currentPipelineId || await ensurePipelineExists();
      if (pipelineId) {
        const API_BASE =
          typeof window === "undefined"
            ? process.env.API_BASE_URL || "http://127.0.0.1:8000"
            : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
        
        await fetch(`${API_BASE}/pipelines/${pipelineId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            status: "deploying",
            deployment_started_at: new Date().toISOString()
          }),
        });
      }

      const plan = buildPlan();
      const payload = buildDeploymentPayload(plan);

      // Use appropriate API endpoint based on provider
      const apiBase = provider === "gcp" ? GCP_API_BASE : provider === "azure" ? AZURE_API_BASE : AWS_API_BASE;
      const endpoint = provider === "gcp" ? "/up" : provider === "azure" ? "/deploy" : "/deploy";

      // For GCP and Azure, wrap payload in {ir: {...}} format
      // For AWS, send IR directly (payload is already in IR format)
      const requestBody = (provider === "gcp" || provider === "azure") ? { ir: payload } : payload;

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

      // Calculate deployment duration
      const deploymentEndTime = Date.now();
      const durationSec = (deploymentEndTime - deploymentStartTime) / 1000;

      if (!res.ok) {
        // Handle errors - backend returns {detail: {message: "...", output: "...", step: "...", hint: "..."}}
        const detail = data?.detail;
        let msg: string;
        if (typeof detail === "string") {
          msg = detail;
        } else if (detail?.message) {
          msg = detail.message;
          if (detail?.output) {
            msg += `\n\nOutput:\n${detail.output}`;
          }
          if (detail?.hint) {
            msg += `\n\nHint: ${detail.hint}`;
          }
          if (detail?.step) {
            msg += `\n\nStep: ${detail.step}`;
          }
        } else {
          msg = data?.error || text || `Deploy failed (${res.status})`;
        }
        throw new Error(msg);
      }

      // Success response: {message: "deploy ok", output: "..."}
      console.log("Deploy ok:", data);

      // Update pipeline status to "deployed" and save duration
      if (pipelineId) {
        const API_BASE =
          typeof window === "undefined"
            ? process.env.API_BASE_URL || "http://127.0.0.1:8000"
            : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
        
        await fetch(`${API_BASE}/pipelines/${pipelineId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            status: "deployed",
            deployment_duration_sec: durationSec
          }),
        });
      }

      setSuccessModal({
        isOpen: true,
        title: "Deployed Successfully! 🎉",
        message: "Your infrastructure has been deployed to the cloud.",
        details: data?.output || undefined,
      });
    } catch (e: any) {
      console.error("Deployment error:", e?.message || e);

      // Calculate duration even on failure
      const deploymentEndTime = Date.now();
      const durationSec = (deploymentEndTime - deploymentStartTime) / 1000;

      // Update pipeline status to "failed" and save duration
      if (pipelineId) {
        const token = getAccessToken();
        if (token) {
          const API_BASE =
            typeof window === "undefined"
              ? process.env.API_BASE_URL || "http://127.0.0.1:8000"
              : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
          
          await fetch(`${API_BASE}/pipelines/${pipelineId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ 
              status: "failed",
              deployment_duration_sec: durationSec
            }),
          });
        }
      }

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

  /* ----------------- Destroy via /destroy (requires auth for GCP and Azure) ----------------- */
  const handleDestroy = async () => {
    try {
      const token = getAccessToken();
      if (!token && (provider === "gcp" || provider === "azure")) {
        throw new Error("Authentication required. Please log in first.");
      }

      // Check if credentials are configured (for GCP and Azure)
      if (provider === "gcp") {
        const hasCreds = await checkGcpCredentials();
        if (!hasCreds) {
          setShowCredsModal(true);
          return;
        }
      } else if (provider === "azure") {
        const hasCreds = await checkAzureCredentials();
        if (!hasCreds) {
          setShowCredsModal(true);
          return;
        }
      }

      setDestroying(true);

      // For GCP and Azure, destroy needs IR with project and env
      let body: any = {};
      if (provider === "gcp" || provider === "azure") {
        const plan = buildPlan();
        const payload = buildDeploymentPayload(plan);
        body = { project: payload.project, env: payload.env }; // Send project and env for destroy
      }

      // Use appropriate API endpoint based on provider
      const apiBase = provider === "gcp" ? GCP_API_BASE : provider === "azure" ? AZURE_API_BASE : AWS_API_BASE;
      const includeAuth = provider === "gcp" || provider === "azure"; // GCP and Azure destroy require auth

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

  /* ----------------- Preview via /preview (requires auth for GCP and Azure) ----------------- */
  const handlePreview = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("Authentication required. Please log in first.");
      }

      // Check if credentials are configured (for GCP and Azure)
      if (provider === "gcp") {
        const hasCreds = await checkGcpCredentials();
        if (!hasCreds) {
          setShowCredsModal(true);
          return;
        }
      } else if (provider === "azure") {
        const hasCreds = await checkAzureCredentials();
        if (!hasCreds) {
          setShowCredsModal(true);
          return;
        }
      }

      setPreviewing(true);

      const plan = buildPlan();
      const payload = buildDeploymentPayload(plan);

      // Use appropriate API endpoint based on provider
      const apiBase = provider === "gcp" ? GCP_API_BASE : provider === "azure" ? AZURE_API_BASE : AWS_API_BASE;
      
      // Preview endpoint accepts {ir, creds} format
      // Backend will get credentials from user table if not provided
      const res = await fetch(`${apiBase}/preview`, {
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

                // For GCP and Azure, wrap in {ir: {...}} format for console output
                if (provider === "gcp") {
                  const wrappedPayload = { ir: payload };
                  console.log("=== /gcp/up payload ===\n", JSON.stringify(wrappedPayload, null, 2));
                } else if (provider === "azure") {
                  const wrappedPayload = { ir: payload };
                  console.log("=== /azure/deploy payload ===\n", JSON.stringify(wrappedPayload, null, 2));
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

            {/* Azure-specific buttons */}
            {provider === "azure" && (
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
                    "bg-sky-600 text-white hover:bg-sky-700",
                    "focus:outline-none focus:ring-4 focus:ring-sky-200/70",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "shadow-sm transition-all",
                  ].join(" ")}
                  title="Deploy to Azure"
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
                  title="Destroy Azure resources"
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
