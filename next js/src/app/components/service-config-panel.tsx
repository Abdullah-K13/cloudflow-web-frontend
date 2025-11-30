"use client";

import { useState, useEffect, ChangeEvent, useMemo } from "react";
import { X, Save, Trash2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import type { ServiceItem } from "./types";
import {
  AWS_LAMBDA_RUNTIMES,
  AWS_LAMBDA_ARCH,
  AWS_LAMBDA_MEMORY_SIZES,
  AWS_LAMBDA_TIMEOUTS,
  AWS_REGIONS_OPTIONS,
  GCP_REGIONS_OPTIONS,
  AZURE_REGIONS_OPTIONS,
} from "./awsOptions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
  if (base.startsWith("azure.")) return base.slice(6); // Remove "azure." prefix
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
    case "apigateway":
      return { restApiName: "", description: "", deploymentStage: "prod" };
    case "events_rule":
    case "events":
      return { ruleName: "", pattern: {}, schedule: "" };
    case "sfn":
      return { stateMachineName: "", definition: undefined };
    case "ec2":
      return { instanceName: "", instanceType: "t3.micro", ami: "", keyName: "", securityGroups: [] };
    case "rds":
      return { 
        instanceIdentifier: "", 
        dbIdentifier: "", 
        engine: "postgres", 
        engineVersion: "16.3", 
        instanceClass: "db.t3.micro", 
        dbClass: "db.t3.micro",
        allocatedStorage: 20,
        storage: 20,
        masterUsername: "admin",
        masterPassword: "",
        multiAZ: false
      };
    case "ecs":
      return { 
        clusterName: "", 
        serviceName: "", 
        taskDefinition: { cpu: "256", memory: "512", image: "nginx:latest" },
        desiredCount: 1
      };
    case "kinesis":
      return { streamName: "", shardCount: 1, retentionHours: 24, encryptionType: "NONE", kmsKeyId: "" };
    case "dynamodb":
      return {
        tableName: "",
        partitionKey: { name: "pk", type: "S" },
        sortKey: { name: "", type: "S" },
        billing: "PAY_PER_REQUEST",
        stream: true,
        rcu: 10,
        wcu: 10,
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
    // Azure Services
    case "storage":
      return {
        accountKind: "StorageV2",
        sku: "Standard_LRS",
        containerName: "",
      };
    case "servicebus":
      return {
        sku: "Basic",
        queueName: "",
        partition: false,
      };
    case "containerapp":
      return {
        image: "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest",
        cpu: 0.25,
        memory: "0.5Gi",
        env: {},
      };
    case "vm":
      return {
        vmSize: "Standard_B1s",
        adminUsername: "azureuser",
        adminPassword: "",
        osType: "Linux",
      };
    case "functionapp":
      return {
        sku: "Y1",
      };
    case "sql":
      return {
        databaseName: "",
        sku: { name: "S0", tier: "Standard" },
      };
    case "cosmosdb":
      return {
        databaseName: "",
        containerName: "",
        partitionKey: "/id",
      };
    case "apimanagement":
      return {
        publisherName: "Contoso",
        publisherEmail: "admin@contoso.com",
        sku: "Developer",
      };
    case "keyvault":
      return {
        tenantId: "",
      };
    case "appinsights":
      return {};
    case "vnet":
      return {
        addressSpaces: ["10.0.0.0/16"],
        subnets: [{ name: "default", addressPrefix: "10.0.1.0/24" }],
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
    if (!d.lambda_name?.trim()) e.lambda_name = "Lambda name is required";
    if (!cfg.region?.trim()) e.region = "Region is required";
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
  // Azure Services Validation
  if (serviceLabel === "Azure Service Bus") {
    if (!d.queueName?.trim()) e.queueName = "Queue name is required";
  }
  if (serviceLabel === "Azure Container Apps") {
    if (!d.image?.trim()) e.image = "Container image is required";
  }
  if (serviceLabel === "Azure Virtual Machine") {
    if (!d.adminUsername?.trim()) e.adminUsername = "Admin username is required";
    if (!d.adminPassword?.trim()) e.adminPassword = "Admin password is required";
  }
  if (serviceLabel === "Azure SQL Database") {
    if (!d.databaseName?.trim()) e.databaseName = "Database name is required";
  }
  if (serviceLabel === "Azure Cosmos DB") {
    if (!d.databaseName?.trim()) e.databaseName = "Database name is required";
    if (!d.containerName?.trim()) e.containerName = "Container name is required";
  }
  if (serviceLabel === "Azure API Management") {
    if (!d.publisherName?.trim()) e.publisherName = "Publisher name is required";
    if (!d.publisherEmail?.trim()) e.publisherEmail = "Publisher email is required";
    if (d.publisherEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.publisherEmail)) {
      e.publisherEmail = "Invalid email format";
    }
  }
  if (serviceLabel === "Azure Key Vault") {
    if (!d.tenantId?.trim()) e.tenantId = "Tenant ID is required";
    if (d.tenantId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.tenantId)) {
      e.tenantId = "Tenant ID must be a valid UUID";
    }
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

// Styled Region Select component matching platform design
const RegionSelect = ({
  value,
  onValueChange,
  options,
  error,
  id,
  placeholder = "Select region",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  id?: string;
  placeholder?: string;
}) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger
      id={id}
      className={[
        baseInputClass(error),
        "h-auto min-h-[42px] cursor-pointer justify-between",
        "hover:bg-white focus:bg-white",
      ].join(" ")}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <SelectValue placeholder={placeholder} className="text-black" />
    </SelectTrigger>
    <SelectContent className="max-h-[300px] rounded-2xl border-slate-200 shadow-lg !bg-white backdrop-blur-none">
      {options.map((option) => (
        <SelectItem 
          key={option.value} 
          value={option.value}
          className="cursor-pointer bg-white hover:bg-orange-50 focus:bg-orange-50 focus:text-slate-900"
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
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
    region: service.label?.startsWith("Azure") ? "eastus" : "",
  };

  const seeded = service.config ?? { ...baseDefault, details: defaultDetailsFor(service) };
  const [config, setConfig] = useState<ServiceConfig>(seeded);
  const [errors, setErrors] = useState<Errors>({});

  // re-seed on service change
  useEffect(() => {
    const nextBase = service.config ?? { ...baseDefault, name: service.label ?? "" };
    // Set default region based on service type if not already set
    if (!nextBase.region || nextBase.region === "") {
      if (service.label?.startsWith("Azure")) {
        nextBase.region = "eastus";
      }
    }
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
  
  // Check if service is AWS, GCP, or Azure (for region dropdown)
  const isAWSService = service.label?.startsWith("AWS") ?? false;
  const isGCPService = service.label?.startsWith("GCP") || 
                       service.label === "Pub/Sub" || 
                       service.label === "Cloud Run" ||
                       service.label === "Cloud Storage" ||
                       service.label === "Secret Manager" ||
                       false;
  const isAzureService = service.label?.startsWith("Azure") ?? false;

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
                <Label>Lambda Name *</Label>
                <TextInput
                  id="lambda_name"
                  value={d.lambda_name || ""}
                  onChange={(e) => updateDetails({ lambda_name: e.target.value })}
                  placeholder="MyLambdaFunction"
                  error={errors.lambda_name}
                />
                <FieldError id="lambda_name-error" message={errors.lambda_name} />
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
                  <Label>Region (Base) *</Label>
                  {isAWSService ? (
                    <RegionSelect
                      id="baseRegion"
                      value={config.region}
                      onValueChange={(value) => setConfig({ ...config, region: value })}
                      options={AWS_REGIONS_OPTIONS}
                      error={errors.region}
                      placeholder="Select region"
                    />
                  ) : isGCPService ? (
                    <RegionSelect
                      id="baseRegion"
                      value={config.region}
                      onValueChange={(value) => setConfig({ ...config, region: value })}
                      options={GCP_REGIONS_OPTIONS}
                      error={errors.region}
                      placeholder="Select region"
                    />
                  ) : isAzureService ? (
                    <RegionSelect
                      id="baseRegion"
                      value={config.region}
                      onValueChange={(value) => setConfig({ ...config, region: value })}
                      options={AZURE_REGIONS_OPTIONS}
                      error={errors.region}
                      placeholder="Select region"
                    />
                  ) : (
                    <TextInput
                      id="baseRegion"
                      value={config.region}
                      onChange={(e) => setConfig({ ...config, region: e.target.value })}
                      placeholder="e.g., us-east-1"
                      error={errors.region}
                    />
                  )}
                  <FieldError id="region-error-base" message={errors.region} />
                </div>
                <div>
                  <Label>Region (S3 override)</Label>
                  {isAWSService ? (
                    <RegionSelect
                      id="s3Region"
                      value={d.region || ""}
                      onValueChange={(value) => updateDetails({ region: value })}
                      options={[{ value: "", label: "Use base region" }, ...AWS_REGIONS_OPTIONS]}
                      error={errors.s3Region}
                      placeholder="Use base region"
                    />
                  ) : (
                    <TextInput
                      id="s3Region"
                      value={d.region || ""}
                      onChange={(e) => updateDetails({ region: e.target.value })}
                      placeholder="e.g., us-east-1"
                      error={errors.s3Region}
                    />
                  )}
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
                  <Label>Partition Key Name</Label>
                  <TextInput
                    id="partitionKeyName"
                    value={d.partitionKey?.name || "pk"}
                    onChange={(e) => updateDetails({ 
                      partitionKey: { 
                        name: e.target.value, 
                        type: d.partitionKey?.type || "S" 
                      } 
                    })}
                    placeholder="pk"
                  />
                </div>
                <div>
                  <Label>Partition Key Type</Label>
                  <SelectInput
                    id="partitionKeyType"
                    value={d.partitionKey?.type || "S"}
                    onChange={(e) => updateDetails({ 
                      partitionKey: { 
                        name: d.partitionKey?.name || "pk", 
                        type: e.target.value 
                      } 
                    })}
                    options={[
                      { value: "S", label: "String (S)" },
                      { value: "N", label: "Number (N)" },
                      { value: "B", label: "Binary (B)" },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sort Key Name (Optional)</Label>
                  <TextInput
                    id="sortKeyName"
                    value={d.sortKey?.name || ""}
                    onChange={(e) => updateDetails({ 
                      sortKey: e.target.value ? {
                        name: e.target.value, 
                        type: d.sortKey?.type || "S" 
                      } : undefined
                    })}
                    placeholder="timestamp"
                  />
                </div>
                {d.sortKey?.name && (
                  <div>
                    <Label>Sort Key Type</Label>
                    <SelectInput
                      id="sortKeyType"
                      value={d.sortKey?.type || "S"}
                      onChange={(e) => updateDetails({ 
                        sortKey: { 
                          name: d.sortKey?.name, 
                          type: e.target.value 
                        } 
                      })}
                      options={[
                        { value: "S", label: "String (S)" },
                        { value: "N", label: "Number (N)" },
                        { value: "B", label: "Binary (B)" },
                      ]}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Billing Mode</Label>
                <SelectInput
                  id="billing"
                  value={d.billing || "PAY_PER_REQUEST"}
                  onChange={(e) => updateDetails({ billing: e.target.value })}
                  options={[
                    { value: "PAY_PER_REQUEST", label: "Pay Per Request" },
                    { value: "PROVISIONED", label: "Provisioned" },
                  ]}
                />
              </div>

              {d.billing === "PROVISIONED" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Read Capacity Units (RCU)</Label>
                    <TextInput
                      id="rcu"
                      type="number"
                      value={d.rcu || 10}
                      onChange={(e) => updateDetails({ rcu: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Write Capacity Units (WCU)</Label>
                    <TextInput
                      id="wcu"
                      type="number"
                      value={d.wcu || 10}
                      onChange={(e) => updateDetails({ wcu: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div>
                <Checkbox
                  checked={d.stream !== undefined ? d.stream : true}
                  onChange={(e) => updateDetails({ stream: e.target.checked })}
                  label="Enable DynamoDB Streams"
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
                  value={d.instanceIdentifier || d.dbIdentifier || ""}
                  onChange={(e) => updateDetails({ instanceIdentifier: e.target.value, dbIdentifier: e.target.value })}
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
                  <Label>Engine Version</Label>
                  <TextInput
                    id="engineVersion"
                    value={d.engineVersion || "16.3"}
                    onChange={(e) => updateDetails({ engineVersion: e.target.value })}
                    placeholder="16.3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>DB Instance Class</Label>
                  <SelectInput
                    id="dbClass"
                    value={d.instanceClass || d.dbClass || "db.t3.micro"}
                    onChange={(e) => updateDetails({ instanceClass: e.target.value, dbClass: e.target.value })}
                    options={[
                      { value: "db.t3.micro", label: "db.t3.micro" },
                      { value: "db.t3.small", label: "db.t3.small" },
                      { value: "db.t3.medium", label: "db.t3.medium" },
                      { value: "db.m5.large", label: "db.m5.large" },
                    ]}
                  />
                </div>
                <div>
                  <Label>Allocated Storage (GB)</Label>
                  <TextInput
                    id="allocatedStorage"
                    type="number"
                    value={d.allocatedStorage || d.storage || 20}
                    onChange={(e) => updateDetails({ allocatedStorage: Number(e.target.value), storage: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Master Username</Label>
                  <TextInput
                    id="masterUsername"
                    value={d.masterUsername || "admin"}
                    onChange={(e) => updateDetails({ masterUsername: e.target.value })}
                    placeholder="admin"
                  />
                </div>
                <div>
                  <Label>Master Password</Label>
                  <TextInput
                    id="masterPassword"
                    type="password"
                    value={d.masterPassword || ""}
                    onChange={(e) => updateDetails({ masterPassword: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <div>
                <Checkbox
                  checked={!!d.multiAZ}
                  onChange={(e) => updateDetails({ multiAZ: e.target.checked })}
                  label="Enable Multi-AZ Deployment"
                />
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
                <Label>Display Name (Optional)</Label>
                <TextInput
                  id="displayName"
                  value={d.displayName || ""}
                  onChange={(e) => updateDetails({ displayName: e.target.value })}
                  placeholder="My Topic"
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

      case "API Gateway":
      case "AWS API Gateway":
        return (
          <SectionCard
            title="API Gateway Settings"
            icon={<img src="/aws-icons/API Gateway.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>REST API Name</Label>
                <TextInput
                  id="restApiName"
                  value={d.restApiName || d.apiName || ""}
                  onChange={(e) => updateDetails({ restApiName: e.target.value, apiName: e.target.value })}
                  placeholder="my-rest-api"
                />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <TextInput
                  id="description"
                  value={d.description || ""}
                  onChange={(e) => updateDetails({ description: e.target.value })}
                  placeholder="My REST API"
                />
              </div>
              <div>
                <Label>Deployment Stage</Label>
                <TextInput
                  id="deploymentStage"
                  value={d.deploymentStage || "prod"}
                  onChange={(e) => updateDetails({ deploymentStage: e.target.value })}
                  placeholder="prod"
                />
              </div>
            </div>
          </SectionCard>
        );

      case "EventBridge Rule":
      case "AWS EventBridge Rule":
        return (
          <SectionCard
            title="EventBridge Rule Settings"
            icon={<img src="/aws-icons/eventbridge.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>Rule Name (Optional)</Label>
                <TextInput
                  id="ruleName"
                  value={d.ruleName || ""}
                  onChange={(e) => updateDetails({ ruleName: e.target.value })}
                  placeholder="my-rule"
                />
              </div>
              <div>
                <Label>Schedule Expression (Optional)</Label>
                <TextInput
                  id="schedule"
                  value={d.schedule || ""}
                  onChange={(e) => updateDetails({ schedule: e.target.value })}
                  placeholder='rate(5 minutes) or cron(0 12 * * ? *)'
                />
                <p className="mt-1 text-xs text-slate-500">
                  Use rate() for periodic events or cron() for scheduled events
                </p>
              </div>
              <div>
                <Label>Event Pattern (JSON, Optional)</Label>
                <textarea
                  id="pattern"
                  value={d.pattern ? JSON.stringify(d.pattern, null, 2) : '{\n  "source": ["aws.s3"],\n  "detail-type": ["Object Created"]\n}'}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      updateDetails({ pattern: parsed });
                    } catch {
                      // Invalid JSON, keep as is
                    }
                  }}
                  rows={6}
                  className={baseInputClass(undefined) + " resize-none font-mono text-xs"}
                  placeholder='{"source": ["aws.s3"], "detail-type": ["Object Created"]}'
                />
                <p className="mt-1 text-xs text-slate-500">
                  Event pattern to match events. Required if schedule is not provided.
                </p>
              </div>
            </div>
          </SectionCard>
        );

      case "Step Functions":
      case "AWS Step Functions":
        return (
          <SectionCard
            title="Step Functions Settings"
            icon={<img src="/aws-icons/stepfunctions.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>State Machine Name</Label>
                <TextInput
                  id="stateMachineName"
                  value={d.stateMachineName || ""}
                  onChange={(e) => updateDetails({ stateMachineName: e.target.value })}
                  placeholder="my-state-machine"
                />
              </div>
              <div>
                <Label>Definition (JSON, Optional)</Label>
                <textarea
                  id="definition"
                  value={d.definition ? JSON.stringify(d.definition, null, 2) : '{\n  "Comment": "A simple pass-through state",\n  "StartAt": "PassState",\n  "States": {\n    "PassState": {\n      "Type": "Pass",\n      "Result": "Hello World",\n      "End": true\n    }\n  }\n}'}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      updateDetails({ definition: parsed });
                    } catch {
                      // Invalid JSON, keep as is
                    }
                  }}
                  rows={10}
                  className={baseInputClass(undefined) + " resize-none font-mono text-xs"}
                  placeholder='{"Comment": "State machine definition"}'
                />
                <p className="mt-1 text-xs text-slate-500">
                  State machine definition in JSON format. If not provided, a simple pass-through state will be used.
                </p>
              </div>
            </div>
          </SectionCard>
        );

      // --- NEW AWS SERVICES ---

      case "AWS EC2":
        return (
          <SectionCard title="EC2 Settings" icon={<img src="/aws-icons/ec2.png" alt="" className="h-4 w-4" />}>
            <div className="space-y-5">
              <div>
                <Label>Instance Name</Label>
                <TextInput
                  id="instanceName"
                  value={d.instanceName || ""}
                  onChange={(e) => updateDetails({ instanceName: e.target.value })}
                  placeholder="my-ec2-instance"
                />
              </div>
              <div>
                <Label>Instance Type</Label>
                <SelectInput
                  id="instanceType"
                  value={d.instanceType || "t3.micro"}
                  onChange={(e) => updateDetails({ instanceType: e.target.value })}
                  options={[
                    { value: "t3.micro", label: "t3.micro" },
                    { value: "t3.small", label: "t3.small" },
                    { value: "t3.medium", label: "t3.medium" },
                    { value: "t3.large", label: "t3.large" },
                    { value: "m5.large", label: "m5.large" },
                    { value: "m5.xlarge", label: "m5.xlarge" },
                  ]}
                />
              </div>
              <div>
                <Label>AMI ID (Optional)</Label>
                <TextInput
                  id="ami"
                  value={d.ami || ""}
                  onChange={(e) => updateDetails({ ami: e.target.value })}
                  placeholder="ami-12345678"
                />
              </div>
              <div>
                <Label>SSH Key Pair Name (Optional)</Label>
                <TextInput
                  id="keyName"
                  value={d.keyName || ""}
                  onChange={(e) => updateDetails({ keyName: e.target.value })}
                  placeholder="my-key-pair"
                />
              </div>
              <div>
                <Label>Security Group IDs (Comma-separated, Optional)</Label>
                <TextInput
                  id="securityGroups"
                  value={Array.isArray(d.securityGroups) ? d.securityGroups.join(", ") : (d.securityGroups || "")}
                  onChange={(e) => {
                    const groups = e.target.value.split(",").map((g: string) => g.trim()).filter((g: string) => g);
                    updateDetails({ securityGroups: groups.length > 0 ? groups : undefined });
                  }}
                  placeholder="sg-12345678, sg-87654321"
                />
              </div>
            </div>
          </SectionCard>
        );

      case "AWS ECS":
        return (
          <SectionCard title="ECS Settings" icon={<img src="/aws-icons/ecs.png" alt="" className="h-4 w-4" />}>
            <div className="space-y-5">
              <div>
                <Label>Cluster Name</Label>
                <TextInput
                  id="clusterName"
                  value={d.clusterName || ""}
                  onChange={(e) => updateDetails({ clusterName: e.target.value })}
                  placeholder="my-cluster"
                  error={errors.clusterName}
                />
                <FieldError id="clusterName-error" message={errors.clusterName} />
              </div>
              <div>
                <Label>Service Name (Optional)</Label>
                <TextInput
                  id="serviceName"
                  value={d.serviceName || ""}
                  onChange={(e) => updateDetails({ serviceName: e.target.value })}
                  placeholder="my-ecs-service"
                />
              </div>
              <div>
                <Label>Launch Type</Label>
                <SelectInput
                  id="launchType"
                  value={d.launchType || "FARGATE"}
                  onChange={(e) => updateDetails({ launchType: e.target.value })}
                  options={[{ value: "FARGATE", label: "Fargate" }, { value: "EC2", label: "EC2" }]}
                />
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Task Definition</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Container Image</Label>
                    <TextInput
                      id="taskImage"
                      value={d.taskDefinition?.image || d.image || ""}
                      onChange={(e) => updateDetails({ 
                        taskDefinition: { 
                          ...d.taskDefinition, 
                          image: e.target.value 
                        },
                        image: e.target.value
                      })}
                      placeholder="nginx:latest"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CPU Units</Label>
                      <TextInput
                        id="taskCpu"
                        value={d.taskDefinition?.cpu || d.cpu || "256"}
                        onChange={(e) => updateDetails({ 
                          taskDefinition: { 
                            ...d.taskDefinition, 
                            cpu: e.target.value 
                          },
                          cpu: e.target.value
                        })}
                        placeholder="256"
                      />
                    </div>
                    <div>
                      <Label>Memory (MB)</Label>
                      <TextInput
                        id="taskMemory"
                        type="number"
                        value={d.taskDefinition?.memory || d.memory || "512"}
                        onChange={(e) => updateDetails({ 
                          taskDefinition: { 
                            ...d.taskDefinition, 
                            memory: e.target.value 
                          },
                          memory: e.target.value
                        })}
                        placeholder="512"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label>Desired Count</Label>
                <TextInput
                  id="desiredCount"
                  type="number"
                  value={d.desiredCount || 1}
                  onChange={(e) => updateDetails({ desiredCount: Number(e.target.value) })}
                  placeholder="1"
                />
              </div>
            </div>
          </SectionCard>
        );

      case "AWS ECR":
        return (
          <SectionCard title="ECR Settings" icon={<img src="/aws-icons/ecr.png" alt="" className="h-4 w-4" />}>
            <div className="space-y-5">
              <div>
                <Label>Repository Name</Label>
                <TextInput
                  id="repositoryName"
                  value={d.repositoryName || ""}
                  onChange={(e) => updateDetails({ repositoryName: e.target.value })}
                  placeholder="my-repo"
                  error={errors.repositoryName}
                />
                <FieldError id="repositoryName-error" message={errors.repositoryName} />
              </div>
              <div>
                <Label>Image Tag Mutability</Label>
                <SelectInput
                  id="imageTagMutability"
                  value={d.imageTagMutability || "MUTABLE"}
                  onChange={(e) => updateDetails({ imageTagMutability: e.target.value })}
                  options={[
                    { value: "MUTABLE", label: "Mutable" },
                    { value: "IMMUTABLE", label: "Immutable" },
                  ]}
                />
              </div>
              <div>
                <Checkbox
                  checked={d.scanOnPush !== undefined ? d.scanOnPush : false}
                  onChange={(e) => updateDetails({ scanOnPush: e.target.checked })}
                  label="Enable Image Scanning on Push"
                />
              </div>
              <div>
                <Label>Image Tag Mutability</Label>
                <SelectInput
                  id="imageTagMutability"
                  value={d.imageTagMutability || "MUTABLE"}
                  onChange={(e) => updateDetails({ imageTagMutability: e.target.value })}
                  options={[{ value: "MUTABLE", label: "Mutable" }, { value: "IMMUTABLE", label: "Immutable" }]}
                />
              </div>
            </div>
          </SectionCard>
        );

      case "Secrets Manager":
        return (
          <SectionCard title="Secrets Manager Settings" icon={<img src="/aws-icons/secretsmanager.png" alt="" className="h-4 w-4" />}>
            <div className="space-y-5">
              <div>
                <Label>Secret Name</Label>
                <TextInput
                  id="secretName"
                  value={d.secretName || ""}
                  onChange={(e) => updateDetails({ secretName: e.target.value })}
                  placeholder="my-secret"
                  error={errors.secretName}
                />
                <FieldError id="secretName-error" message={errors.secretName} />
              </div>
              <div>
                <Label>Description</Label>
                <TextInput
                  id="description"
                  value={d.description || ""}
                  onChange={(e) => updateDetails({ description: e.target.value })}
                  placeholder="My secret description"
                />
              </div>
            </div>
          </SectionCard>
        );

      case "Cognito":
        return (
          <SectionCard title="Cognito Settings" icon={<img src="/aws-icons/Cognito.png" alt="" className="h-4 w-4" />}>
            <div className="space-y-5">
              <div>
                <Label>User Pool Name</Label>
                <TextInput
                  id="userPoolName"
                  value={d.userPoolName || ""}
                  onChange={(e) => updateDetails({ userPoolName: e.target.value })}
                  placeholder="my-user-pool"
                  error={errors.userPoolName}
                />
                <FieldError id="userPoolName-error" message={errors.userPoolName} />
              </div>
              <div>
                <Label>MFA Configuration</Label>
                <SelectInput
                  id="mfaConfiguration"
                  value={d.mfaConfiguration || "OFF"}
                  onChange={(e) => updateDetails({ mfaConfiguration: e.target.value })}
                  options={[{ value: "OFF", label: "Off" }, { value: "ON", label: "On" }, { value: "OPTIONAL", label: "Optional" }]}
                />
              </div>
            </div>
          </SectionCard>
        );

      case "AWS VPC":
        return (
          <SectionCard title="VPC Settings" icon={<img src="/aws-icons/aws-vpc-icon.webp" alt="" className="h-4 w-4" />}>
            <div className="space-y-5">
              <div>
                <Label>VPC Name</Label>
                <TextInput
                  id="vpcName"
                  value={d.vpcName || ""}
                  onChange={(e) => updateDetails({ vpcName: e.target.value })}
                  placeholder="my-vpc"
                  error={errors.vpcName}
                />
                <FieldError id="vpcName-error" message={errors.vpcName} />
              </div>
              <div>
                <Label>CIDR Block</Label>
                <TextInput
                  id="cidrBlock"
                  value={d.cidrBlock || "10.0.0.0/16"}
                  onChange={(e) => updateDetails({ cidrBlock: e.target.value })}
                  placeholder="10.0.0.0/16"
                  error={errors.cidrBlock}
                />
                <FieldError id="cidrBlock-error" message={errors.cidrBlock} />
              </div>
              <div>
                <Checkbox
                  checked={!!d.enableDnsHostnames}
                  onChange={(e) => updateDetails({ enableDnsHostnames: e.target.checked })}
                  label="Enable DNS Hostnames"
                />
              </div>
            </div>
          </SectionCard>
        );

      case "CloudWatch":
        return (
          <SectionCard title="CloudWatch Settings" icon={<img src="/aws-icons/cloudwatch.jpeg" alt="" className="h-4 w-4" />}>
            <div className="space-y-5">
              <div>
                <Label>Log Group Name</Label>
                <TextInput
                  id="logGroupName"
                  value={d.logGroupName || ""}
                  onChange={(e) => updateDetails({ logGroupName: e.target.value })}
                  placeholder="/aws/lambda/my-func"
                  error={errors.logGroupName}
                />
                <FieldError id="logGroupName-error" message={errors.logGroupName} />
              </div>
              <div>
                <Label>Retention (Days)</Label>
                <SelectInput
                  id="retentionDays"
                  value={String(d.retentionDays || 30)}
                  onChange={(e) => updateDetails({ retentionDays: Number(e.target.value) })}
                  options={[1, 3, 7, 14, 30, 60, 90, 180, 365].map(d => ({ value: String(d), label: `${d} days` }))}
                />
              </div>
            </div>
          </SectionCard>
        );

      case "ElastiCache":
        return (
          <SectionCard title="ElastiCache Settings" icon={<img src="/aws-icons/ElastiCache.png" alt="" className="h-4 w-4" />}>
            <div className="space-y-5">
              <div>
                <Label>Cluster ID</Label>
                <TextInput
                  id="clusterId"
                  value={d.clusterId || ""}
                  onChange={(e) => updateDetails({ clusterId: e.target.value })}
                  placeholder="my-redis-cluster"
                  error={errors.clusterId}
                />
                <FieldError id="clusterId-error" message={errors.clusterId} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Engine</Label>
                  <SelectInput
                    id="engine"
                    value={d.engine || "redis"}
                    onChange={(e) => updateDetails({ engine: e.target.value })}
                    options={[{ value: "redis", label: "Redis" }, { value: "memcached", label: "Memcached" }]}
                  />
                </div>
                <div>
                  <Label>Node Type</Label>
                  <TextInput
                    id="nodeType"
                    value={d.nodeType || "cache.t3.micro"}
                    onChange={(e) => updateDetails({ nodeType: e.target.value })}
                    placeholder="cache.t3.micro"
                  />
                </div>
              </div>
              <div>
                <Label>Number of Nodes</Label>
                <NumberInput
                  id="numCacheNodes"
                  value={d.numCacheNodes || 1}
                  onChange={(e) => updateDetails({ numCacheNodes: Number(e.target.value) })}
                  min={1}
                  max={20}
                />
              </div>
            </div>
          </SectionCard>
        );

      case "CloudFront":
        return (
          <SectionCard title="CloudFront Settings" icon={<img src="/aws-icons/CloudFront.png" alt="" className="h-4 w-4" />}>
            <div className="space-y-5">
              <div>
                <Label>Distribution Name</Label>
                <TextInput
                  id="distributionName"
                  value={d.distributionName || ""}
                  onChange={(e) => updateDetails({ distributionName: e.target.value })}
                  placeholder="my-cdn"
                />
              </div>
              <div>
                <Label>Origin Domain</Label>
                <TextInput
                  id="originDomain"
                  value={d.originDomain || ""}
                  onChange={(e) => updateDetails({ originDomain: e.target.value })}
                  placeholder="example.com"
                />
              </div>
              <div>
                <Label>Distribution ID (Optional)</Label>
                <TextInput
                  id="distributionId"
                  value={d.distributionId || ""}
                  onChange={(e) => updateDetails({ distributionId: e.target.value })}
                  placeholder="E1234567890"
                />
              </div>
              <div>
                <Label>Price Class</Label>
                <SelectInput
                  id="priceClass"
                  value={d.priceClass || "PriceClass_100"}
                  onChange={(e) => updateDetails({ priceClass: e.target.value })}
                  options={[
                    { value: "PriceClass_100", label: "North America / Europe" },
                    { value: "PriceClass_200", label: "+ Asia / Africa" },
                    { value: "PriceClass_All", label: "All Locations" },
                  ]}
                />
              </div>
              <div>
                <Checkbox
                  checked={d.enabled !== undefined ? d.enabled : true}
                  onChange={(e) => updateDetails({ enabled: e.target.checked })}
                  label="Enable Distribution"
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
                <Label>Secret ID</Label>
                <TextInput
                  id="secretId"
                  value={d.secretId || ""}
                  onChange={(e) => updateDetails({ secretId: e.target.value })}
                  placeholder="my-secret-id"
                />
              </div>
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
                  value={d.locationId || "nam5"}
                  onChange={(e) => updateDetails({ locationId: e.target.value })}
                  options={[
                    { value: "nam5", label: "nam5 (us-central multi-region)" },
                    { value: "us-central1", label: "us-central1" },
                    { value: "us-east1", label: "us-east1" },
                    { value: "europe-west1", label: "europe-west1" },
                  ]}
                  error={errors.locationId}
                />
                <FieldError id="locationId-error" message={errors.locationId} />
              </div>

              <div>
                <Label>Database Name</Label>
                <TextInput
                  id="databaseName"
                  value={d.databaseName || d.databaseId || "(default)"}
                  onChange={(e) => updateDetails({ databaseName: e.target.value, databaseId: e.target.value })}
                  placeholder="(default)"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Database name. Use "(default)" for the default database.
                </p>
              </div>
            </div>
          </SectionCard>
        );

      // Azure Services
      case "Azure Storage":
        return (
          <SectionCard
            title="Storage Account Settings"
            icon={<img src="/azure-icons/10086-icon-service-Storage-Accounts.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>Account Kind</Label>
                <SelectInput
                  id="accountKind"
                  value={d.accountKind || "StorageV2"}
                  onChange={(e) => updateDetails({ accountKind: e.target.value })}
                  options={[
                    { value: "StorageV2", label: "StorageV2 (General Purpose v2)" },
                    { value: "Storage", label: "Storage (General Purpose v1)" },
                    { value: "BlobStorage", label: "BlobStorage" },
                  ]}
                />
              </div>
              <div>
                <Label>SKU</Label>
                <SelectInput
                  id="sku"
                  value={d.sku || "Standard_LRS"}
                  onChange={(e) => updateDetails({ sku: e.target.value })}
                  options={[
                    { value: "Standard_LRS", label: "Standard_LRS (Locally Redundant)" },
                    { value: "Standard_GRS", label: "Standard_GRS (Geo-Redundant)" },
                    { value: "Standard_RAGRS", label: "Standard_RAGRS (Read-Access Geo-Redundant)" },
                    { value: "Premium_LRS", label: "Premium_LRS (Premium Locally Redundant)" },
                  ]}
                />
              </div>
              <div>
                <Label>Container Name (Optional)</Label>
                <TextInput
                  id="containerName"
                  value={d.containerName || ""}
                  onChange={(e) => updateDetails({ containerName: e.target.value })}
                  placeholder="uploads"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Optional blob container name. Leave empty to skip container creation.
                </p>
              </div>
            </div>
          </SectionCard>
        );

      case "Azure Service Bus":
        return (
          <SectionCard
            title="Service Bus Settings"
            icon={<img src="/azure-icons/10836-icon-service-Azure-Service-Bus.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>SKU</Label>
                <SelectInput
                  id="sku"
                  value={d.sku || "Basic"}
                  onChange={(e) => updateDetails({ sku: e.target.value })}
                  options={[
                    { value: "Basic", label: "Basic" },
                    { value: "Standard", label: "Standard" },
                    { value: "Premium", label: "Premium" },
                  ]}
                />
              </div>
              <div>
                <Label>Queue Name</Label>
                <TextInput
                  id="queueName"
                  value={d.queueName || ""}
                  onChange={(e) => updateDetails({ queueName: e.target.value })}
                  placeholder="tasks"
                  error={errors.queueName}
                />
                <FieldError id="queueName-error" message={errors.queueName} />
              </div>
              <div>
                <Checkbox
                  checked={!!d.partition}
                  onChange={(e) => updateDetails({ partition: e.target.checked })}
                  label="Enable Partitioning"
                />
              </div>
            </div>
          </SectionCard>
        );

      case "Azure Container Apps":
        return (
          <SectionCard
            title="Container App Settings"
            icon={<img src="/azure-icons/02989-icon-service-Container-Apps-Environments.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>Container Image</Label>
                <TextInput
                  id="image"
                  value={d.image || "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"}
                  onChange={(e) => updateDetails({ image: e.target.value })}
                  placeholder="mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
                  error={errors.image}
                />
                <FieldError id="image-error" message={errors.image} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CPU</Label>
                  <NumberInput
                    id="cpu"
                    value={d.cpu || 0.25}
                    onChange={(e) => updateDetails({ cpu: parseFloat(e.target.value) || 0.25 })}
                    min={0.25}
                    max={4}
                    step={0.25}
                  />
                </div>
                <div>
                  <Label>Memory</Label>
                  <SelectInput
                    id="memory"
                    value={d.memory || "0.5Gi"}
                    onChange={(e) => updateDetails({ memory: e.target.value })}
                    options={[
                      { value: "0.5Gi", label: "0.5 Gi" },
                      { value: "1Gi", label: "1 Gi" },
                      { value: "2Gi", label: "2 Gi" },
                      { value: "4Gi", label: "4 Gi" },
                    ]}
                  />
                </div>
              </div>
              <div>
                <Label>Environment Variables (JSON)</Label>
                <textarea
                  id="env"
                  value={typeof d.env === "object" ? JSON.stringify(d.env, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      updateDetails({ env: parsed });
                    } catch {
                      updateDetails({ env: {} });
                    }
                  }}
                  rows={4}
                  className={baseInputClass(undefined) + " resize-none font-mono text-xs"}
                  placeholder='{"LOG_LEVEL": "info", "API_KEY": "value"}'
                />
                <p className="mt-1 text-xs text-slate-500">
                  Enter environment variables as JSON object.
                </p>
              </div>
            </div>
          </SectionCard>
        );

      case "Azure Virtual Machine":
        return (
          <SectionCard
            title="Virtual Machine Settings"
            icon={<img src="/azure-icons/10021-icon-service-Virtual-Machine.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>VM Size</Label>
                <TextInput
                  id="vmSize"
                  value={d.vmSize || "Standard_B1s"}
                  onChange={(e) => updateDetails({ vmSize: e.target.value })}
                  placeholder="Standard_B1s"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Common sizes: Standard_B1s, Standard_B2s, Standard_D2s_v3
                </p>
              </div>
              <div>
                <Label>OS Type</Label>
                <SelectInput
                  id="osType"
                  value={d.osType || "Linux"}
                  onChange={(e) => updateDetails({ osType: e.target.value })}
                  options={[
                    { value: "Linux", label: "Linux" },
                    { value: "Windows", label: "Windows" },
                  ]}
                />
              </div>
              <div>
                <Label>Admin Username</Label>
                <TextInput
                  id="adminUsername"
                  value={d.adminUsername || "azureuser"}
                  onChange={(e) => updateDetails({ adminUsername: e.target.value })}
                  placeholder="azureuser"
                  error={errors.adminUsername}
                />
                <FieldError id="adminUsername-error" message={errors.adminUsername} />
              </div>
              <div>
                <Label>Admin Password</Label>
                <TextInput
                  id="adminPassword"
                  type="password"
                  value={d.adminPassword || ""}
                  onChange={(e) => updateDetails({ adminPassword: e.target.value })}
                  placeholder="Secure password"
                  error={errors.adminPassword}
                />
                <FieldError id="adminPassword-error" message={errors.adminPassword} />
                <p className="mt-1 text-xs text-slate-500">
                  Password must meet Azure requirements (12+ chars, complexity).
                </p>
              </div>
            </div>
          </SectionCard>
        );

      case "Azure Function App":
        return (
          <SectionCard
            title="Function App Settings"
            icon={<img src="/azure-icons/10029-icon-service-Function-Apps.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>SKU</Label>
                <SelectInput
                  id="sku"
                  value={d.sku || "Y1"}
                  onChange={(e) => updateDetails({ sku: e.target.value })}
                  options={[
                    { value: "Y1", label: "Y1 (Consumption Plan)" },
                    { value: "EP1", label: "EP1 (Premium Plan)" },
                    { value: "EP2", label: "EP2 (Premium Plan)" },
                    { value: "EP3", label: "EP3 (Premium Plan)" },
                  ]}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Y1 is the Consumption plan (pay-per-use). EP plans are Premium (dedicated).
                </p>
              </div>
              <div>
                <Label>Runtime</Label>
                <SelectInput
                  id="runtime"
                  value={d.runtime || "python"}
                  onChange={(e) => updateDetails({ runtime: e.target.value })}
                  options={[
                    { value: "python", label: "Python" },
                    { value: "node", label: "Node.js" },
                    { value: "dotnet", label: ".NET" },
                  ]}
                />
              </div>
              <div>
                <Label>Functions Version</Label>
                <SelectInput
                  id="functionsVersion"
                  value={d.functionsVersion || "~4"}
                  onChange={(e) => updateDetails({ functionsVersion: e.target.value })}
                  options={[
                    { value: "~4", label: "~4" },
                    { value: "~3", label: "~3" },
                  ]}
                />
              </div>
            </div>
          </SectionCard>
        );

      case "Azure SQL Database":
        return (
          <SectionCard
            title="SQL Database Settings"
            icon={<img src="/azure-icons/10130-icon-service-SQL-Database.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>Server Name</Label>
                <TextInput
                  id="serverName"
                  value={d.serverName || ""}
                  onChange={(e) => updateDetails({ serverName: e.target.value })}
                  placeholder="my-sql-server"
                />
              </div>
              <div>
                <Label>Database Name</Label>
                <TextInput
                  id="databaseName"
                  value={d.databaseName || ""}
                  onChange={(e) => updateDetails({ databaseName: e.target.value })}
                  placeholder="appdb"
                  error={errors.databaseName}
                />
                <FieldError id="databaseName-error" message={errors.databaseName} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Admin Login</Label>
                  <TextInput
                    id="adminLogin"
                    value={d.adminLogin || "sqladmin"}
                    onChange={(e) => updateDetails({ adminLogin: e.target.value })}
                    placeholder="sqladmin"
                  />
                </div>
                <div>
                  <Label>Admin Password</Label>
                  <TextInput
                    id="adminPassword"
                    type="password"
                    value={d.adminPassword || ""}
                    onChange={(e) => updateDetails({ adminPassword: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <div>
                <Label>Service Tier</Label>
                <SelectInput
                  id="serviceTier"
                  value={d.sku?.name || d.serviceTier || "S0"}
                  onChange={(e) => updateDetails({ sku: { name: e.target.value, tier: "Standard" }, serviceTier: e.target.value })}
                  options={[
                    { value: "Basic", label: "Basic" },
                    { value: "S0", label: "S0 (Standard)" },
                    { value: "S1", label: "S1 (Standard)" },
                    { value: "S2", label: "S2 (Standard)" },
                    { value: "S3", label: "S3 (Standard)" },
                    { value: "P1", label: "P1 (Premium)" },
                    { value: "P2", label: "P2 (Premium)" },
                    { value: "P4", label: "P4 (Premium)" },
                  ]}
                />
              </div>
            </div>
          </SectionCard>
        );

      case "Azure Cosmos DB":
        return (
          <SectionCard
            title="Cosmos DB Settings"
            icon={<img src="/azure-icons/10121-icon-service-Azure-Cosmos-DB.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>Kind</Label>
                <SelectInput
                  id="kind"
                  value={d.kind || "GlobalDocumentDB"}
                  onChange={(e) => updateDetails({ kind: e.target.value })}
                  options={[
                    { value: "GlobalDocumentDB", label: "GlobalDocumentDB" },
                    { value: "MongoDB", label: "MongoDB" },
                    { value: "Table", label: "Table" },
                  ]}
                />
              </div>
              <div>
                <Label>Database Name</Label>
                <TextInput
                  id="databaseName"
                  value={d.databaseName || ""}
                  onChange={(e) => updateDetails({ databaseName: e.target.value })}
                  placeholder="appdb"
                  error={errors.databaseName}
                />
                <FieldError id="databaseName-error" message={errors.databaseName} />
              </div>
              <div>
                <Label>Container Name</Label>
                <TextInput
                  id="containerName"
                  value={d.containerName || ""}
                  onChange={(e) => updateDetails({ containerName: e.target.value })}
                  placeholder="users"
                  error={errors.containerName}
                />
                <FieldError id="containerName-error" message={errors.containerName} />
              </div>
              <div>
                <Label>Partition Key</Label>
                <TextInput
                  id="partitionKey"
                  value={d.partitionKey || "/id"}
                  onChange={(e) => updateDetails({ partitionKey: e.target.value })}
                  placeholder="/id"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Partition key path (e.g., "/id", "/userId").
                </p>
              </div>
            </div>
          </SectionCard>
        );

      case "Azure API Management":
        return (
          <SectionCard
            title="API Management Settings"
            icon={<img src="/azure-icons/10042-icon-service-API-Management-Services.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>Publisher Name</Label>
                <TextInput
                  id="publisherName"
                  value={d.publisherName || "Contoso"}
                  onChange={(e) => updateDetails({ publisherName: e.target.value })}
                  placeholder="Contoso"
                  error={errors.publisherName}
                />
                <FieldError id="publisherName-error" message={errors.publisherName} />
              </div>
              <div>
                <Label>Publisher Email</Label>
                <TextInput
                  id="publisherEmail"
                  type="email"
                  value={d.publisherEmail || "admin@contoso.com"}
                  onChange={(e) => updateDetails({ publisherEmail: e.target.value })}
                  placeholder="admin@contoso.com"
                  error={errors.publisherEmail}
                />
                <FieldError id="publisherEmail-error" message={errors.publisherEmail} />
              </div>
              <div>
                <Label>SKU</Label>
                <SelectInput
                  id="sku"
                  value={d.sku || "Developer"}
                  onChange={(e) => updateDetails({ sku: e.target.value })}
                  options={[
                    { value: "Developer", label: "Developer" },
                    { value: "Basic", label: "Basic" },
                    { value: "Standard", label: "Standard" },
                    { value: "Premium", label: "Premium" },
                    { value: "Consumption", label: "Consumption" },
                  ]}
                />
              </div>
            </div>
          </SectionCard>
        );

      case "Azure Key Vault":
        return (
          <SectionCard
            title="Key Vault Settings"
            icon={<img src="/azure-icons/10245-icon-service-Key-Vaults.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>Vault Name</Label>
                <TextInput
                  id="vaultName"
                  value={d.vaultName || ""}
                  onChange={(e) => updateDetails({ vaultName: e.target.value })}
                  placeholder="my-key-vault"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Must be 3-24 characters, alphanumeric and hyphens only. Globally unique.
                </p>
              </div>
              <div>
                <Label>Tenant ID</Label>
                <TextInput
                  id="tenantId"
                  value={d.tenantId || ""}
                  onChange={(e) => updateDetails({ tenantId: e.target.value })}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  error={errors.tenantId}
                />
                <FieldError id="tenantId-error" message={errors.tenantId} />
                <p className="mt-1 text-xs text-slate-500">
                  Azure tenant ID (UUID format). Required for Key Vault.
                </p>
              </div>
            </div>
          </SectionCard>
        );

      case "Azure Application Insights":
        return (
          <SectionCard
            title="Application Insights Settings"
            icon={<img src="/azure-icons/00012-icon-service-Application-Insights.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>Application Type</Label>
                <SelectInput
                  id="applicationType"
                  value={d.applicationType || "web"}
                  onChange={(e) => updateDetails({ applicationType: e.target.value })}
                  options={[
                    { value: "web", label: "Web" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>
              <div>
                <Label>Ingestion Mode</Label>
                <SelectInput
                  id="ingestionMode"
                  value={d.ingestionMode || "ApplicationInsights"}
                  onChange={(e) => updateDetails({ ingestionMode: e.target.value })}
                  options={[
                    { value: "ApplicationInsights", label: "ApplicationInsights" },
                    { value: "LogAnalytics", label: "LogAnalytics" },
                  ]}
                />
              </div>
            </div>
          </SectionCard>
        );

      case "Azure Virtual Network":
        return (
          <SectionCard
            title="Virtual Network Settings"
            icon={<img src="/azure-icons/10061-icon-service-Virtual-Networks.png" alt="" className="h-4 w-4" />}
          >
            <div className="space-y-5">
              <div>
                <Label>Address Spaces (JSON Array)</Label>
                <textarea
                  id="addressSpaces"
                  value={Array.isArray(d.addressSpaces) ? JSON.stringify(d.addressSpaces, null, 2) : '["10.0.0.0/16"]'}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      if (Array.isArray(parsed)) {
                        updateDetails({ addressSpaces: parsed });
                      }
                    } catch {
                      updateDetails({ addressSpaces: ["10.0.0.0/16"] });
                    }
                  }}
                  rows={3}
                  className={baseInputClass(undefined) + " resize-none font-mono text-xs"}
                  placeholder='["10.0.0.0/16"]'
                />
                <p className="mt-1 text-xs text-slate-500">
                  Array of CIDR blocks (e.g., ["10.0.0.0/16"]).
                </p>
              </div>
              <div>
                <Label>Subnets (JSON Array)</Label>
                <textarea
                  id="subnets"
                  value={Array.isArray(d.subnets) ? JSON.stringify(d.subnets, null, 2) : '[{"name": "default", "addressPrefix": "10.0.1.0/24"}]'}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      if (Array.isArray(parsed)) {
                        updateDetails({ subnets: parsed });
                      }
                    } catch {
                      updateDetails({ subnets: [{ name: "default", addressPrefix: "10.0.1.0/24" }] });
                    }
                  }}
                  rows={6}
                  className={baseInputClass(undefined) + " resize-none font-mono text-xs"}
                  placeholder='[{"name": "subnet1", "addressPrefix": "10.0.1.0/24"}]'
                />
                <p className="mt-1 text-xs text-slate-500">
                  Array of subnet objects with "name" and "addressPrefix" properties.
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
                      <Label>Region *</Label>
                      {isAWSService ? (
                        <RegionSelect
                          id="baseRegionTop"
                          value={config.region}
                          onValueChange={(value) => setConfig({ ...config, region: value })}
                          options={AWS_REGIONS_OPTIONS}
                          error={errors.region}
                          placeholder="Select region"
                        />
                      ) : isGCPService ? (
                        <RegionSelect
                          id="baseRegionTop"
                          value={config.region}
                          onValueChange={(value) => setConfig({ ...config, region: value })}
                          options={GCP_REGIONS_OPTIONS}
                          error={errors.region}
                          placeholder="Select region"
                        />
                      ) : isAzureService ? (
                        <RegionSelect
                          id="baseRegionTop"
                          value={config.region}
                          onValueChange={(value) => setConfig({ ...config, region: value })}
                          options={AZURE_REGIONS_OPTIONS}
                          error={errors.region}
                          placeholder="Select region"
                        />
                      ) : (
                        <TextInput
                          id="baseRegionTop"
                          value={config.region}
                          onChange={(e) => setConfig({ ...config, region: e.target.value })}
                          placeholder="e.g., us-east-1"
                          error={errors.region}
                        />
                      )}
                      <FieldError id="region-error" message={errors.region} />
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