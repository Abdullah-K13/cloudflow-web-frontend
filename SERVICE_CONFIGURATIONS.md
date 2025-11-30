# CloudFlow Service Configurations Guide

This document lists all mandatory and optional configuration properties for all supported services across AWS, Azure, and GCP.

## Table of Contents

- [AWS Services](#aws-services)
- [Azure Services](#azure-services)
- [GCP Services](#gcp-services)

---

## AWS Services

### `aws.s3` - S3 Bucket

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `bucketName` (string): Custom bucket name (must be globally unique)
- `versioning` (boolean): Enable versioning (default: `true`)
- `eventBridge` (boolean): Enable EventBridge notifications (default: `false`)
- `region` (string): AWS region for the bucket

**Example:**
```json
{
  "id": "s3-1",
  "kind": "aws.s3",
  "name": "my-bucket",
  "props": {
    "bucketName": "my-unique-bucket-name",
    "versioning": true,
    "eventBridge": false
  }
}
```

---

### `aws.lambda` - Lambda Function

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `runtime` (string): Lambda runtime (default: `"python3.12"`)
  - Options: `"python3.12"`, `"python3.11"`, `"python3.10"`
- `handler` (string): Function handler (default: `"app.lambda_handler"`)
- `codeUri` (string): Path to function code (default: `"src/processor"`)
- `memory` (integer): Memory in MB (default: `256`, range: 128-10240)
- `timeout` (integer): Timeout in seconds (default: `30`, max: 900)
- `environment` (object): Environment variables (default: `{}`)

**Example:**
```json
{
  "id": "lambda-1",
  "kind": "aws.lambda",
  "name": "my-function",
  "props": {
    "runtime": "python3.12",
    "handler": "app.lambda_handler",
    "codeUri": "src/processor",
    "memory": 512,
    "timeout": 60,
    "environment": {
      "LOG_LEVEL": "info"
    }
  }
}
```

---

### `aws.sqs` - SQS Queue

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `queueName` (string): Custom queue name
- `visibilityTimeout` (integer): Visibility timeout in seconds (default: `60`)
- `dlq` (object): Dead Letter Queue configuration
  - `maxReceiveCount` (integer): Max receive count before moving to DLQ (default: `5`)

**Example:**
```json
{
  "id": "sqs-1",
  "kind": "aws.sqs",
  "name": "my-queue",
  "props": {
    "queueName": "my-queue-name",
    "visibilityTimeout": 300,
    "dlq": {
      "maxReceiveCount": 3
    }
  }
}
```

---

### `aws.sns` - SNS Topic

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `topicName` (string): Custom topic name
- `displayName` (string): Display name for the topic

**Example:**
```json
{
  "id": "sns-1",
  "kind": "aws.sns",
  "name": "my-topic",
  "props": {
    "topicName": "my-topic-name",
    "displayName": "My Topic"
  }
}
```

---

### `aws.dynamodb` - DynamoDB Table

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `tableName` (string): Custom table name
- `partitionKey` (string): Partition key attribute name (default: `"pk"`)
- `sortKey` (string): Sort key attribute name (optional)
- `billing` (string): Billing mode (default: `"PAY_PER_REQUEST"`)
  - Options: `"PAY_PER_REQUEST"`, `"PROVISIONED"`
- `stream` (boolean): Enable DynamoDB Streams (default: `true`)
- `rcu` (integer): Read capacity units (required if `billing` is `"PROVISIONED"`)
- `wcu` (integer): Write capacity units (required if `billing` is `"PROVISIONED"`)

**Example:**
```json
{
  "id": "dynamodb-1",
  "kind": "aws.dynamodb",
  "name": "my-table",
  "props": {
    "tableName": "my-table-name",
    "partitionKey": "id",
    "sortKey": "timestamp",
    "billing": "PROVISIONED",
    "rcu": 10,
    "wcu": 10,
    "stream": true
  }
}
```

---

### `aws.apigw` - API Gateway

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `restApiName` (string): REST API name
- `description` (string): API description
- `deploymentStage` (string): Deployment stage name (default: `"prod"`)

**Example:**
```json
{
  "id": "apigw-1",
  "kind": "aws.apigw",
  "name": "my-api",
  "props": {
    "restApiName": "my-rest-api",
    "description": "My REST API"
  }
}
```

---

### `aws.events.rule` - EventBridge Rule

**Mandatory:**
- `pattern` (object): Event pattern to match

**Optional:**
- `ruleName` (string): Custom rule name
- `schedule` (string): Schedule expression (e.g., `"rate(5 minutes)"`)
- `targets` (array): Target configurations

**Example:**
```json
{
  "id": "events-1",
  "kind": "aws.events.rule",
  "name": "my-rule",
  "props": {
    "pattern": {
      "source": ["aws.s3"],
      "detail-type": ["Object Created"]
    }
  }
}
```

---

### `aws.sfn` - Step Functions

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `stateMachineName` (string): State machine name
- `definition` (object): State machine definition (default: simple pass-through)

**Example:**
```json
{
  "id": "sfn-1",
  "kind": "aws.sfn",
  "name": "my-state-machine",
  "props": {
    "stateMachineName": "my-state-machine"
  }
}
```

---

### `aws.kinesis` - Kinesis Data Stream

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `streamName` (string): Stream name
- `shards` (integer): Number of shards (default: `1`)

**Example:**
```json
{
  "id": "kinesis-1",
  "kind": "aws.kinesis",
  "name": "my-stream",
  "props": {
    "streamName": "my-stream-name",
    "shards": 2
  }
}
```

---

### `aws.ec2` - EC2 Instance

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `instanceType` (string): EC2 instance type (default: `"t3.micro"`)
  - Examples: `"t3.micro"`, `"t3.small"`, `"t3.medium"`, `"m5.large"`, etc.
- `instanceName` (string): Instance name
- `ami` (string): Custom AMI ID
- `keyName` (string): SSH key pair name
- `securityGroups` (array): Security group IDs

**Example:**
```json
{
  "id": "ec2-1",
  "kind": "aws.ec2",
  "name": "my-instance",
  "props": {
    "instanceType": "t3.medium",
    "instanceName": "my-ec2-instance"
  }
}
```

---

### `aws.rds` - RDS Database

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `instanceClass` (string): DB instance class (default: `"db.t3.micro"`)
  - Examples: `"db.t3.micro"`, `"db.t3.small"`, `"db.m5.large"`, etc.
- `allocatedStorage` (integer): Storage in GB (default: `20`)
- `engine` (string): Database engine (default: `"postgres"`)
- `engineVersion` (string): Engine version (default: `"16.3"`)
- `instanceIdentifier` (string): DB instance identifier
- `masterUsername` (string): Master username (default: `"admin"`)
- `masterPassword` (string): Master password (required for production)

**Example:**
```json
{
  "id": "rds-1",
  "kind": "aws.rds",
  "name": "my-database",
  "props": {
    "instanceClass": "db.t3.small",
    "allocatedStorage": 100,
    "engine": "postgres",
    "engineVersion": "16.3",
    "instanceIdentifier": "my-db-instance"
  }
}
```

---

### `aws.ecs` - ECS Fargate Service

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `clusterName` (string): ECS cluster name
- `serviceName` (string): ECS service name
- `taskDefinition` (object): Task definition configuration
  - `cpu` (string): CPU units (e.g., `"256"`, `"512"`)
  - `memory` (string): Memory in MB (e.g., `"512"`, `"1024"`)
  - `image` (string): Container image URI
- `desiredCount` (integer): Desired number of tasks (default: `1`)

**Example:**
```json
{
  "id": "ecs-1",
  "kind": "aws.ecs",
  "name": "my-service",
  "props": {
    "clusterName": "my-cluster",
    "serviceName": "my-ecs-service",
    "taskDefinition": {
      "cpu": "256",
      "memory": "512",
      "image": "nginx:latest"
    },
    "desiredCount": 2
  }
}
```

---

### `aws.ecr` - ECR Repository

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `repositoryName` (string): Repository name
- `imageTagMutability` (string): Image tag mutability (default: `"MUTABLE"`)
  - Options: `"MUTABLE"`, `"IMMUTABLE"`
- `scanOnPush` (boolean): Enable image scanning on push (default: `false`)

**Example:**
```json
{
  "id": "ecr-1",
  "kind": "aws.ecr",
  "name": "my-repo",
  "props": {
    "repositoryName": "my-ecr-repo",
    "imageTagMutability": "IMMUTABLE",
    "scanOnPush": true
  }
}
```

---

### `aws.secretsmanager` - Secrets Manager

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `secretName` (string): Secret name
- `description` (string): Secret description
- `secretString` (string): Secret value (JSON string)

**Example:**
```json
{
  "id": "secrets-1",
  "kind": "aws.secretsmanager",
  "name": "my-secret",
  "props": {
    "secretName": "my-secret-name",
    "description": "My application secret",
    "secretString": "{\"username\":\"admin\",\"password\":\"secret123\"}"
  }
}
```

---

### `aws.cognito` - Cognito User Pool

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `userPoolName` (string): User pool name
- `autoVerifiedAttributes` (array): Auto-verified attributes (e.g., `["email"]`)
- `passwordPolicy` (object): Password policy configuration

**Example:**
```json
{
  "id": "cognito-1",
  "kind": "aws.cognito",
  "name": "my-user-pool",
  "props": {
    "userPoolName": "my-user-pool",
    "autoVerifiedAttributes": ["email"]
  }
}
```

---

### `aws.vpc` - Virtual Private Cloud

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `cidr` (string): VPC CIDR block (default: `"10.0.0.0/16"`)
- `enableDnsHostnames` (boolean): Enable DNS hostnames (default: `true`)
- `enableDnsSupport` (boolean): Enable DNS support (default: `true`)
- `subnets` (array): Subnet configurations

**Example:**
```json
{
  "id": "vpc-1",
  "kind": "aws.vpc",
  "name": "my-vpc",
  "props": {
    "cidr": "10.0.0.0/16",
    "enableDnsHostnames": true,
    "enableDnsSupport": true
  }
}
```

---

### `aws.cloudwatch` - CloudWatch Log Group

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `logGroupName` (string): Log group name
- `retentionInDays` (integer): Log retention in days (default: `7`)

**Example:**
```json
{
  "id": "cloudwatch-1",
  "kind": "aws.cloudwatch",
  "name": "my-log-group",
  "props": {
    "logGroupName": "my-log-group",
    "retentionInDays": 30
  }
}
```

---

### `aws.elasticache` - ElastiCache Redis

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `clusterName` (string): Cluster name
- `nodeType` (string): Node type (default: `"cache.t3.micro"`)
- `numCacheNodes` (integer): Number of cache nodes (default: `1`)
- `engine` (string): Cache engine (default: `"redis"`)

**Example:**
```json
{
  "id": "elasticache-1",
  "kind": "aws.elasticache",
  "name": "my-cache",
  "props": {
    "clusterName": "my-redis-cluster",
    "nodeType": "cache.t3.small",
    "numCacheNodes": 2,
    "engine": "redis"
  }
}
```

---

### `aws.cloudfront` - CloudFront Distribution

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `distributionName` (string): Distribution name
- `originDomain` (string): Origin domain name
- `enabled` (boolean): Enable distribution (default: `true`)
- `defaultCacheBehavior` (object): Default cache behavior configuration

**Example:**
```json
{
  "id": "cloudfront-1",
  "kind": "aws.cloudfront",
  "name": "my-distribution",
  "props": {
    "distributionName": "my-cdn",
    "originDomain": "example.com",
    "enabled": true
  }
}
```

---

### `aws.pipes` - EventBridge Pipes

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `pipeName` (string): Pipe name
- `source` (string): Source ARN
- `target` (string): Target ARN
- `enrichment` (string): Enrichment ARN (optional)

**Example:**
```json
{
  "id": "pipes-1",
  "kind": "aws.pipes",
  "name": "my-pipe",
  "props": {
    "pipeName": "my-event-pipe",
    "source": "arn:aws:kinesis:...",
    "target": "arn:aws:lambda:..."
  }
}
```

---

## Azure Services

### `azure.storage` - Storage Account

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `accountName` (string): Storage account name (3-24 chars, alphanumeric)
- `accountKind` (string): Account kind (default: `"StorageV2"`)
  - Options: `"Storage"`, `"StorageV2"`, `"BlobStorage"`
- `sku` (string): SKU name (default: `"Standard_LRS"`)
  - Options: `"Standard_LRS"`, `"Standard_GRS"`, `"Premium_LRS"`, etc.
- `containerName` (string): Blob container name (optional)

**Example:**
```json
{
  "id": "storage-1",
  "kind": "azure.storage",
  "name": "my-storage",
  "props": {
    "accountName": "mystorageaccount",
    "accountKind": "StorageV2",
    "sku": "Standard_LRS",
    "containerName": "my-container"
  }
}
```

---

### `azure.servicebus` - Service Bus Queue

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `queueName` (string): Queue name
- `sku` (string): Service Bus SKU (default: `"Basic"`)
  - Options: `"Basic"`, `"Standard"`, `"Premium"`
- `partition` (boolean): Enable partitioning (default: `false`)

**Example:**
```json
{
  "id": "servicebus-1",
  "kind": "azure.servicebus",
  "name": "my-queue",
  "props": {
    "queueName": "my-servicebus-queue",
    "sku": "Standard",
    "partition": true
  }
}
```

---

### `azure.containerapp` - Container App

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `image` (string): Container image (default: `"mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"`)
- `cpu` (number): CPU cores (default: `0.25`)
- `memory` (string): Memory (default: `"0.5Gi"`)
  - Format: `"0.5Gi"`, `"1Gi"`, `"2Gi"`, etc.
- `env` (object): Environment variables

**Example:**
```json
{
  "id": "containerapp-1",
  "kind": "azure.containerapp",
  "name": "my-app",
  "props": {
    "image": "nginx:latest",
    "cpu": 0.5,
    "memory": "1Gi",
    "env": {
      "LOG_LEVEL": "info"
    }
  }
}
```

---

### `azure.vm` - Virtual Machine

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `vmSize` (string): VM size (default: `"Standard_B1s"`)
  - Examples: `"Standard_B1s"`, `"Standard_B2s"`, `"Standard_D2s_v3"`, etc.
- `adminUsername` (string): Admin username (default: `"azureuser"`)
- `adminPassword` (string): Admin password (required for Windows, optional for Linux with SSH)
- `osType` (string): OS type (default: `"Linux"`)
  - Options: `"Linux"`, `"Windows"`
- `imagePublisher` (string): Image publisher (default: `"Canonical"`)
- `imageOffer` (string): Image offer (default: `"0001-com-ubuntu-server-jammy"`)
- `imageSku` (string): Image SKU (default: `"22_04-lts-gen2"`)
- `vnetAddressSpace` (string): VNet address space (default: `"10.0.0.0/16"`)
- `subnetAddressPrefix` (string): Subnet address prefix (default: `"10.0.1.0/24"`)

**Example:**
```json
{
  "id": "vm-1",
  "kind": "azure.vm",
  "name": "my-vm",
  "props": {
    "vmSize": "Standard_B2s",
    "adminUsername": "azureuser",
    "osType": "Linux",
    "imagePublisher": "Canonical",
    "imageOffer": "0001-com-ubuntu-server-jammy",
    "imageSku": "22_04-lts-gen2"
  }
}
```

---

### `azure.functionapp` - Function App

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `sku` (string): App Service Plan SKU (default: `"Y1"` for Consumption)
  - Options: `"Y1"` (Consumption), `"EP1"` (Elastic Premium), etc.
- `runtime` (string): Function runtime (default: `"python"`)
- `functionsVersion` (string): Functions extension version (default: `"~4"`)

**Example:**
```json
{
  "id": "functionapp-1",
  "kind": "azure.functionapp",
  "name": "my-function",
  "props": {
    "sku": "Y1",
    "runtime": "python"
  }
}
```

---

### `azure.sql` - SQL Database

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `adminLogin` (string): Admin login (default: `"sqladmin"`)
- `adminPassword` (string): Admin password (required)
- `serviceTier` (string): Service tier (default: `"S0"`)
  - Options: `"S0"`, `"S1"`, `"P1"`, `"P2"`, etc.
- `serverName` (string): SQL server name

**Example:**
```json
{
  "id": "sql-1",
  "kind": "azure.sql",
  "name": "my-database",
  "props": {
    "adminLogin": "sqladmin",
    "adminPassword": "SecurePassword123!",
    "serviceTier": "S1"
  }
}
```

---

### `azure.cosmosdb` - Cosmos DB

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `kind` (string): Cosmos DB kind (default: `"GlobalDocumentDB"`)
  - Options: `"GlobalDocumentDB"`, `"MongoDB"`, `"Table"`, etc.
- `databaseName` (string): Database name
- `containerName` (string): Container name
- `partitionKey` (string): Partition key path (default: `"/id"`)

**Example:**
```json
{
  "id": "cosmosdb-1",
  "kind": "azure.cosmosdb",
  "name": "my-cosmos",
  "props": {
    "kind": "GlobalDocumentDB",
    "databaseName": "my-database",
    "containerName": "my-container",
    "partitionKey": "/id"
  }
}
```

---

### `azure.apimanagement` - API Management

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `sku` (string or object): SKU configuration (default: `"Developer"`)
  - String: `"Developer"`, `"Basic"`, `"Standard"`, `"Premium"`, `"Consumption"`
  - Object: `{"name": "Standard", "capacity": 1}`
- `publisherName` (string): Publisher name (default: `"Contoso"`)
- `publisherEmail` (string): Publisher email (default: `"admin@contoso.com"`)

**Example:**
```json
{
  "id": "apim-1",
  "kind": "azure.apimanagement",
  "name": "my-api",
  "props": {
    "sku": "Standard",
    "publisherName": "My Company",
    "publisherEmail": "admin@mycompany.com"
  }
}
```

---

### `azure.keyvault` - Key Vault

**Mandatory:**
- `tenantId` (string): Azure tenant ID (required for Key Vault)

**Optional:**
- `vaultName` (string): Vault name (3-24 chars, alphanumeric and hyphens)

**Example:**
```json
{
  "id": "keyvault-1",
  "kind": "azure.keyvault",
  "name": "my-vault",
  "props": {
    "tenantId": "00000000-0000-0000-0000-000000000000",
    "vaultName": "my-key-vault"
  }
}
```

---

### `azure.appinsights` - Application Insights

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `applicationType` (string): Application type (default: `"web"`)
  - Options: `"web"`, `"other"`
- `ingestionMode` (string): Ingestion mode (default: `"ApplicationInsights"`)

**Example:**
```json
{
  "id": "appinsights-1",
  "kind": "azure.appinsights",
  "name": "my-insights",
  "props": {
    "applicationType": "web"
  }
}
```

---

### `azure.vnet` - Virtual Network

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `addressSpaces` (array): Address spaces (default: `["10.0.0.0/16"]`)
- `subnets` (array): Subnet configurations
  - Each subnet: `{"name": "subnet-name", "addressPrefix": "10.0.1.0/24"}`

**Example:**
```json
{
  "id": "vnet-1",
  "kind": "azure.vnet",
  "name": "my-vnet",
  "props": {
    "addressSpaces": ["10.0.0.0/16"],
    "subnets": [
      {"name": "subnet1", "addressPrefix": "10.0.1.0/24"},
      {"name": "subnet2", "addressPrefix": "10.0.2.0/24"}
    ]
  }
}
```

---

## GCP Services

### `gcp.storage` - Cloud Storage Bucket

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `uniformAccess` (boolean): Uniform bucket-level access (default: `true`)
- `forceDestroy` (boolean): Force destroy on deletion (default: `false`)
- `labels` (object): Resource labels

**Example:**
```json
{
  "id": "storage-1",
  "kind": "gcp.storage",
  "name": "my-bucket",
  "props": {
    "uniformAccess": true,
    "forceDestroy": false,
    "labels": {
      "environment": "prod"
    }
  }
}
```

---

### `gcp.pubsub` - Pub/Sub Topic

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `topicName` (string): Topic name
- `labels` (object): Resource labels

**Example:**
```json
{
  "id": "pubsub-1",
  "kind": "gcp.pubsub",
  "name": "my-topic",
  "props": {
    "topicName": "my-pubsub-topic",
    "labels": {
      "environment": "prod"
    }
  }
}
```

---

### `gcp.run` - Cloud Run Service

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `image` (string): Container image (default: `"gcr.io/cloudrun/hello"`)
- `cpu` (string): CPU allocation (default: `"1000m"`)
  - Format: `"1000m"` (1 CPU), `"2000m"` (2 CPUs), etc.
- `memory` (string): Memory allocation (default: `"512Mi"`)
  - Format: `"256Mi"`, `"512Mi"`, `"1Gi"`, `"2Gi"`, etc.
- `env` (object): Environment variables
- `allowUnauthenticated` (boolean): Allow unauthenticated invocations (default: `true`)

**Example:**
```json
{
  "id": "run-1",
  "kind": "gcp.run",
  "name": "my-service",
  "props": {
    "image": "gcr.io/my-project/my-image:latest",
    "cpu": "2000m",
    "memory": "1Gi",
    "env": {
      "LOG_LEVEL": "info"
    },
    "allowUnauthenticated": true
  }
}
```

---

### `gcp.firestore` - Firestore Database

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `locationId` (string): Firestore location ID (default: `"nam5"`)
  - Options: `"nam5"` (us-central multi-region), `"us-central1"`, `"us-east1"`, etc.
- `databaseName` (string): Database name

**Example:**
```json
{
  "id": "firestore-1",
  "kind": "gcp.firestore",
  "name": "my-database",
  "props": {
    "locationId": "us-central1",
    "databaseName": "my-firestore-db"
  }
}
```

---

### `gcp.secretmanager` - Secret Manager

**Mandatory:**
- None (all properties have defaults)

**Optional:**
- `secretValue` (string): Initial secret value (optional)
- `secretId` (string): Secret ID

**Example:**
```json
{
  "id": "secretmanager-1",
  "kind": "gcp.secretmanager",
  "name": "my-secret",
  "props": {
    "secretValue": "my-secret-value",
    "secretId": "my-secret-id"
  }
}
```

---

## Edge Configurations

### Edge Properties

All edges support the following properties:

**Mandatory:**
- `from` (string): Source node ID
- `to` (string): Destination node ID
- `intent` (string): Connection intent
  - Options: `"notify"`, `"consume"`, `"invoke"`, `"publish"`, `"read"`, `"write"`, `"deliver"`, `"access"`

**Optional:**
- `event` (string): Event type (for event-driven connections)
- `batchSize` (integer): Batch size for processing (default varies by service)
- `filter` (object): Filter configuration (key-value pairs)
- `subscriptionName` (string): Subscription name (for Pub/Sub)
- `eventTypes` (array): Event types (for storage notifications)

**Example:**
```json
{
  "from": "s3-1",
  "to": "sns-1",
  "intent": "notify",
  "event": "ObjectCreated",
  "filter": {
    "prefix": "uploads/",
    "suffix": ".jpg"
  }
}
```

---

## Notes

1. **Defaults**: All services have sensible defaults. You can deploy with minimal configuration (`{}`) and the system will use defaults.

2. **Naming**: Service names are automatically sanitized to meet cloud provider naming requirements (length, characters, uniqueness).

3. **Regions**: Region can be specified at the IR level or in individual service props. If not specified, defaults are used.

4. **Credentials**: All services use credentials fetched from the database based on the authenticated user's JWT token.

5. **Validation**: The system validates all configurations before deployment and provides helpful error messages.

---

## Quick Reference

### AWS Lambda
- **Mandatory**: None
- **Key Optional**: `runtime`, `memory`, `timeout`, `handler`, `codeUri`

### Azure Function App
- **Mandatory**: None
- **Key Optional**: `sku`, `runtime`, `functionsVersion`

### GCP Cloud Run
- **Mandatory**: None
- **Key Optional**: `image`, `cpu`, `memory`, `env`, `allowUnauthenticated`

### AWS S3
- **Mandatory**: None
- **Key Optional**: `bucketName`, `versioning`, `eventBridge`

### Azure Storage
- **Mandatory**: None
- **Key Optional**: `accountName`, `accountKind`, `sku`, `containerName`

### GCP Storage
- **Mandatory**: None
- **Key Optional**: `uniformAccess`, `forceDestroy`, `labels`

---

*Last updated: 2024*

