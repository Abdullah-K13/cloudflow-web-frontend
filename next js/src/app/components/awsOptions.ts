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

// AWS Regions organized by category
export const AWS_REGIONS = [
  // 🌍 Common AWS Regions
  "us-east-1",      // US East (N. Virginia)
  "us-east-2",      // US East (Ohio)
  "us-west-1",      // US West (N. California)
  "us-west-2",      // US West (Oregon)
  "ca-central-1",   // Canada (Central)
  "ca-west-1",      // Canada West (Calgary)
  "mx-central-1",   // Mexico (Central)
  "sa-east-1",      // South America (São Paulo)
  "af-south-1",     // Africa (Cape Town)
  // 🌏 Asia-Pacific / Middle East
  "ap-south-1",     // Asia Pacific (Mumbai)
  "ap-south-2",     // Asia Pacific (Hyderabad)
  "ap-east-1",      // Asia Pacific (Hong Kong)
  "ap-northeast-1", // Asia Pacific (Tokyo)
  "ap-northeast-2", // Asia Pacific (Seoul)
  "ap-northeast-3", // Asia Pacific (Osaka)
  "ap-southeast-1", // Asia Pacific (Singapore)
  "ap-southeast-2", // Asia Pacific (Sydney)
  "ap-southeast-3", // Asia Pacific (Jakarta)
  "ap-southeast-5", // Asia Pacific (Malaysia)
  "me-south-1",     // Middle East (Bahrain)
  "me-central-1",   // Middle East (UAE)
  // 🇪🇺 Europe Regions
  "eu-west-1",      // EU (Ireland)
  "eu-west-2",      // EU (London)
  "eu-west-3",      // EU (Paris)
  "eu-central-1",   // EU (Frankfurt)
  "eu-south-1",     // EU (Milan)
  "eu-north-1",     // EU (Stockholm)
  // 🛡 Gov-Cloud / Special Regions
  "us-gov-west-1",  // AWS GovCloud (US-West)
  "us-gov-east-1",  // AWS GovCloud (US-East)
];

// Helper function to get region display label
export const getRegionLabel = (regionCode: string): string => {
  const regionLabels: Record<string, string> = {
    "us-east-1": "US East (N. Virginia)",
    "us-east-2": "US East (Ohio)",
    "us-west-1": "US West (N. California)",
    "us-west-2": "US West (Oregon)",
    "ca-central-1": "Canada (Central)",
    "ca-west-1": "Canada West (Calgary)",
    "mx-central-1": "Mexico (Central)",
    "sa-east-1": "South America (São Paulo)",
    "af-south-1": "Africa (Cape Town)",
    "ap-south-1": "Asia Pacific (Mumbai)",
    "ap-south-2": "Asia Pacific (Hyderabad)",
    "ap-east-1": "Asia Pacific (Hong Kong)",
    "ap-northeast-1": "Asia Pacific (Tokyo)",
    "ap-northeast-2": "Asia Pacific (Seoul)",
    "ap-northeast-3": "Asia Pacific (Osaka)",
    "ap-southeast-1": "Asia Pacific (Singapore)",
    "ap-southeast-2": "Asia Pacific (Sydney)",
    "ap-southeast-3": "Asia Pacific (Jakarta)",
    "ap-southeast-5": "Asia Pacific (Malaysia)",
    "me-south-1": "Middle East (Bahrain)",
    "me-central-1": "Middle East (UAE)",
    "eu-west-1": "EU (Ireland)",
    "eu-west-2": "EU (London)",
    "eu-west-3": "EU (Paris)",
    "eu-central-1": "EU (Frankfurt)",
    "eu-south-1": "EU (Milan)",
    "eu-north-1": "EU (Stockholm)",
    "us-gov-west-1": "AWS GovCloud (US-West)",
    "us-gov-east-1": "AWS GovCloud (US-East)",
  };
  return regionLabels[regionCode] || regionCode;
};

// Format regions for SelectInput dropdown
export const AWS_REGIONS_OPTIONS = AWS_REGIONS.map((region) => ({
  value: region,
  label: `${region} - ${getRegionLabel(region)}`,
}));

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


// ---- GCP Regions ----
export const GCP_REGIONS = [
  // 🌍 North America
  "us-west1",      // The Dalles, Oregon, USA
  "us-west2",      // Los Angeles, California, USA
  "us-west3",      // Salt Lake City, Utah, USA
  "us-west4",      // Las Vegas, Nevada, USA
  "us-central1",   // Council Bluffs, Iowa, USA
  "us-east1",      // South Carolina, USA
  "us-east4",      // Northern Virginia, USA
  "us-east5",      // Columbus, Ohio, USA
  "us-south1",     // Dallas, Texas, USA
  "northamerica-northeast1",  // Montréal, Québec, Canada
  "northamerica-northeast2",  // Toronto, Canada
  // 🌏 Asia-Pacific
  "asia-east1",    // Changhua County, Taiwan
  "asia-east2",    // Hong Kong SAR
  "asia-northeast1",  // Tokyo, Japan
  "asia-northeast2",  // Osaka, Japan
  "asia-northeast3",  // Seoul, South Korea
  "asia-south1",   // Mumbai, India
  "asia-south2",   // Delhi, India
  "asia-southeast1",  // Jurong West, Singapore
  "asia-southeast2",  // Jakarta, Indonesia
  "australia-southeast1",  // Sydney, Australia
  "australia-southeast2",  // Melbourne, Australia
  // 🇪🇺 Europe
  "europe-west1",  // St. Ghislain, Belgium (western Europe)
  "europe-west2",  // London, United Kingdom
  "europe-west3",  // Frankfurt, Germany
  "europe-west4",  // Eemshaven, Netherlands
  "europe-west6",  // Zürich, Switzerland
  "europe-north1", // Hamina, Finland (Nordic Europe)
  // 🌎 South America & Africa
  "southamerica-east1",  // São Paulo, Brazil
  "africa-south1",      // Johannesburg, South Africa
];

// Helper function to get GCP region display label
export const getGCPRegionLabel = (regionCode: string): string => {
  const regionLabels: Record<string, string> = {
    "us-west1": "The Dalles, Oregon, USA",
    "us-west2": "Los Angeles, California, USA",
    "us-west3": "Salt Lake City, Utah, USA",
    "us-west4": "Las Vegas, Nevada, USA",
    "us-central1": "Council Bluffs, Iowa, USA",
    "us-east1": "South Carolina, USA",
    "us-east4": "Northern Virginia, USA",
    "us-east5": "Columbus, Ohio, USA",
    "us-south1": "Dallas, Texas, USA",
    "northamerica-northeast1": "Montréal, Québec, Canada",
    "northamerica-northeast2": "Toronto, Canada",
    "asia-east1": "Changhua County, Taiwan",
    "asia-east2": "Hong Kong SAR",
    "asia-northeast1": "Tokyo, Japan",
    "asia-northeast2": "Osaka, Japan",
    "asia-northeast3": "Seoul, South Korea",
    "asia-south1": "Mumbai, India",
    "asia-south2": "Delhi, India",
    "asia-southeast1": "Jurong West, Singapore",
    "asia-southeast2": "Jakarta, Indonesia",
    "australia-southeast1": "Sydney, Australia",
    "australia-southeast2": "Melbourne, Australia",
    "europe-west1": "St. Ghislain, Belgium (western Europe)",
    "europe-west2": "London, United Kingdom",
    "europe-west3": "Frankfurt, Germany",
    "europe-west4": "Eemshaven, Netherlands",
    "europe-west6": "Zürich, Switzerland",
    "europe-north1": "Hamina, Finland (Nordic Europe)",
    "southamerica-east1": "São Paulo, Brazil",
    "africa-south1": "Johannesburg, South Africa",
  };
  return regionLabels[regionCode] || regionCode;
};

// Format GCP regions for SelectInput dropdown
export const GCP_REGIONS_OPTIONS = GCP_REGIONS.map((region) => ({
  value: region,
  label: `${region} - ${getGCPRegionLabel(region)}`,
}));

// ---- Azure Regions ----
export const AZURE_REGIONS = [
  // 🌍 Americas
  "eastus",           // East US
  "eastus2",         // East US 2
  "westus",          // West US
  "westus2",         // West US 2
  "westus3",         // West US 3
  "centralus",       // Central US
  "southcentralus",  // South Central US
  "northcentralus",  // North Central US
  "brazilsouth",     // Brazil South
  // 🇪🇺 Europe
  "westeurope",      // West Europe
  "northeurope",     // North Europe
  "francecentral",   // France Central
  "germanywestcentral",  // Germany West Central
  "uksouth",         // UK South
  "ukwest",          // UK West
  // 🌏 Asia Pacific
  "eastasia",        // East Asia
  "southeastasia",   // Southeast Asia
  "australiaeast",   // Australia East
  "australiasoutheast",  // Australia Southeast
  "centralindia",    // Central India
  "japaneast",       // Japan East
  "japanwest",       // Japan West
  "koreacentral",    // Korea Central
  "koreasouth",      // Korea South
  // 🌍 Middle East & Africa
  "uaenorth",        // UAE North
  "southafricanorth",  // South Africa North
];

// Helper function to get Azure region display label
export const getAzureRegionLabel = (regionCode: string): string => {
  const regionLabels: Record<string, string> = {
    "eastus": "East US",
    "eastus2": "East US 2",
    "westus": "West US",
    "westus2": "West US 2",
    "westus3": "West US 3",
    "centralus": "Central US",
    "southcentralus": "South Central US",
    "northcentralus": "North Central US",
    "brazilsouth": "Brazil South",
    "westeurope": "West Europe",
    "northeurope": "North Europe",
    "francecentral": "France Central",
    "germanywestcentral": "Germany West Central",
    "uksouth": "UK South",
    "ukwest": "UK West",
    "eastasia": "East Asia",
    "southeastasia": "Southeast Asia",
    "australiaeast": "Australia East",
    "australiasoutheast": "Australia Southeast",
    "centralindia": "Central India",
    "japaneast": "Japan East",
    "japanwest": "Japan West",
    "koreacentral": "Korea Central",
    "koreasouth": "Korea South",
    "uaenorth": "UAE North",
    "southafricanorth": "South Africa North",
  };
  return regionLabels[regionCode] || regionCode;
};

// Format Azure regions for SelectInput dropdown
export const AZURE_REGIONS_OPTIONS = AZURE_REGIONS.map((region) => ({
  value: region,
  label: `${region} - ${getAzureRegionLabel(region)}`,
}));

// -------- Helpers --------
export const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export const snapToClosest = (val: number, list: number[]) =>
  list.reduce((prev, curr) => (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev));
