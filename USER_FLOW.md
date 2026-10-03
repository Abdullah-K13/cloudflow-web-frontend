# CloudFlow - Complete User Flow Documentation

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Dashboard](#dashboard)
3. [Creating a New Pipeline](#creating-a-new-pipeline)
4. [Templates](#templates)
5. [Canvas/Workplace](#canvasworkplace)
6. [Service Configuration](#service-configuration)
7. [Cost Estimation](#cost-estimation)
8. [Cost Optimization](#cost-optimization)
9. [Deployment](#deployment)
10. [Pipeline Management](#pipeline-management)
11. [Settings](#settings)

---

## Authentication Flow

### Login
1. **Access Login Page** (`/login`)
   - User sees login form with email and password fields
   - Option to sign in with Google (OAuth)
   - Link to signup page if user doesn't have an account

2. **Email/Password Login**
   - User enters email and password
   - Clicks "Sign In" button
   - System validates credentials via `/auth/login` endpoint
   - On success:
     - Access token stored in:
       - Cookie (`access_token`)
       - localStorage (`access_token`)
     - User redirected to Dashboard (`/dash`)

3. **Google OAuth Login**
   - User clicks "Sign in with Google" button
   - Google OAuth popup appears
   - User selects Google account
   - System receives `id_token` from Google
   - Backend validates token via `/auth/google` endpoint
   - On success:
     - Access token stored (same as email/password flow)
     - User redirected to Dashboard

4. **Error Handling**
   - Invalid credentials: Error message displayed
   - Network errors: Appropriate error message shown
   - Token storage failures: Error message with retry option

### Signup
1. **Access Signup Page** (`/signup`)
   - User sees registration form
   - Fields: Email, Password, Role (optional)

2. **Registration Process**
   - User fills in required information
   - Clicks "Sign Up" button
   - System creates account via `/auth/register` endpoint
   - On success:
     - Access token received and stored
     - User automatically logged in
     - Redirected to Dashboard

---

## Dashboard

### Overview
- **URL**: `/dash`
- **Purpose**: Main landing page after login, shows user's pipelines and quick actions

### Features

1. **User Information**
   - Displays user email/name in sidebar
   - Shows user role (if applicable)

2. **Recent Pipelines Section**
   - Lists user's recently modified pipelines
   - Each pipeline shows:
     - Name
     - Last modified time (relative: "2h ago", "3 days ago")
     - Status (draft, deploying, deployed, failed)
   - Clicking a pipeline opens it in the workplace

3. **Search Functionality**
   - Search bar to filter pipelines by name
   - Real-time filtering as user types

4. **New Pipeline Button**
   - Prominent "New Pipeline" button
   - Clicking opens a modal to enter pipeline name
   - After entering name:
     - User redirected to `/workplace?name=<pipelineName>`
     - New pipeline created in database when canvas loads

5. **Navigation**
   - Sidebar with links to:
     - Dashboard
     - Templates
     - Pipelines (list view)
     - Settings
     - Observability
     - Documentation
     - Help

---

## Creating a New Pipeline

### Method 1: From Dashboard
1. Click "New Pipeline" button on dashboard
2. **Pipeline Name Modal** appears:
   - User enters pipeline name (required)
   - Can cancel or create
3. On create:
   - User redirected to `/workplace?name=<pipelineName>`
   - Canvas opens with blank workspace
   - Pipeline automatically created in database with:
     - Name: User-provided name
     - Status: "draft"
     - Cloud: Determined from first service added
     - Region: Default or from service config
     - Env: "dev" (default)

### Method 2: From Templates
1. User browses templates (see Templates section)
2. Clicks "Use template" on a template
3. Redirected to workplace with template pre-loaded

### Method 3: Direct URL
1. User navigates to `/workplace`
2. Can optionally provide `?name=<pipelineName>` query parameter
3. Pipeline created on first save

### Auto-Save Feature
- **Automatic Saving**: Pipeline auto-saves every 3 seconds when:
  - Nodes are added/removed
  - Edges are added/removed
  - Provider is changed
  - Service configurations are updated
- **First Save**: If pipeline doesn't exist, it's created automatically
- **Subsequent Saves**: Existing pipeline is updated via PATCH request

---

## Templates

### Overview
- **URL**: `/templates`
- **Purpose**: Browse and use pre-built cloud architecture templates

### Features

1. **Template Grid**
   - Cards display available templates
   - Each card shows:
     - Template name
     - Short description (2 lines max)
     - Cloud provider badge (AWS/GCP/Azure) with color coding:
       - AWS: Orange
       - GCP: Blue
       - Azure: Cyan
     - Tags (serverless, data, k8s, etc.)
     - Last updated date
     - "Use template" button

2. **Search & Filter**
   - Search bar to filter templates by name/description
   - Tag filters:
     - All
     - AWS
     - Azure
     - GCP
     - Serverless
   - Filters work together (search + tag)

3. **Blank Starter Option**
   - First card is "Start from blank"
   - Clicking redirects to `/pipelines/new` → `/templates`

4. **Using a Template**
   - Click "Use template" button
   - Redirected to `/templates/<templateId>`
   - Template details page loads template configuration
   - User can customize before deploying

---

## Canvas/Workplace

### Overview
- **URL**: `/workplace` or `/workplace?id=<pipelineId>`
- **Purpose**: Visual canvas for designing cloud architecture

### Layout

1. **Left Panel** (Collapsible)
   - **Service Catalog**: Drag-and-drop services organized by cloud provider
   - **Pipeline List**: Shows saved pipelines, can switch between them
   - **Project Name**: Editable pipeline/project name
   - **Cost Summary**: Real-time cost breakdown
   - **Save Button**: Manual save option

2. **Center Canvas**
   - ReactFlow-based visual editor
   - Drag services from left panel onto canvas
   - Connect services by dragging from one node to another
   - Pan and zoom controls
   - Mini-map for navigation
   - Grid background

3. **Right Panel** (Service Configuration)
   - Opens when a service node is selected
   - Shows configuration form for selected service
   - Fields vary by service type (see Service Configuration section)

4. **Top Bar**
   - Cloud provider selector (AWS/GCP/Azure)
   - Deploy button
   - Cost optimization button
   - Other action buttons

### Adding Services

1. **From Service Catalog**
   - User drags service from left panel
   - Drops onto canvas
   - Service node appears at drop location
   - Node shows:
     - Service icon
     - Service label
     - Cost badge (initially shows "Calc..." then updates with price)
     - Cost marked as "(est.)" if estimated

2. **Service Types Available**

   **AWS Services:**
   - RDS, Lambda, SNS, S3, EC2, Kinesis, SQS, DynamoDB
   - CloudFront, API Gateway, ECS, ECR
   - Secrets Manager, Cognito, VPC, CloudWatch
   - ElastiCache, Step Functions, EventBridge Rule

   **GCP Services:**
   - Cloud Storage, Pub/Sub, Cloud Run
   - Secret Manager, Firestore

   **Azure Services:**
   - Storage, Service Bus, Container Apps
   - Virtual Machine, Function App, SQL Database
   - Cosmos DB, API Management, Key Vault
   - Application Insights, Virtual Network

### Connecting Services

1. **Creating Connections**
   - Click and drag from source node's right handle
   - Release on target node's left handle
   - Edge appears showing connection
   - Connection intent automatically determined:
     - S3 → SQS: "notify"
     - SQS → Lambda: "notify"
     - API Gateway → Lambda: "invoke"
     - Lambda → DynamoDB: "write"
     - etc.

2. **Connection Types**
   - notify: Event notifications
   - consume: Message consumption
   - invoke: Function invocations
   - read: Data reads
   - write: Data writes
   - deliver: Message delivery
   - access: Resource access

### Managing Nodes

1. **Selecting Nodes**
   - Click on a node to select it
   - Selected node opens configuration panel
   - Multiple nodes can be selected (for bulk operations)

2. **Moving Nodes**
   - Drag node to reposition
   - Position saved for canvas restoration
   - Position NOT sent to deploy endpoint (only for UI)

3. **Deleting Nodes**
   - Select node
   - Press Delete key OR
   - Drag to delete zone (bottom of canvas)
   - Confirmation may appear for important nodes

4. **Deleting Edges**
   - Click on edge to select
   - Press Delete key

### Provider Switching

1. **Changing Cloud Provider**
   - Use provider selector in top bar
   - Options: AWS, GCP, Azure
   - On switch:
     - Service catalog updates to show provider-specific services
     - Existing nodes remain but may need reconfiguration
     - Costs recalculated for all nodes
     - Canvas layout preserved

---

## Service Configuration

### Overview
- **Trigger**: Click on a service node on canvas
- **Location**: Right panel slides in
- **Purpose**: Configure service-specific properties

### Configuration Process

1. **Panel Opens**
   - Right panel appears with service name and icon
   - Form fields specific to service type
   - Current configuration values pre-filled

2. **Field Types**
   - **Text Input**: Names, identifiers, descriptions
   - **Number Input**: Memory, timeout, storage sizes
   - **Select Dropdown**: Options like runtime, instance types
   - **Checkbox**: Boolean flags (versioning, encryption, etc.)
   - **JSON Textarea**: Complex configurations (for advanced users)

3. **Validation**
   - Real-time validation as user types
   - Required fields marked with asterisk (*)
   - Error messages shown for invalid inputs
   - Save button disabled if validation fails

4. **Saving Configuration**
   - Click "Save" button in panel
   - Configuration saved to node
   - Cost automatically recalculated
   - Auto-save triggers (3-second debounce)

### Service-Specific Configurations

#### AWS Lambda
- **Required**: `lambda_name`, `region`
- **Optional**: `runtime`, `handler`, `memory`, `timeout`, `codeUri`, `env` variables

#### AWS S3
- **Required**: `bucketName`, `region`
- **Optional**: `versioning`, `eventBridge`, `encryption`

#### AWS DynamoDB
- **Required**: `tableName`, `region`, `partitionKey`
- **Optional**: `sortKey`, `billing` (PAY_PER_REQUEST/PROVISIONED), `rcu`, `wcu`, `stream`

#### AWS RDS
- **Required**: `instanceIdentifier`, `region`, `engineVersion`
- **Optional**: `masterUsername`, `masterPassword`, `instanceClass`, `allocatedStorage`

#### AWS EC2
- **Required**: `instanceName`, `region`, `instanceType`
- **Optional**: `keyName`, `securityGroups`

#### AWS SQS
- **Required**: `queueName`, `region`
- **Optional**: `visibilityTimeout`, `messageRetentionPeriod`

#### GCP Cloud Run
- **Required**: `serviceName`, `region` (location)
- **Optional**: `image`, `cpu`, `memory`, `timeout`, `minInstances`, `maxInstances`

#### GCP Firestore
- **Required**: `databaseName`, `locationId`
- **Optional**: `mode` (NATIVE/FIRESTORE)

#### Azure Function App
- **Required**: `functionAppName`, `region`
- **Optional**: `runtime`, `functionsVersion`, `storageAccountName`

#### Azure Virtual Machine
- **Required**: `vmName`, `region`, `size`
- **Optional**: `imagePublisher`, `imageOffer`, `imageSku`

*(Many more services with specific configurations - see SERVICE_CONFIGURATIONS.md for complete list)*

### Configuration Updates

1. **Real-time Updates**
   - Changes reflected immediately on canvas
   - Cost recalculated automatically
   - Validation runs on each change

2. **Cost Impact**
   - Estimated costs shown before full config
   - Accurate costs shown after full configuration
   - Cost badge on node updates in real-time

---

## Cost Estimation

### Overview
- **Purpose**: Show real-time cost estimates for each service and total architecture
- **Calculation**: Uses `/cost-optimization/price` endpoint

### How It Works

1. **Initial Cost (Estimated)**
   - When service first added to canvas
   - Minimal configuration sent to pricing API
   - Returns estimated price with `isEstimated: true`
   - Displayed as: `$X.XX/mo (est.)`

2. **Accurate Cost (After Configuration)**
   - When user configures service (memory, timeout, etc.)
   - Full configuration sent to pricing API
   - Returns accurate price with `isEstimated: false`
   - Displayed as: `$X.XX/mo`

3. **Cost Recalculation Triggers**
   - Service added to canvas
   - Service configuration changed
   - Cloud provider switched
   - Region changed

### Cost Display

1. **On Service Nodes**
   - Cost badge below service name
   - Format: `$X.XX/mo` or `$X.XX/mo (est.)`
   - Shows "Calc..." while calculating

2. **In Left Panel**
   - Cost summary section
   - Breakdown by service type
   - Total monthly cost
   - Updates in real-time

3. **Cost Breakdown**
   - Per service type (e.g., "Lambda: $50.00")
   - Count of each service type
   - Total across all services

### Pricing Details

- **Two-Phase Pricing**:
  - Phase 1: Minimal config → Estimated price
  - Phase 2: Full config → Accurate price
- **Supported Services**: All major services across AWS, GCP, Azure
- **Currency**: USD
- **Period**: Monthly estimates

---

## Cost Optimization

### Overview
- **Purpose**: Get AI-powered suggestions to reduce infrastructure costs
- **Endpoint**: `/cost-optimization/analyze`

### Using Cost Optimization

1. **Access Optimization**
   - Click "Optimize Costs" button in top bar
   - Requirements modal appears

2. **Enter Requirements**
   - User fills in requirements form:
     - Performance requirements
     - Availability needs
     - Budget constraints
     - Other preferences
   - Click "Analyze" button

3. **Analysis Process**
   - System analyzes current architecture
   - Compares with optimization opportunities
   - Generates suggestions
   - Calculates potential savings

4. **View Results**
   - Optimization results modal opens
   - Shows:
     - List of suggestions
     - Potential savings per suggestion
     - Total potential savings
   - Each suggestion includes:
     - Description of change
     - Current cost
     - Optimized cost
     - Savings amount

5. **Apply Suggestions**
   - User reviews each suggestion
   - Can apply individual suggestions
   - Or apply all at once
   - Changes reflected on canvas immediately

### Types of Suggestions

1. **Service Substitutions**
   - Replace expensive services with cheaper alternatives
   - Example: EC2 → Lambda for short-running tasks

2. **Configuration Optimizations**
   - Adjust resource sizes
   - Example: Reduce Lambda memory if not needed

3. **Architecture Improvements**
   - Restructure for efficiency
   - Example: Use Step Functions for complex workflows

---

## Deployment

### Overview
- **Purpose**: Deploy designed architecture to cloud provider
- **Endpoints**:
  - AWS: `/aws/deploy`
  - GCP: `/gcp/up`
  - Azure: `/azure/deploy`

### Pre-Deployment Checks

1. **Authentication**
   - User must be logged in
   - Access token validated

2. **Credentials Check**
   - **GCP**: Checks if GCP credentials configured
   - **Azure**: Checks if Azure credentials configured
   - **AWS**: Uses credentials from user database
   - If missing, credentials modal appears

3. **Service Validation**
   - All services must be configured
   - Required fields validated
   - Errors shown if validation fails

### Deployment Process

1. **Initiate Deployment**
   - Click "Deploy" button in top bar
   - Deployment confirmation may appear

2. **Pipeline Status Update**
   - Pipeline status set to "deploying"
   - `deployment_started_at` timestamp recorded

3. **Payload Construction**
   - System builds deployment payload:
     - `project`: "canvas-project"
     - `env`: "dev"
     - `region`: From service configs or default
     - `nodes`: All service nodes (position field removed)
     - `edges`: All connections
   - For GCP/Azure: Wrapped in `{ir: payload}`
   - For AWS: Sent directly

4. **Deployment Request**
   - POST request to appropriate endpoint
   - Payload sent in request body
   - Headers include Authorization token

5. **Deployment Progress**
   - Loading indicator shown
   - User can see deployment is in progress
   - Cannot start another deployment while one is running

6. **Success Response**
   - Success modal appears
   - Shows deployment details:
     - Stack name
     - Region
     - Deployment time
     - Output messages
   - Pipeline status updated to "deployed"
   - `deployment_completed_at` timestamp recorded

7. **Error Handling**
   - Error modal appears on failure
   - Shows error message
   - May include:
     - Step where error occurred
     - Hint for resolution
     - Full error output
   - Pipeline status updated to "failed"
   - User can retry after fixing issues

### Deployment Payload Structure

```json
{
  "project": "canvas-project",
  "env": "dev",
  "region": "ap-southeast-2",
  "nodes": [
    {
      "id": "lambda-123",
      "kind": "aws.lambda",
      "name": "my-function",
      "props": {
        "lambda_name": "my-function",
        "region": "ap-southeast-2",
        "runtime": "python3.11",
        "memory": 256,
        "timeout": 30
        // ... other props
      }
      // Note: position field is NOT included in deploy payload
    }
  ],
  "edges": [
    {
      "from": "s3-123",
      "to": "sqs-456",
      "intent": "notify"
    }
  ]
}
```

### Post-Deployment

1. **Pipeline Updates**
   - Status: "deployed"
   - Deployment timestamps saved
   - Can view deployment history

2. **Resource Access**
   - Resources available in cloud provider console
   - Can manage via cloud provider UI
   - Or update via CloudFlow and redeploy

---

## Pipeline Management

### Overview
- **URL**: `/data/pipelines` (or `/pipelines`)
- **Purpose**: View and manage all pipelines

### Pipeline List View

1. **Table Display**
   - Columns:
     - Name
     - Cloud Provider
     - Region
     - Environment
     - Status (draft, deploying, deployed, failed)
     - Last Modified
     - Actions

2. **Filtering & Search**
   - Search by pipeline name
   - Filter by:
     - Status
     - Cloud Provider
     - Environment
   - Sort by last modified (newest first)

3. **Pipeline Actions**
   - **View/Edit**: Click pipeline name → Opens in workplace
   - **Delete**: Delete pipeline (with confirmation)
   - **View Details**: See full pipeline information

### Pipeline Statuses

1. **Draft**
   - Pipeline created but not deployed
   - Can be edited freely
   - Auto-saved periodically

2. **Deploying**
   - Deployment in progress
   - Cannot edit while deploying
   - Shows progress indicator

3. **Deployed**
   - Successfully deployed to cloud
   - Can be edited and redeployed
   - Shows deployment timestamp

4. **Failed**
   - Deployment failed
   - Can be edited and retried
   - Shows error information

### Pipeline Operations

1. **Opening Pipeline**
   - Click on pipeline name
   - Redirected to `/workplace?id=<pipelineId>`
   - Canvas loads with saved configuration
   - Nodes positioned as saved
   - All connections restored

2. **Saving Pipeline**
   - **Auto-save**: Every 3 seconds when changes detected
   - **Manual save**: Click "Save" button in left panel
   - Saves:
     - Pipeline name
     - Node configurations
     - Edge connections
     - Node positions (for UI restoration)
     - Provider
     - Region
     - Environment

3. **Deleting Pipeline**
   - Click delete button
   - Confirmation modal appears
   - On confirm: Pipeline deleted from database
   - Note: Does NOT delete cloud resources

4. **Duplicating Pipeline**
   - Create copy of existing pipeline
   - New pipeline with "-copy" suffix
   - Can be modified independently

---

## Settings

### Overview
- **URL**: `/settings`
- **Purpose**: Manage user account and platform settings

### Available Settings

1. **Account Settings**
   - Email (read-only)
   - Password change
   - Profile information

2. **Cloud Credentials**
   - **AWS**: Credentials stored in user database
   - **GCP**: Configure GCP service account
   - **Azure**: Configure Azure credentials
   - Credentials used for deployments

3. **Preferences**
   - Default region
   - Default environment
   - UI preferences

4. **API Keys**
   - Generate API keys for programmatic access
   - View existing keys
   - Revoke keys

---

## Additional Features

### Observability
- **URL**: `/observability`
- View deployed infrastructure metrics
- Monitor resource usage
- Track costs over time

### Documentation
- **URL**: `/docs`
- Comprehensive documentation
- Guides for each feature
- Best practices
- API reference

### Help & Support
- **URL**: `/help`
- FAQs
- Contact support
- Troubleshooting guides

---

## Complete User Journey Examples

### Example 1: Creating a Serverless API

1. **Login** → Dashboard
2. **Click "New Pipeline"** → Enter name "My API"
3. **Canvas Opens** → Select AWS as provider
4. **Add Services**:
   - Drag API Gateway onto canvas
   - Drag Lambda onto canvas
   - Drag DynamoDB onto canvas
5. **Connect Services**:
   - API Gateway → Lambda (invoke)
   - Lambda → DynamoDB (write)
6. **Configure Services**:
   - Click Lambda → Set name, runtime, memory
   - Click DynamoDB → Set table name, partition key
   - Click API Gateway → Set API name
7. **View Costs**: See estimated monthly cost in left panel
8. **Optimize** (optional): Click "Optimize Costs" → Review suggestions
9. **Deploy**: Click "Deploy" → Wait for success
10. **Result**: API deployed to AWS, accessible via API Gateway endpoint

### Example 2: Using a Template

1. **Login** → Dashboard
2. **Navigate to Templates** → Browse templates
3. **Select Template** → Click "Use template" on "Serverless API" template
4. **Template Loads** → Canvas shows pre-configured services
5. **Customize** → Modify service configurations as needed
6. **Deploy** → Click "Deploy" → Architecture deployed

### Example 3: Multi-Cloud Architecture

1. **Create Pipeline** → "Multi-Cloud App"
2. **Add AWS Services** → S3, Lambda
3. **Switch to GCP** → Add Cloud Storage, Cloud Run
4. **Connect Services** → S3 → Cloud Storage (data sync)
5. **Configure Each Service** → Set region, names, etc.
6. **View Costs** → See breakdown by provider
7. **Deploy** → Deploy AWS services first, then GCP services

---

## Key Technical Details

### Auto-Save Mechanism
- **Trigger**: Changes to nodes, edges, provider, or configurations
- **Debounce**: 3 seconds
- **Endpoint**: `PATCH /pipelines/<id>` or `POST /pipelines/`
- **Payload**: Full pipeline state including positions (for UI restoration)

### Cost Calculation
- **Endpoint**: `POST /cost-optimization/price`
- **Request**: `{service, cloud, region, config}`
- **Response**: `{price, currency, isEstimated, configUsed}`
- **Caching**: Estimated costs may be cached, accurate costs always recalculated

### Deployment Payload
- **Position Field**: Included in database saves, excluded from deploy requests
- **Node Structure**: `{id, kind, name, props}` (no position)
- **Edge Structure**: `{from, to, intent}`

### State Management
- **React Flow**: Manages canvas nodes and edges
- **Local State**: Service configurations, costs, UI state
- **Backend State**: Pipeline data, deployment status
- **Synchronization**: Auto-save keeps local and backend in sync

---

## Error Handling

### Common Errors

1. **Authentication Errors**
   - Token expired → Redirect to login
   - Invalid token → Clear storage, redirect to login

2. **Validation Errors**
   - Service configuration invalid → Error message in config panel
   - Required fields missing → Highlighted with error text

3. **Deployment Errors**
   - Credentials missing → Credentials modal appears
   - Invalid configuration → Error message with details
   - Network errors → Retry option shown

4. **Save Errors**
   - Network failure → Error message, retry option
   - Validation failure → Error message with field details

---

## Best Practices

1. **Naming Conventions**
   - Use descriptive pipeline names
   - Follow cloud provider naming rules for resources

2. **Cost Management**
   - Review costs before deploying
   - Use cost optimization suggestions
   - Start with smaller configurations, scale up as needed

3. **Configuration**
   - Configure all services before deploying
   - Review required fields carefully
   - Test in dev environment first

4. **Deployment**
   - Ensure credentials are configured
   - Check region availability
   - Monitor deployment progress

5. **Pipeline Management**
   - Use descriptive names
   - Keep pipelines organized
   - Delete unused pipelines

---

## Summary

CloudFlow provides a complete visual interface for designing, configuring, estimating costs, optimizing, and deploying cloud infrastructure across AWS, GCP, and Azure. The platform emphasizes:

- **Visual Design**: Drag-and-drop canvas for intuitive architecture design
- **Real-time Costs**: Instant cost estimates as you build
- **Auto-save**: Never lose your work
- **Multi-cloud**: Support for AWS, GCP, and Azure
- **Templates**: Start quickly with pre-built architectures
- **Optimization**: AI-powered cost-saving suggestions
- **One-click Deploy**: Deploy directly to your cloud provider

The user flow is designed to be intuitive, with helpful features like auto-save, real-time validation, and comprehensive error handling to ensure a smooth experience from login to deployment.


