"use client";

import { useState, useEffect, ChangeEvent, useMemo } from "react";
import { X, Save, Trash2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import type { ServiceItem } from "./types";
import {
  AWS_LAMBDA_RUNTIMES,
  AWS_LAMBDA_ARCH,
  AWS_LAMBDA_MEMORY_SIZES,
  AWS_LAMBDA_TIMEOUTS,
} from "./awsOptions";

/** Base config with optional `details` for per-service settings */
type ServiceConfig = {
  name: string;
  description: string;
  environment: "development" | "staging" | "production";
  region: string;
  details?: any;
};

type ServiceWithConfig = ServiceItem & { config?: ServiceConfig };

interface ServiceConfigPanelProps {
  service: ServiceWithConfig;
  isOpen: boolean;
  onUpdate: (service: ServiceWithConfig) => void;
  onClose: () => void;
  onDelete: (serviceId: string) => void;
}

/* ---------------- utils ---------------- */

const getServiceKey = (svc: { id?: string; label?: string }) => {
  const raw = (svc.id || svc.label || "").toString().toLowerCase();
  const base = raw.split("-")[0].split("_")[0].split(":")[0].replace(/\s+/g, "");
  if (base.startsWith("aws")) return base.slice(3);
  if (base.startsWith("gcp")) return base.slice(3);
  // Handle GCP service IDs
  if (base === "gcp-storage" || base === "storage") return "gcpstorage";
  if (base === "pubsub") return "gcppubsub";
  if (base === "cloud-run" || base === "cloudrun") return "gcpcloudrun";
  if (base === "secret-manager" || base === "secretmanager") return "gcpsecretmanager";
  if (base === "firestore") return "gcpfirestore";
  return base;
};

const defaultDetailsFor = (service: { id?: string; label?: string }) => {
  switch (getServiceKey(service)) {
    case "lambda":
      return {
        lambda_name: "",
        runtime: "python3.11",
        architecture: "x86_64",
        memoryMB: 128,
        timeoutSec: 3,
        handler: "index.handler",
        roleArn: "",
        env: [{ key: "", value: "" }],
        vpcSubnetIds: "",
        vpcSecurityGroupIds: "",
      };
    case "s3":
      return {
        bucketName: "",
        region: "",
        versioning: false,
        encryption: "SSE-S3",
        publicAccessBlock: true,
      };
    case "sqs":
      return {
        queueName: "",
        type: "standard",
        contentBasedDeduplication: false,
        visibilityTimeoutSec: 30,
        retentionPeriodHours: 96,
        deadLetterTargetArn: "",
        maxReceiveCount: 5,
      };
    case "sns":
      return { topicName: "", displayName: "", fifo: false, contentBasedDeduplication: false };
    case "kinesis":
      return { streamName: "", shardCount: 1, retentionHours: 24, encryptionType: "NONE", kmsKeyId: "" };
    case "dynamodb":
      return {
        tableName: "",
        partitionKey: { name: "id", type: "S" },
        sortKey: { name: "", type: "S" },
        billingMode: "PAY_PER_REQUEST",
        readCapacity: 1,
        writeCapacity: 1,
        streamEnabled: false,
        streamViewType: "NEW_AND_OLD_IMAGES",
      };
    case "rds":
      return {
        engine: "postgres",
        engineVersion: "",
        instanceClass: "db.t3.micro",
        storageGB: 20,
        multiAZ: false,
        username: "",
        password: "",
        dbName: "",
        publiclyAccessible: false,
      };
    // GCP Services
    case "gcpstorage":
    case "gcp-storage":
      return {
        bucketName: "",
        uniformAccess: true,
        forceDestroy: false,
        labels: {},
      };
    case "gcppubsub":
    case "pubsub":
      return {
        topicName: "",
        labels: {},
      };
    case "gcpcloudrun":
    case "cloud-run":
    case "cloudrun":
      return {
        image: "gcr.io/cloudrun/hello",
        env: {},
        allowUnauthenticated: true,
        cpu: "1000m",
        memory: "512Mi",
        minInstances: 0,
        maxInstances: 10,
        concurrency: 80,
      };
    case "gcpsecretmanager":
    case "secret-manager":
    case "secretmanager":
      return {
        secretValue: "",
        labels: {},
      };
    case "gcpfirestore":
    case "firestore":
      return {
        locationId: "us-central",
        databaseId: "(default)",
      };
    default:
      return {};
  }
};

/** Validation */
type Errors = Record<string, string>;

const S3_BUCKET_RE =
  /^(?!\d+\.)(?!-)(?!.*--)(?!.*\.$)(?!.*\.-)[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

function validate(serviceLabel: string, cfg: ServiceConfig): Errors {
  const e: Errors = {};
  const d = cfg.details || {};
  if (serviceLabel === "AWS Lambda") {
    if (!d.runtime?.trim()) e.runtime = "Runtime is required";
    if (!d.handler?.trim()) e.handler = "Handler is required";
  }
  if (serviceLabel === "AWS S3") {
    if (!d.bucketName?.trim()) e.bucketName = "Bucket name is required";
    else if (!S3_BUCKET_RE.test(d.bucketName.trim()))
      e.bucketName = "3–63 chars, lowercase letters, numbers, dots, hyphens";
    const region = d.region?.trim() || cfg.region?.trim();
    if (!region) e.s3Region = "Region is required";
  }
  // GCP Service Validations
  if (serviceLabel === "GCP Storage") {
    if (!d.bucketName?.trim()) e.bucketName = "Bucket name is required";
    else if (d.bucketName.length < 3 || d.bucketName.length > 63)
      e.bucketName = "Bucket name must be 3-63 characters";
  }
  if (serviceLabel === "Pub/Sub") {
    if (!d.topicName?.trim()) e.topicName = "Topic name is required";
  }
  if (serviceLabel === "Cloud Run") {
    if (!d.image?.trim()) e.image = "Container image is required";
  }
  if (serviceLabel === "GCP Secret Manager") {
    // Secret value is optional, but name should be validated if provided
  }
  if (serviceLabel === "GCP Firestore") {
    if (!d.locationId?.trim()) e.locationId = "Location ID is required";
  }
  return e;
}

/* --------------- tiny UI primitives (brand-forward) --------------- */

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[12.5px] font-semibold tracking-wide text-slate-700 mb-1.5">
    {children}
  </label>
);

type BaseInputProps = {
  value: any;
  onChange: (e: any) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  id?: string;
};

const baseInputClass = (error?: string) =>
  [
    "w-full px-3.5 py-2.5 rounded-2xl",
    "bg-white/90 text-black placeholder-slate-400",
    "shadow-sm ring-1",
    error ? "ring-red-400 focus:ring-red-500" : "ring-slate-200 focus:ring-orange-500",
    "outline-none transition",
  ].join(" ");

const TextInput = ({ value, onChange, placeholder, type = "text", error, id }: BaseInputProps) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={baseInputClass(error)}
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : undefined}
  />
);

const SelectInput = ({
  value,
  onChange,
  options,
  error,
  id,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  error?: string;
  id?: string;
}) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    className={baseInputClass(error)}
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : undefined}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value} className="text-black">
        {o.label}
      </option>
    ))}
  </select>
);

const NumberInput = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  error,
  id,
}: BaseInputProps & { min?: number; max?: number; step?: number }) => (
  <input
    id={id}
    type="number"
    value={value}
    onChange={onChange}
    min={min}
    max={max}
    step={step}
    className={baseInputClass(error)}
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : undefined}
  />
);

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? <p id={id} className="mt-1 text-xs text-red-600">{message}</p> : null;

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full bg-orange-50 text-orange-700 text-[11px] px-2.5 py-1 ring-1 ring-orange-200">
    {children}
  </span>
);

const SectionCard = ({ children, title, icon }: { children: React.ReactNode; title: string; icon?: React.ReactNode }) => (
  <div className="relative rounded-3xl border border-slate-100/90 bg-white/70 backdrop-blur-sm shadow-md p-5">
    <div className="mb-4 flex items-center gap-2">
      {icon}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

const Checkbox = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label: string;
}) => (
  <label className="inline-flex items-center gap-2 select-none">
    <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-slate-300 accent-orange-600" />
    <span className="text-sm text-slate-700">{label}</span>
  </label>
);

/* ---------------- component ---------------- */

export default function ServiceConfigPanel({
  service,
  isOpen,
  onUpdate,
  onClose,
  onDelete,
}: ServiceConfigPanelProps) {
  const baseDefault: ServiceConfig = {
    name: service.label ?? "",
    description: "",
    environment: "development",
    region: "",
  };

  const seeded = service.config ?? { ...baseDefault, details: defaultDetailsFor(service) };
  const [config, setConfig] = useState<ServiceConfig>(seeded);
  const [errors, setErrors] = useState<Errors>({});

  // re-seed on service change
  useEffect(() => {
    const nextBase = service.config ?? { ...baseDefault, name: service.label ?? "" };
    const next = service.config?.details ? service.config : { ...nextBase, details: defaultDetailsFor(service) };

    if (service.label === "AWS Lambda") {
    const dd = next.details || {};
    next.details = {
      ...dd,
      runtime: dd.runtime || AWS_LAMBDA_RUNTIMES[0],
      handler: dd.handler || "index.handler",
    };
  }
  
    setConfig(next);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const d = config.details || {};
  const brandTitle = service.label + " Configuration";

  const updateDetails = (patch: Record<string, any>) =>
    setConfig((c) => ({ ...c, details: { ...(c.details || {}), ...patch } }));

  const currentErrors = useMemo(() => validate(service.label || "", config), [service.label, config]);
  const isValid = Object.keys(currentErrors).length === 0;

  const handleSave = () => {
    const e = validate(service.label || "", config);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onUpdate({ ...service, config });
    onClose();
  };

  /* service-specific fields */
  const renderServiceFields = () => {
    switch (service.label) {
      case "AWS Lambda":
        return (
          <SectionCard
            title="Lambda Settings"
            icon={<img src="/aws-icons/lambda.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>Lambda Name</Label>
                <TextInput
                  id="lambda_name"
                  value={d.lambda_name || ""}
                  onChange={(e) => updateDetails({ lambda_name: e.target.value })}
                  placeholder="MyLambdaFunction"
                />
              </div>
              <div>
                <Label>Runtime</Label>
                <SelectInput
                  id="runtime"
                  value={d.runtime || AWS_LAMBDA_RUNTIMES[0]}
                  onChange={(e) => updateDetails({ runtime: e.target.value })}
                  options={AWS_LAMBDA_RUNTIMES.map((r) => ({ value: r, label: r }))}
                  error={errors.runtime}
                />
                <FieldError id="runtime-error" message={errors.runtime} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Architecture</Label>
                  <SelectInput
                    id="architecture"
                    value={d.architecture || AWS_LAMBDA_ARCH[0]}
                    onChange={(e) => updateDetails({ architecture: e.target.value })}
                    options={AWS_LAMBDA_ARCH.map((a) => ({ value: a, label: a }))}
                  />
                </div>
                <div>
                  <Label>Memory (MB)</Label>
                  <SelectInput
                    id="memory"
                    value={String(d.memoryMB ?? AWS_LAMBDA_MEMORY_SIZES[0])}
                    onChange={(e) => updateDetails({ memoryMB: Number(e.target.value) })}
                    options={AWS_LAMBDA_MEMORY_SIZES.map((m) => ({ value: String(m), label: String(m) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Timeout (seconds)</Label>
                  <SelectInput
                    id="timeout"
                    value={String(d.timeoutSec ?? 3)}
                    onChange={(e) => updateDetails({ timeoutSec: Number(e.target.value) })}
                    options={AWS_LAMBDA_TIMEOUTS.map((t) => ({ value: String(t), label: String(t) }))}
                  />
                </div>
                <div>
                  <Label>Handler</Label>
                  <TextInput
                    id="handler"
                    value={d.handler || "index.handler"}
                    onChange={(e) => updateDetails({ handler: e.target.value })}
                    placeholder="index.handler"
                    error={errors.handler}
                  />
                  <FieldError id="handler-error" message={errors.handler} />
                </div>
              </div>

              {/* <div>
                <Label>Execution Role ARN</Label>
                <TextInput
                  id="roleArn"
                  value={d.roleArn || ""}
                  onChange={(e) => updateDetails({ roleArn: e.target.value })}
                  placeholder="arn:aws:iam::123456789012:role/MyLambdaRole"
                />
              </div> */}

              {/* <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>VPC Subnet IDs</Label>
                  <TextInput
                    id="subnets"
                    value={d.vpcSubnetIds || ""}
                    onChange={(e) => updateDetails({ vpcSubnetIds: e.target.value })}
                    placeholder="subnet-123, subnet-abc"
                  />
                </div>
                <div>
                  <Label>VPC Security Group IDs</Label>
                  <TextInput
                    id="sgs"
                    value={d.vpcSecurityGroupIds || ""}
                    onChange={(e) => updateDetails({ vpcSecurityGroupIds: e.target.value })}
                    placeholder="sg-123, sg-abc"
                  />
                </div>
              </div> */}

              <div className="rounded-2xl bg-slate-50/60 border border-slate-100 p-3">
                <div className="mb-2 flex items-center gap-2 text-slate-700 text-sm font-medium">
                  <Info className="h-4 w-4 text-slate-400" />
                  Environment Variables
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    id="env-key"
                    value={d.env?.[0]?.key ?? ""}
                    onChange={(e) => {
                      const env = Array.isArray(d.env) ? [...d.env] : [{ key: "", value: "" }];
                      env[0] = { ...(env[0] || {}), key: e.target.value };
                      updateDetails({ env });
                    }}
                    placeholder="KEY"
                  />
                  <TextInput
                    id="env-val"
                    value={d.env?.[0]?.value ?? ""}
                    onChange={(e) => {
                      const env = Array.isArray(d.env) ? [...d.env] : [{ key: "", value: "" }];
                      env[0] = { ...(env[0] || {}), value: e.target.value };
                      updateDetails({ env });
                    }}
                    placeholder="value"
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        );

      case "AWS S3":
        return (
          <SectionCard
            title="S3 Settings"
            icon={<img src="/aws-icons/s3.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>Bucket Name</Label>
                <TextInput
                  id="bucketName"
                  value={d.bucketName || ""}
                  onChange={(e) => updateDetails({ bucketName: e.target.value })}
                  placeholder="my-team-logs"
                  error={errors.bucketName}
                />
                <FieldError id="bucketName-error" message={errors.bucketName} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Region (Base)</Label>
                  <TextInput
                    id="baseRegion"
                    value={config.region}
                    onChange={(e) => setConfig({ ...config, region: e.target.value })}
                    placeholder="e.g., us-east-1"
                  />
                </div>
                <div>
                  <Label>Region (S3 override)</Label>
                  <TextInput
                    id="s3Region"
                    value={d.region || ""}
                    onChange={(e) => updateDetails({ region: e.target.value })}
                    placeholder="e.g., us-east-1"
                    error={errors.s3Region}
                  />
                  <FieldError id="s3Region-error" message={errors.s3Region} />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Checkbox
                  checked={!!d.versioning}
                  onChange={(e) => updateDetails({ versioning: e.target.checked })}
                  label="Enable Versioning"
                />
                <Checkbox
                  checked={!!d.publicAccessBlock}
                  onChange={(e) => updateDetails({ publicAccessBlock: e.target.checked })}
                  label="Block Public Access"
                />
              </div>

              <div>
                <Label>Encryption</Label>
                <SelectInput
                  id="encryption"
                  value={d.encryption || "SSE-S3"}
                  onChange={(e) => updateDetails({ encryption: e.target.value })}
                  options={[
                    { value: "None", label: "None" },
                    { value: "SSE-S3", label: "SSE-S3 (AES-256)" },
                    { value: "SSE-KMS", label: "SSE-KMS" },
                  ]}
                />
              </div>
            </div>
          </SectionCard>
        );
case "AWS SQS":
      return (
        <SectionCard
          title="SQS Settings"
          icon={<img src="/aws-icons/sqs.png" alt="" className="h-4 w-4" />}
        >
          <div className="space-y-5">
            <div>
              <Label>Queue Name</Label>
              <TextInput
                id="queueName"
                value={d.queueName || ""}
                onChange={(e) => updateDetails({ queueName: e.target.value })}
                placeholder="my-queue"
                error={errors.queueName}
              />
              <FieldError id="queueName-error" message={errors.queueName} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Message Retention (seconds)</Label>
                <SelectInput
                  id="retention"
                  value={String(d.retention || 345600)}
                  onChange={(e) => updateDetails({ retention: Number(e.target.value) })}
                  options={[60, 3600, 86400, 345600, 1209600].map((s) => ({
                    value: String(s),
                    label: `${s} sec`,
                  }))}
                />
              </div>
              <div>
                <Label>Visibility Timeout (seconds)</Label>
                <SelectInput
                  id="visibility"
                  value={String(d.visibility || 30)}
                  onChange={(e) => updateDetails({ visibility: Number(e.target.value) })}
                  options={[30, 60, 300, 600, 1200].map((s) => ({
                    value: String(s),
                    label: `${s} sec`,
                  }))}
                />
              </div>
            </div>

            <div>
              <Checkbox
                checked={!!d.fifo}
                onChange={(e) => updateDetails({ fifo: e.target.checked })}
                label="FIFO Queue"
              />
            </div>
          </div>
        </SectionCard>
      );

    case "AWS DynamoDB":
      return (
        <SectionCard
          title="DynamoDB Settings"
          icon={<img src="/aws-icons/dynamodb.png" alt="" className="h-4 w-4" />}
        >
          <div className="space-y-5">
            <div>
              <Label>Table Name</Label>
              <TextInput
                id="tableName"
                value={d.tableName || ""}
                onChange={(e) => updateDetails({ tableName: e.target.value })}
                placeholder="UsersTable"
                error={errors.tableName}
              />
              <FieldError id="tableName-error" message={errors.tableName} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Read Capacity Units</Label>
                <TextInput
                  id="readCapacity"
                  type="number"
                  value={d.readCapacity || 5}
                  onChange={(e) => updateDetails({ readCapacity: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Write Capacity Units</Label>
                <TextInput
                  id="writeCapacity"
                  type="number"
                  value={d.writeCapacity || 5}
                  onChange={(e) => updateDetails({ writeCapacity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Checkbox
                checked={!!d.onDemand}
                onChange={(e) => updateDetails({ onDemand: e.target.checked })}
                label="Use On-Demand Capacity"
              />
            </div>
          </div>
        </SectionCard>
      );

    case "AWS RDS":
      return (
        <SectionCard
          title="RDS Settings"
          icon={<img src="/aws-icons/rds.png" alt="" className="h-4 w-4" />}
        >
          <div className="space-y-5">
            <div>
              <Label>DB Instance Identifier</Label>
              <TextInput
                id="dbIdentifier"
                value={d.dbIdentifier || ""}
                onChange={(e) => updateDetails({ dbIdentifier: e.target.value })}
                placeholder="mydb-instance"
                error={errors.dbIdentifier}
              />
              <FieldError id="dbIdentifier-error" message={errors.dbIdentifier} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Engine</Label>
                <SelectInput
                  id="engine"
                  value={d.engine || "postgres"}
                  onChange={(e) => updateDetails({ engine: e.target.value })}
                  options={[
                    { value: "postgres", label: "PostgreSQL" },
                    { value: "mysql", label: "MySQL" },
                    { value: "mariadb", label: "MariaDB" },
                    { value: "oracle", label: "Oracle" },
                    { value: "sqlserver", label: "SQL Server" },
                  ]}
                />
              </div>
              <div>
                <Label>DB Instance Class</Label>
                <SelectInput
                  id="dbClass"
                  value={d.dbClass || "db.t3.micro"}
                  onChange={(e) => updateDetails({ dbClass: e.target.value })}
                  options={[
                    { value: "db.t3.micro", label: "db.t3.micro" },
                    { value: "db.t3.small", label: "db.t3.small" },
                    { value: "db.t3.medium", label: "db.t3.medium" },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Allocated Storage (GB)</Label>
                <TextInput
                  id="storage"
                  type="number"
                  value={d.storage || 20}
                  onChange={(e) => updateDetails({ storage: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Multi-AZ</Label>
                <Checkbox
                  checked={!!d.multiAZ}
                  onChange={(e) => updateDetails({ multiAZ: e.target.checked })}
                  label="Enable Multi-AZ"
                />
              </div>
            </div>
          </div>
        </SectionCard>
      );

    case "AWS SNS":
      return (
        <SectionCard
          title="SNS Settings"
          icon={<img src="/aws-icons/sns.png" alt="" className="h-4 w-4" />}
        >
          <div className="space-y-5">
            <div>
              <Label>Topic Name</Label>
              <TextInput
                id="topicName"
                value={d.topicName || ""}
                onChange={(e) => updateDetails({ topicName: e.target.value })}
                placeholder="alerts-topic"
                error={errors.topicName}
              />
              <FieldError id="topicName-error" message={errors.topicName} />
            </div>

            <div>
              <Label>Delivery Policy (JSON)</Label>
              <TextInput
                id="deliveryPolicy"
                value={d.deliveryPolicy || ""}
                onChange={(e) => updateDetails({ deliveryPolicy: e.target.value })}
                placeholder='{"http":{"defaultHealthyRetryPolicy":{...}}}'
              />
            </div>

            <div>
              <Checkbox
                checked={!!d.fifo}
                onChange={(e) => updateDetails({ fifo: e.target.checked })}
                label="FIFO Topic"
              />
            </div>
          </div>
        </SectionCard>
      );

    // GCP Services
    case "GCP Storage":
      return (
        <SectionCard
          title="Cloud Storage Settings"
          icon={<img src="/gcp-icons/Google_Storage-Logo.wine.png" alt="" className="h-4 w-4" />}
        >
          <div className="space-y-5">
            <div>
              <Label>Bucket Name</Label>
              <TextInput
                id="bucketName"
                value={d.bucketName || ""}
                onChange={(e) => updateDetails({ bucketName: e.target.value })}
                placeholder="my-bucket-name"
                error={errors.bucketName}
              />
              <FieldError id="bucketName-error" message={errors.bucketName} />
              <p className="mt-1 text-xs text-slate-500">
                Must be globally unique. 3-63 characters, lowercase letters, numbers, hyphens.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <Checkbox
                checked={!!d.uniformAccess}
                onChange={(e) => updateDetails({ uniformAccess: e.target.checked })}
                label="Uniform Bucket-Level Access"
              />
              <Checkbox
                checked={!!d.forceDestroy}
                onChange={(e) => updateDetails({ forceDestroy: e.target.checked })}
                label="Force Destroy (Delete non-empty bucket)"
              />
            </div>
          </div>
        </SectionCard>
      );

    case "Pub/Sub":
      return (
        <SectionCard
          title="Pub/Sub Settings"
          icon={<img src="/gcp-icons/google-cloud-pub-sub-logo.png" alt="" className="h-4 w-4" />}
        >
          <div className="space-y-5">
            <div>
              <Label>Topic Name</Label>
              <TextInput
                id="topicName"
                value={d.topicName || ""}
                onChange={(e) => updateDetails({ topicName: e.target.value })}
                placeholder="my-topic"
                error={errors.topicName}
              />
              <FieldError id="topicName-error" message={errors.topicName} />
              <p className="mt-1 text-xs text-slate-500">
                Topic name within the project. Must be 3-255 characters.
              </p>
            </div>
          </div>
        </SectionCard>
      );

    case "Cloud Run":
      return (
        <SectionCard
          title="Cloud Run Settings"
          icon={<img src="/gcp-icons/google-cloud-run-logo-png.png" alt="" className="h-4 w-4" />}
        >
          <div className="space-y-5">
            <div>
              <Label>Container Image</Label>
              <TextInput
                id="image"
                value={d.image || "gcr.io/cloudrun/hello"}
                onChange={(e) => updateDetails({ image: e.target.value })}
                placeholder="gcr.io/cloudrun/hello"
                error={errors.image}
              />
              <FieldError id="image-error" message={errors.image} />
              <p className="mt-1 text-xs text-slate-500">
                Container image URL (e.g., gcr.io/project/image:tag)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CPU</Label>
                <SelectInput
                  id="cpu"
                  value={d.cpu || "1000m"}
                  onChange={(e) => updateDetails({ cpu: e.target.value })}
                  options={[
                    { value: "1000m", label: "1 vCPU (1000m)" },
                    { value: "2000m", label: "2 vCPU (2000m)" },
                    { value: "4000m", label: "4 vCPU (4000m)" },
                    { value: "8000m", label: "8 vCPU (8000m)" },
                  ]}
                />
              </div>
              <div>
                <Label>Memory</Label>
                <SelectInput
                  id="memory"
                  value={d.memory || "512Mi"}
                  onChange={(e) => updateDetails({ memory: e.target.value })}
                  options={[
                    { value: "128Mi", label: "128 Mi" },
                    { value: "256Mi", label: "256 Mi" },
                    { value: "512Mi", label: "512 Mi" },
                    { value: "1Gi", label: "1 Gi" },
                    { value: "2Gi", label: "2 Gi" },
                    { value: "4Gi", label: "4 Gi" },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Instances</Label>
                <NumberInput
                  id="minInstances"
                  value={d.minInstances ?? 0}
                  onChange={(e) => updateDetails({ minInstances: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <Label>Max Instances</Label>
                <NumberInput
                  id="maxInstances"
                  value={d.maxInstances ?? 10}
                  onChange={(e) => updateDetails({ maxInstances: Number(e.target.value) })}
                  min={1}
                  max={1000}
                />
              </div>
            </div>

            <div>
              <Label>Concurrency</Label>
              <NumberInput
                id="concurrency"
                value={d.concurrency ?? 80}
                onChange={(e) => updateDetails({ concurrency: Number(e.target.value) })}
                min={1}
                max={1000}
              />
              <p className="mt-1 text-xs text-slate-500">
                Maximum number of concurrent requests per instance
              </p>
            </div>

            <div>
              <Checkbox
                checked={!!d.allowUnauthenticated}
                onChange={(e) => updateDetails({ allowUnauthenticated: e.target.checked })}
                label="Allow Unauthenticated Access"
              />
            </div>

            <div className="rounded-2xl bg-slate-50/60 border border-slate-100 p-3">
              <div className="mb-2 flex items-center gap-2 text-slate-700 text-sm font-medium">
                <Info className="h-4 w-4 text-slate-400" />
                Environment Variables
              </div>
              <div className="space-y-2">
                {Object.keys(d.env || {}).length === 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput
                      id="env-key-0"
                      value=""
                      onChange={(e) => {
                        const env = { ...(d.env || {}) };
                        if (e.target.value) env[e.target.value] = "";
                        updateDetails({ env });
                      }}
                      placeholder="KEY"
                    />
                    <TextInput
                      id="env-val-0"
                      value=""
                      onChange={(e) => {
                        const env = { ...(d.env || {}) };
                        const firstKey = Object.keys(env)[0] || "";
                        if (firstKey) env[firstKey] = e.target.value;
                        updateDetails({ env });
                      }}
                      placeholder="value"
                    />
                  </div>
                ) : (
                  Object.entries(d.env || {}).map(([key, value], idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-3">
                      <TextInput
                        id={`env-key-${idx}`}
                        value={key}
                        onChange={(e) => {
                          const env = { ...(d.env || {}) };
                          delete env[key];
                          if (e.target.value) env[e.target.value] = value;
                          updateDetails({ env });
                        }}
                        placeholder="KEY"
                      />
                      <TextInput
                        id={`env-val-${idx}`}
                        value={String(value || "")}
                        onChange={(e) => {
                          const env = { ...(d.env || {}) };
                          env[key] = e.target.value;
                          updateDetails({ env });
                        }}
                        placeholder="value"
                      />
                    </div>
                  ))
                )}
                <button
                  onClick={() => {
                    const env = { ...(d.env || {}), [`ENV_${Date.now()}`]: "" };
                    updateDetails({ env });
                  }}
                  className="text-xs text-orange-600 hover:text-orange-700"
                >
                  + Add Environment Variable
                </button>
              </div>
            </div>
          </div>
        </SectionCard>
      );

    case "GCP Secret Manager":
      return (
        <SectionCard
          title="Secret Manager Settings"
          icon={<img src="/gcp-icons/secret manager.png" alt="" className="h-4 w-4" />}
        >
          <div className="space-y-5">
            <div>
              <Label>Secret Value (Optional)</Label>
              <textarea
                id="secretValue"
                value={d.secretValue || ""}
                onChange={(e) => updateDetails({ secretValue: e.target.value })}
                rows={4}
                className={baseInputClass(undefined) + " resize-none"}
                placeholder="Enter secret value (will be stored securely)"
              />
              <p className="mt-1 text-xs text-slate-500">
                Initial secret value. Leave empty to create an empty secret.
              </p>
            </div>
          </div>
        </SectionCard>
      );

    case "GCP Firestore":
      return (
        <SectionCard
          title="Firestore Settings"
          icon={<img src="/gcp-icons/firestore.png" alt="" className="h-4 w-4" />}
        >
          <div className="space-y-5">
            <div>
              <Label>Location ID</Label>
              <SelectInput
                id="locationId"
                value={d.locationId || "us-central"}
                onChange={(e) => updateDetails({ locationId: e.target.value })}
                options={[
                  { value: "us-central", label: "us-central (Multi-region)" },
                  { value: "us-east1", label: "us-east1 (South Carolina)" },
                  { value: "us-east4", label: "us-east4 (Northern Virginia)" },
                  { value: "us-west1", label: "us-west1 (Oregon)" },
                  { value: "us-west2", label: "us-west2 (Los Angeles)" },
                  { value: "europe-west1", label: "europe-west1 (Belgium)" },
                  { value: "europe-west2", label: "europe-west2 (London)" },
                  { value: "asia-northeast1", label: "asia-northeast1 (Tokyo)" },
                  { value: "asia-southeast1", label: "asia-southeast1 (Singapore)" },
                ]}
                error={errors.locationId}
              />
              <FieldError id="locationId-error" message={errors.locationId} />
            </div>

            <div>
              <Label>Database ID</Label>
              <TextInput
                id="databaseId"
                value={d.databaseId || "(default)"}
                onChange={(e) => updateDetails({ databaseId: e.target.value })}
                placeholder="(default)"
              />
              <p className="mt-1 text-xs text-slate-500">
                Database ID. Use "(default)" for the default database.
              </p>
            </div>
          </div>
        </SectionCard>
      );

    default:
      return (
        <SectionCard title="Settings">
          <div className="text-sm text-slate-600">
            No specific configuration for "{service.label}".
          </div>
        </SectionCard>
      );
  }
};
  /* progress for stepper */
  const stepOneValid = true; // base section is always okay
  const stepTwoValid = isValid; // service section validity
  const progressPct = (stepOneValid ? 50 : 0) + (stepTwoValid ? 50 : 0);

  return (
    <>
      {/* Backdrop with subtle vignette */}
      <div
        className={`fixed inset-0 z-40 bg-gradient-to-br from-slate-900/20 via-slate-900/10 to-transparent
          transition-opacity duration-200 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[480px] bg-white/90 backdrop-blur-md z-50 transform transition-transform duration-200 ease-out
        ${isOpen ? "translate-x-0" : "translate-x-full"} shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)]`}
        role="dialog"
        aria-modal="true"
        aria-label={`${service.label ?? "Service"} Configuration`}
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-tr from-orange-400/30 to-amber-300/30 blur-3xl pointer-events-none" />
        <div className="absolute -right-10 top-1/2 h-56 w-56 rounded-full bg-gradient-to-tr from-orange-500/20 to-pink-400/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col h-full relative">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-white/80 via-white/70 to-white/60 backdrop-blur border-b border-slate-100">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl ring-1 ring-slate-200 grid place-items-center bg-white shadow-sm">
                  <img src={service.img || "/placeholder.svg"} alt={service.label} className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">{brandTitle}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <Chip>{config.environment}</Chip>
                    <Chip>{config.region || "region: n/a"}</Chip>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-50 text-slate-500 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper / progress */}
            <div className="px-5 pb-4">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mb-1">
                <span className="flex items-center gap-1">
                  {stepOneValid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-300" />}
                  Base
                </span>
                <span className="flex items-center gap-1">
                  {stepTwoValid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                  Service
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 px-5 py-5 overflow-y-auto">
            <div className="space-y-6">
              {/* Base section */}
              <SectionCard title="Overview" icon={<img src="/aws-icons/cloud.png" alt="" className="h-4 w-4 opacity-60" />}>
                <div className="space-y-4">
                  <div>
                    <Label>Service Name</Label>
                    <TextInput
                      id="svcName"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      placeholder="Enter service name"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <textarea
                      id="description"
                      value={config.description}
                      onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      rows={3}
                      className={baseInputClass(undefined) + " resize-none"}
                      placeholder="What does this service do?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Environment</Label>
                      <SelectInput
                        id="environment"
                        value={config.environment}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            environment: e.target.value as ServiceConfig["environment"],
                          })
                        }
                        options={[
                          { value: "development", label: "Development" },
                          { value: "staging", label: "Staging" },
                          { value: "production", label: "Production" },
                        ]}
                      />
                    </div>
                    <div>
                      <Label>Region</Label>
                      <TextInput
                        id="baseRegionTop"
                        value={config.region}
                        onChange={(e) => setConfig({ ...config, region: e.target.value })}
                        placeholder="e.g., us-east-1"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Service-specific fields */}
              {renderServiceFields()}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-20 bg-white/80 backdrop-blur border-t border-slate-100">
            <div className="flex items-center justify-between px-5 py-4">
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this service?")) onDelete(service.id);
                }}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isValid}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-white shadow-md transition
                    ${isValid
                      ? "bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-600/90 hover:to-amber-500/90"
                      : "bg-slate-300 cursor-not-allowed shadow-none"
                    }`}
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}