// awsOptions.ts

// ---- Lambda ----
export const AWS_LAMBDA_RUNTIMES = [
  // Popular/active ones; you can expand as needed
  "nodejs20.x",
  "nodejs18.x",
  "python3.12",
  "python3.11",
  "java21",
  "dotnet8",
  "go1.x",
] as const;

export const AWS_LAMBDA_ARCH = ["x86_64", "arm64"] as const;

// 128–10240 MB in 64‑MB steps
export const AWS_LAMBDA_MEMORY_SIZES = Array.from({ length: (10240 - 128) / 64 + 1 }, (_, i) => 128 + i * 64);

// 1–900 sec
export const AWS_LAMBDA_TIMEOUTS = Array.from({ length: 900 }, (_, i) => i + 1);

// ---- S3 ----
export const AWS_ENCRYPTION_OPTIONS = [
  { value: "None", label: "None" },
  { value: "SSE-S3", label: "SSE-S3 (AES-256)" },
  { value: "SSE-KMS", label: "SSE-KMS" },
];

export const AWS_REGIONS = [
  // Common set (you can expand to full list)
  "us-east-1","us-east-2","us-west-1","us-west-2",
  "ca-central-1",
  "eu-west-1","eu-west-2","eu-west-3","eu-central-1","eu-north-1","eu-south-1",
  "ap-south-1","ap-south-2","ap-southeast-1","ap-southeast-2","ap-southeast-3",
  "ap-northeast-1","ap-northeast-2","ap-northeast-3",
  "me-south-1",
  "sa-east-1"
];

// ---- SQS ----
export const SQS_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "fifo", label: "FIFO" },
];

export const SQS_VISIBILITY_TIMEOUTS = Array.from({ length: 43201 }, (_, i) => i); // 0–43200 sec
export const SQS_RETENTION_HOURS = Array.from({ length: 336 }, (_, i) => i + 1); // 1–336 hours

// ---- SNS ----
export const SNS_FIFO_OPTIONS = [
  { value: "false", label: "Standard Topic" },
  { value: "true", label: "FIFO Topic" },
];

// ---- Kinesis ----
export const KINESIS_ENCRYPTION = [
  { value: "NONE", label: "None" },
  { value: "KMS", label: "KMS" },
];

// ---- DynamoDB ----
export const DDB_BILLING_MODES = [
  { value: "PAY_PER_REQUEST", label: "On-Demand (PAY_PER_REQUEST)" },
  { value: "PROVISIONED", label: "Provisioned" },
];

export const DDB_STREAM_VIEW_TYPES = [
  { value: "NEW_IMAGE", label: "NEW_IMAGE" },
  { value: "OLD_IMAGE", label: "OLD_IMAGE" },
  { value: "NEW_AND_OLD_IMAGES", label: "NEW_AND_OLD_IMAGES" },
  { value: "KEYS_ONLY", label: "KEYS_ONLY" },
];

export const DDB_KEY_TYPES = [
  { value: "S", label: "String (S)" },
  { value: "N", label: "Number (N)" },
  { value: "B", label: "Binary (B)" },
];

// ---- RDS ----
export const RDS_ENGINES = [
  { value: "postgres", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mariadb", label: "MariaDB" },
  { value: "aurora-postgresql", label: "Aurora PostgreSQL" },
  { value: "aurora-mysql", label: "Aurora MySQL" },
];

// A few common instance classes (add more as needed)
export const RDS_INSTANCE_CLASSES = [
  "db.t4g.micro","db.t4g.small","db.t4g.medium",
  "db.t3.micro","db.t3.small","db.t3.medium",
  "db.m6g.large","db.m6g.xlarge",
  "db.r6g.large","db.r6g.xlarge",
];


// -------- Helpers --------
export const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export const snapToClosest = (val: number, list: number[]) =>
  list.reduce((prev, curr) => (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev));
