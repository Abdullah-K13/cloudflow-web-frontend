# CloudFlow Frontend

CloudFlow is a visual cloud infrastructure design platform that enables you to build, deploy, and manage cloud architectures through an intuitive drag-and-drop interface. Design your infrastructure visually, and CloudFlow automatically generates production-ready infrastructure code.

## 🚀 Features

### Core Features

- **Visual Canvas Workspace**: Drag-and-drop interface powered by React Flow for designing cloud architectures
- **Multi-Cloud Support**: Switch between AWS, Google Cloud Platform (GCP), and Microsoft Azure providers
- **AWS Service Integration**: Full support for S3, Lambda, SQS, SNS, API Gateway, DynamoDB, Step Functions, EventBridge, Kinesis, and more
- **Pre-built Templates**: Choose from tested templates for common patterns (data pipelines, serverless apps, ML workflows)
- **Auto Infrastructure Generation**: Automatically generates CDK/Terraform code from your visual designs
- **Real-time Cost Estimation**: Get cost estimates for your infrastructure designs with per-service breakdowns
- **Observability Dashboard**: Monitor deployed projects, pipeline runs, and scheduled pipelines
- **Template Management**: Browse, create, and manage infrastructure templates with provider-specific configurations
- **Authentication**: Secure user authentication and authorization with JWT tokens
- **Documentation**: Built-in comprehensive documentation with searchable sections

### Advanced Features

- **Compile & Deploy**: Compile infrastructure designs to CDK and deploy directly to AWS
- **Infrastructure Management**: Check deployment status and destroy resources when needed
- **Service Configuration**: Detailed configuration panels for each service type with validation
- **Connection Management**: Visual edge connections between services with intent-based relationships
- **Cost Analysis**: Real-time cost estimation based on selected services and configurations
- **Pipeline Builder**: Create and manage data pipelines with visual workflow design
- **Run History**: Track and monitor pipeline execution history
- **Scheduled Pipelines**: Set up and manage scheduled infrastructure deployments

## 🛠️ Tech Stack

### Core Framework
- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript 5+
- **React**: React 19.1.0 with Server Components

### UI Libraries
- **React Flow** (`@xyflow/react` v12.8.2) - Canvas and node-based UI for visual architecture design
- **Material UI (MUI)** v7.3.1 - Component library for consistent design
- **Radix UI** - Accessible component primitives (Accordion, Dialog, Dropdown, etc.)
- **Tailwind CSS** v4 - Utility-first CSS framework
- **shadcn/ui** - Reusable UI component library built on Radix UI

### State Management & Data
- **React Hooks** - useState, useEffect, useCallback, useMemo for state management
- **Axios** v1.13.2 - HTTP client for API communication
- **@dnd-kit** v6.3.1 - Drag and drop functionality

### Utilities
- **Lucide React** v0.539.0 - Icon library
- **Dagre** v0.8.5 - Graph layout algorithms
- **class-variance-authority** - Component variant management
- **clsx** & **tailwind-merge** - Conditional class name utilities

## 📋 Prerequisites

- **Node.js**: 18.x or higher
- **Package Manager**: npm, yarn, pnpm, or bun
- **Backend API**: CloudFlow backend running (see [CloudFlow Backend](../cloudflow-web-backend) for setup)
- **AWS Credentials**: Configured AWS credentials for deployment features (optional for development)
- **Browser**: Modern browser with JavaScript enabled (Chrome, Firefox, Safari, Edge)

## 🏃 Getting Started

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd CloudFlow_Final/cloudflow-web-frontend/next\ js
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Configure environment variables:**
Create a `.env.local` file in the root directory:
```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Custom API endpoints
NEXT_PUBLIC_AWS_API_BASE=http://localhost:8000/aws

# Optional: Feature flags
NEXT_PUBLIC_ENABLE_COST_ESTIMATION=true
NEXT_PUBLIC_ENABLE_MULTI_CLOUD=true
```

### Development

Run the development server with Turbopack (faster builds):

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

**Development Features:**
- Hot Module Replacement (HMR) enabled
- Fast refresh for React components
- Turbopack for faster builds
- TypeScript type checking
- ESLint for code quality

### Build

Create a production build:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

The build output will be in the `.next` directory.

### Start Production Server

```bash
npm start
# or
yarn start
# or
pnpm start
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
# or
yarn lint
# or
pnpm lint
```

## 📁 Project Structure

```
cloudflow-web-frontend/next js/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Authentication routes (route group)
│   │   │   ├── layout.tsx           # Auth layout wrapper
│   │   │   ├── login/               # Login page
│   │   │   └── signup/               # Signup page
│   │   ├── (dashboard)/              # Protected dashboard routes
│   │   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   │   ├── dash/                # Main dashboard
│   │   │   ├── workplace/           # Canvas workspace for designing
│   │   │   ├── templates/           # Template browser and editor
│   │   │   │   ├── [id]/           # Template detail view
│   │   │   │   └── pipelines/new/   # New pipeline from template
│   │   │   ├── observability/       # Monitoring and observability
│   │   │   ├── settings/            # User settings and credentials
│   │   │   └── data/                # Data management
│   │   ├── pipelines/               # Pipeline management
│   │   │   └── [id]/builder/        # Pipeline builder canvas
│   │   ├── docs/                    # Documentation pages
│   │   │   └── [...slug]/          # Dynamic documentation routes
│   │   ├── help/                    # Help and support
│   │   ├── privacy/                 # Privacy policy
│   │   ├── terms/                   # Terms of service
│   │   ├── components/              # React components
│   │   │   ├── canvas.tsx          # Main React Flow canvas
│   │   │   ├── serviceNode.tsx     # AWS service node components
│   │   │   ├── service-config-panel.tsx  # Service configuration UI
│   │   │   ├── leftpanel.tsx       # Service palette and cost estimation
│   │   │   ├── topbar.tsx          # Top navigation bar
│   │   │   ├── deletezone.tsx      # Delete zone for removing nodes
│   │   │   ├── workplace-client.tsx # Workplace page client component
│   │   │   ├── dashboard-client.tsx # Dashboard client component
│   │   │   ├── templates-client.tsx # Templates browser
│   │   │   ├── template-detail-client.tsx # Template detail view
│   │   │   ├── observability-client.tsx # Observability dashboard
│   │   │   ├── settings-client.tsx # Settings page
│   │   │   ├── loginForm.tsx       # Login form component
│   │   │   ├── signupForm.tsx      # Signup form component
│   │   │   ├── awsOptions.ts       # AWS service configuration options
│   │   │   ├── types.ts            # TypeScript type definitions
│   │   │   ├── layout/             # Layout components
│   │   │   │   ├── Header.tsx     # Site header
│   │   │   │   └── Footer.tsx     # Site footer
│   │   │   ├── observability/     # Observability components
│   │   │   │   ├── ObservabilityTabs.tsx
│   │   │   │   ├── DeployedProjectsTable.tsx
│   │   │   │   ├── ScheduledPipelinesTable.tsx
│   │   │   │   └── RunHistoryTable.tsx
│   │   │   └── ui/                 # Reusable UI components (shadcn/ui)
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── input.tsx
│   │   │       └── ... (40+ components)
│   │   ├── actions/                # Server actions
│   │   │   ├── data_actions.ts    # Data-related server actions
│   │   │   └── observability-api.ts # Observability API calls
│   │   ├── api/                    # API routes
│   │   │   └── auth/               # Authentication API routes
│   │   │       └── login/route.ts  # Login API endpoint
│   │   ├── lib/                     # Utilities and services
│   │   │   ├── services/           # Service modules
│   │   │   │   └── apiClient.ts   # API client configuration
│   │   │   └── utils.ts            # Utility functions
│   │   └── globals.css             # Global styles
│   ├── public/                     # Static assets
│   │   ├── aws-icons/             # AWS service icons (PNG)
│   │   ├── logo.png               # CloudFlow logo
│   │   └── ...                    # Other static assets
│   ├── package.json               # Dependencies and scripts
│   ├── tsconfig.json              # TypeScript configuration
│   ├── tailwind.config.ts         # Tailwind CSS configuration
│   ├── next.config.ts             # Next.js configuration
│   ├── eslint.config.mjs          # ESLint configuration
│   └── postcss.config.mjs         # PostCSS configuration
└── README.md                      # This file
```

## 🔌 Backend API Integration

The frontend communicates with the CloudFlow backend API for all infrastructure operations.

### Authentication Endpoints

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /auth/me` - Get current user information

### AWS Infrastructure Endpoints

- `POST /aws/compile` - Compile infrastructure design to CDK (no auth required)
  - Body: IR JSON with nodes and edges
  - Response: `{message: "synth ok", ir_path: "...", synth_output: "..."}`
  
- `POST /aws/deploy` - Deploy infrastructure to AWS (requires authentication)
  - Body: IR JSON (same as compile)
  - Response: `{message: "deploy ok", output: "..."}`
  
- `POST /aws/destroy` - Destroy deployed infrastructure
  - Body: None (uses last compiled IR)
  - Response: `{message: "destroy ok", output: "..."}`
  
- `GET /aws/status` - Get deployment status
  - Response: `{stacks: [...], status: "ok"}`

### Cost Estimation

- `POST /estimate-cost` - Estimate infrastructure costs
  - Body: `{services: [{service: "s3", count: 2}, ...]}`
  - Response: `{total: 123.45, breakdown: [...]}`

### Template Management

- `GET /templates` - List all templates
- `GET /templates/{id}` - Get template details
- `POST /templates` - Create new template
- `PUT /templates/{id}` - Update template
- `DELETE /templates/{id}` - Delete template

### Pipeline Management

- `GET /pipelines` - List user pipelines
- `GET /pipelines/{id}` - Get pipeline details
- `POST /pipelines` - Create new pipeline
- `PUT /pipelines/{id}` - Update pipeline
- `DELETE /pipelines/{id}` - Delete pipeline

For detailed API documentation and AWS capabilities, see [CAPABILITIES.md](../../CAPABILITIES.md).

## 🎨 Key Components

### Canvas (`components/canvas.tsx`)
The main React Flow canvas where users design their infrastructure.

**Features:**
- Drag-and-drop service nodes from palette
- Connect services with visual edges
- Node configuration panels (right-side)
- Service palette with provider switching (AWS/GCP/Azure)
- Zoom, pan, and minimap controls
- Grid snapping for alignment
- Delete zone for removing nodes
- Compile, Deploy, Destroy, and Status buttons
- Real-time plan generation

**Provider Support:**
- AWS: Full support with all services
- GCP: UI support (services available in palette)
- Azure: UI support (services available in palette)

### Service Nodes (`components/serviceNode.tsx`)
Visual representations of cloud services that can be configured and connected.

**Supported Services:**
- AWS: S3, Lambda, SQS, SNS, DynamoDB, API Gateway, Step Functions, EventBridge, Kinesis
- GCP: Cloud Storage, Cloud Functions, Pub/Sub, BigQuery, Cloud Run, etc.
- Azure: Blob Storage, Functions, Service Bus, Cosmos DB, App Service, etc.

### Service Config Panel (`components/service-config-panel.tsx`)
Side panel for configuring service properties.

**Configuration Options:**
- **Lambda**: Runtime, handler, memory, timeout, architecture, environment variables
- **S3**: Versioning, encryption, event notifications, bucket policies
- **DynamoDB**: Partition key, sort key, billing mode, stream settings
- **SQS**: Queue type (standard/FIFO), visibility timeout, retention period, DLQ
- **SNS**: Topic type, display name, delivery settings
- **API Gateway**: API name, CORS settings, authentication
- **Step Functions**: State machine definition, execution settings

### Left Panel (`components/leftpanel.tsx`)
Service palette with draggable service icons and cost estimation.

**Features:**
- Service palette organized by provider
- Search functionality to filter services
- Drag-and-drop service icons to canvas
- Real-time cost estimation based on canvas nodes
- Cost breakdown by service type
- Pipeline management section
- Collapsible sections

### Observability Components

**ObservabilityTabs** (`components/observability/ObservabilityTabs.tsx`)
- Tabbed interface for different observability views
- Deployed Projects, Scheduled Pipelines, Run History

**DeployedProjectsTable** (`components/observability/DeployedProjectsTable.tsx`)
- Table view of all deployed infrastructure projects
- Status indicators, deployment dates, resource counts

**ScheduledPipelinesTable** (`components/observability/ScheduledPipelinesTable.tsx`)
- List of scheduled pipeline executions
- Schedule details, next run time, execution history

**RunHistoryTable** (`components/observability/RunHistoryTable.tsx`)
- Historical view of pipeline runs
- Success/failure status, execution time, logs

### Settings (`components/settings-client.tsx`)
User settings and cloud provider credentials management.

**Features:**
- Multi-cloud credential management (AWS, GCP, Azure)
- Profile settings
- API key management
- Team/organization settings
- Billing and usage information

## 🔧 Configuration

### Service Configuration Options

#### AWS Lambda
- **Runtimes**: nodejs20.x, nodejs18.x, python3.12, python3.11, java21, dotnet8, go1.x
- **Architecture**: x86_64, arm64
- **Memory**: 128-10240 MB (64 MB increments)
- **Timeout**: 1-900 seconds
- **Handler**: Module.function format (default: "app.lambda_handler")
- **Code URI**: Path to function code (default: "src/processor")

#### AWS S3
- **Versioning**: Enable/disable
- **Encryption**: None, SSE-S3, SSE-KMS
- **EventBridge**: Enable/disable event notifications
- **Physical Name**: Optional custom bucket name

#### AWS DynamoDB
- **Partition Key**: String, Number, or Binary (default: "pk")
- **Sort Key**: Optional (String, Number, or Binary)
- **Billing Mode**: PAY_PER_REQUEST or PROVISIONED
- **Stream**: Enable/disable (required for Lambda consumption)
- **Stream View Type**: NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES, KEYS_ONLY

#### AWS SQS
- **Queue Type**: Standard or FIFO
- **Visibility Timeout**: 0-43200 seconds
- **Message Retention**: 1-336 hours
- **Dead Letter Queue**: Optional with max receive count

#### AWS SNS
- **Topic Type**: Standard or FIFO
- **Display Name**: Optional custom name

#### AWS Kinesis
- **Shards**: Number of shards (default: 1)
- **Stream Mode**: ON_DEMAND or PROVISIONED
- **Encryption**: NONE or KMS

### Edge Configuration

Connections between services use "intent" keywords:

- **notify**: S3 → SQS/Lambda/SNS/EventBridge, SNS → Lambda/SQS, EventBridge → Lambda
- **consume**: SQS → Lambda, DynamoDB Streams → Lambda, Kinesis → Lambda
- **invoke**: API Gateway → Lambda, Lambda → Step Functions
- **read**: Lambda → DynamoDB (read permissions)
- **write**: Lambda → DynamoDB (write permissions)
- **deliver**: SNS → Lambda/SQS

**Edge Properties:**
- `batchSize`: For SQS/DynamoDB/Kinesis → Lambda (optional)
- `path`: For API Gateway → Lambda (default: "/")
- `method`: For API Gateway → Lambda (GET, POST, PUT, DELETE, ANY - default: ANY)

## 🧪 Development Tips

### Best Practices

1. **Component Structure**
   - Use `"use client"` directive for client components
   - Server components by default in App Router
   - Keep server components for data fetching when possible

2. **State Management**
   - Use React hooks (useState, useEffect) for local state
   - Use React Flow's built-in state for canvas nodes/edges
   - Consider context for shared state across components

3. **API Calls**
   - Use the `apiClient` utility from `lib/services/apiClient.ts`
   - Handle authentication tokens via cookies
   - Implement proper error handling and loading states

4. **TypeScript**
   - Define types in `components/types.ts`
   - Use strict type checking
   - Leverage TypeScript for better IDE support

5. **Styling**
   - Use Tailwind CSS utility classes
   - Use shadcn/ui components for consistent UI
   - Follow the design system patterns

6. **React Flow**
   - Nodes are managed via `useNodesState` hook
   - Edges are managed via `useEdgesState` hook
   - Use custom node types for different service types
   - Implement proper node/edge validation

### Debugging

- Use browser DevTools to inspect React Flow nodes and edges
- Check Network tab for API calls
- Use React DevTools for component inspection
- Check console for error messages and warnings
- Enable verbose logging in development mode

### Common Issues

1. **Canvas not updating**: Ensure nodes/edges state is properly managed
2. **API errors**: Check authentication tokens and API base URL
3. **Build errors**: Run `npm run lint` to check for TypeScript/ESLint issues
4. **Styling issues**: Verify Tailwind classes are not purged in production

## 📚 Learn More

### Documentation Resources

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [React Flow Documentation](https://reactflow.dev/learn) - Canvas and node-based UI patterns
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Material UI Documentation](https://mui.com/) - React component library
- [Radix UI Documentation](https://www.radix-ui.com/) - Accessible component primitives
- [shadcn/ui Documentation](https://ui.shadcn.com/) - Component library documentation

### CloudFlow Documentation

- [CAPABILITIES.md](../../CAPABILITIES.md) - AWS capabilities and API reference
- Built-in documentation at `/docs` route
- Help section at `/help` route

## 🚢 Deployment

### Vercel (Recommended)

The easiest way to deploy your Next.js app is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Vercel will automatically detect Next.js and configure build settings
5. Deploy!

**Environment Variables to Set:**
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_AWS_API_BASE` - AWS API base URL (optional)

### Other Deployment Options

- **Docker**: Create a Dockerfile and deploy to any container platform
- **AWS Amplify**: Deploy directly to AWS
- **Netlify**: Similar to Vercel, supports Next.js
- **Self-hosted**: Run `npm run build` and `npm start` on your server

For detailed deployment instructions, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint to check code quality

## 🔐 Security Considerations

- Authentication tokens are stored in HTTP-only cookies
- API keys should be stored securely (not in client-side code)
- Use environment variables for sensitive configuration
- Implement proper CORS policies on backend
- Validate all user inputs
- Use HTTPS in production

## 🤝 Contributing

Contributions are welcome! Please ensure your code follows the project's coding standards:

1. Use TypeScript for all new code
2. Follow the existing code style and patterns
3. Add appropriate type definitions
4. Include error handling
5. Write clear commit messages
6. Test your changes thoroughly
7. Update documentation as needed

## 📄 License

[Add your license information here]

## 🆘 Support

- **Documentation**: Check `/docs` route in the application
- **Help**: Visit `/help` route for support resources
- **Issues**: Report bugs and feature requests via GitHub issues

---

Built with ❤️ using Next.js, React Flow, and modern web technologies.
