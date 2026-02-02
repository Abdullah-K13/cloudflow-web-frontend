"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Book, 
  Rocket, 
  Code, 
  Settings, 
  Shield, 
  Zap, 
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Server,
  Cloud,
  Database,
  DollarSign,
  FileText
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface DocItem {
  title: string;
  href: string;
  docFile: string;
  description?: string;
  keywords?: string[];
}

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(["getting-started", "using-cloudflow", "features"]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize selected doc from URL params
  useEffect(() => {
    const doc = searchParams?.get("doc");
    if (doc) {
      setSelectedDoc(doc);
      loadDocContent(doc);
    }
  }, [searchParams]);

  // User-friendly documentation content
  const documentationContent: Record<string, string> = {
    "what-is-cloudflow": `# What is CloudFlow?

CloudFlow is a visual cloud infrastructure design platform that makes it easy to build, deploy, and manage cloud architectures without writing code.

## Why CloudFlow?

**Design Visually**: Use our intuitive drag-and-drop canvas to design your cloud infrastructure. No coding required!

**Multi-Cloud Support**: Work with AWS, Azure, and Google Cloud Platform all from one interface.

**Save Time**: Build complex architectures in minutes instead of hours or days.

**Save Money**: Get AI-powered cost optimization suggestions to reduce your cloud bills.

**Deploy Instantly**: Deploy your designs directly to the cloud with one click.

## Key Features

- **Visual Canvas**: Drag and drop services onto a canvas to design your architecture
- **Pre-built Templates**: Start with proven patterns for common use cases
- **Real-time Cost Estimation**: See costs before you deploy
- **Cost Optimization**: Get suggestions to reduce your cloud spending
- **Multi-Cloud**: Switch between AWS, Azure, and GCP seamlessly
- **One-Click Deploy**: Deploy your designs directly to your cloud account`,

    "first-project": `# Creating Your First Project

Follow these simple steps to create your first cloud architecture with CloudFlow.

## Step 1: Sign Up

1. Click the "Sign Up" button in the top right corner
2. Enter your email and create a password
3. Verify your email address

## Step 2: Connect Your Cloud Account

1. Go to Settings
2. Click on "Cloud Credentials"
3. Choose your cloud provider (AWS, Azure, or GCP)
4. Enter your credentials
5. Save your settings

## Step 3: Start Designing

1. Click "Workplace" in the sidebar
2. You'll see a blank canvas
3. Drag services from the left panel onto the canvas
4. Connect services by drawing lines between them
5. Configure each service using the right panel

## Step 4: Deploy

1. Click the "Deploy" button
2. Review your architecture
3. Confirm deployment
4. Wait for deployment to complete

## Tips for Beginners

- Start with a template from the Templates page
- Use the cost estimation feature to see pricing before deploying
- Try the cost optimization feature to save money
- Check the monitoring dashboard to see your deployed resources`,

    "cloud-setup": `# Setting Up Cloud Accounts

Connect your AWS, Azure, or Google Cloud accounts to start deploying with CloudFlow.

## AWS Setup

### Option 1: Access Keys (Recommended for Testing)

1. Log in to your AWS account
2. Go to IAM → Users → Your User → Security Credentials
3. Click "Create Access Key"
4. Copy the Access Key ID and Secret Access Key
5. In CloudFlow, go to Settings → Cloud Credentials → AWS
6. Paste your credentials and save

### Option 2: IAM Role (Recommended for Production)

1. Create an IAM role with necessary permissions
2. Attach the role to your CloudFlow deployment
3. CloudFlow will automatically use the role credentials

## Azure Setup

1. Log in to Azure Portal
2. Go to Azure Active Directory → App Registrations
3. Create a new registration
4. Note the Application (client) ID, Directory (tenant) ID
5. Create a client secret
6. In CloudFlow, go to Settings → Cloud Credentials → Azure
7. Enter your credentials and save

## Google Cloud Setup

1. Go to Google Cloud Console
2. Create a service account
3. Download the JSON key file
4. In CloudFlow, go to Settings → Cloud Credentials → GCP
5. Upload your JSON key file and save

## Security Tips

- Never share your credentials
- Use IAM roles when possible
- Rotate credentials regularly
- Use separate accounts for testing and production`,

    "canvas": `# The Canvas Workspace

The canvas is where you design your cloud architecture. It's intuitive and easy to use!

## Getting Started

1. **Open the Canvas**: Click "Workplace" in the sidebar
2. **View Services**: See all available services in the left panel
3. **Add Services**: Drag services from the left panel onto the canvas
4. **Configure**: Click on a service to configure it in the right panel

## Canvas Features

### Drag and Drop
- Drag any service icon from the left panel
- Drop it anywhere on the canvas
- Services automatically snap to a grid for alignment

### Zoom and Pan
- Use your mouse wheel to zoom in and out
- Click and drag the background to pan around
- Use the minimap in the bottom right to navigate large designs

### Service Configuration
- Click any service on the canvas
- The right panel shows configuration options
- Configure memory, timeout, storage, and more

### Connecting Services
- Click and drag from one service to another
- Choose the connection type (notify, invoke, read, write)
- Connections show how data flows between services

## Tips

- Use templates to get started quickly
- Check the cost estimation panel on the left
- Use the search bar to find specific services
- Save your work frequently`,

    "adding-services": `# Adding Services

Learn how to add and configure cloud services in your architecture.

## Adding a Service

1. **Find the Service**: Browse the left panel or use the search bar
2. **Drag to Canvas**: Click and drag the service icon onto the canvas
3. **Configure**: Click the service to open the configuration panel

## Available Services

### AWS Services
- **Lambda**: Serverless functions for running code
- **S3**: Object storage for files and data
- **DynamoDB**: NoSQL database
- **API Gateway**: REST API endpoints
- **SQS**: Message queues
- **SNS**: Notifications and pub/sub
- **Step Functions**: Workflow orchestration
- **EventBridge**: Event-driven architecture

### Azure Services
- **Function App**: Serverless functions
- **Storage Account**: File and blob storage
- **Cosmos DB**: NoSQL database
- **Service Bus**: Message queues
- **Container Apps**: Containerized applications
- **API Management**: API gateway

### Google Cloud Services
- **Cloud Functions**: Serverless functions
- **Cloud Storage**: Object storage
- **Firestore**: NoSQL database
- **Pub/Sub**: Messaging service
- **Cloud Run**: Containerized applications

## Configuring Services

Each service has different configuration options:

- **Lambda/Function App**: Memory, timeout, runtime, handler
- **Storage**: Versioning, encryption, access policies
- **Database**: Partition keys, billing mode, capacity
- **API Gateway**: CORS, authentication, rate limiting

## Best Practices

- Start with default configurations
- Adjust based on your needs
- Use cost estimation to see pricing
- Check cost optimization suggestions`,

    "connecting-services": `# Connecting Services

Connect services together to build powerful workflows and data pipelines.

## How to Connect

1. **Click and Drag**: Click on one service and drag to another
2. **Choose Intent**: Select how services should connect
3. **Configure**: Set connection-specific options if needed

## Connection Types

### Notify
One service sends notifications to another.
- **Example**: S3 → SQS (when a file is uploaded, notify the queue)

### Invoke
One service calls another service.
- **Example**: API Gateway → Lambda (API calls trigger a function)

### Consume
One service processes data from another.
- **Example**: SQS → Lambda (function processes messages from queue)

### Read/Write
One service accesses data in another.
- **Example**: Lambda → DynamoDB (function reads/writes to database)

## Common Patterns

### Event-Driven Pipeline
Storage → Queue → Function → Database
- File uploaded triggers processing pipeline

### API Backend
API Gateway → Lambda → Database
- REST API that stores data in a database

### Data Processing
Storage → Function → Queue → Function → Storage
- Process data through multiple stages

## Tips

- Use meaningful connection names
- Configure batch sizes for queues
- Set up proper error handling
- Test connections before deploying`,

    "deploying": `# Deploying Your Architecture

Deploy your designs to the cloud with one click.

## Before Deploying

1. **Review Your Design**: Make sure everything looks correct
2. **Check Costs**: Review the cost estimation
3. **Verify Credentials**: Ensure your cloud account is connected
4. **Save Your Work**: Save your project

## Deployment Steps

1. **Click Deploy**: Click the "Deploy" button in the top toolbar
2. **Review**: Review the deployment summary
3. **Confirm**: Click "Confirm Deployment"
4. **Wait**: Deployment typically takes 2-5 minutes
5. **Monitor**: Watch the deployment progress

## What Happens During Deployment

- CloudFlow generates infrastructure code
- Resources are created in your cloud account
- Services are configured and connected
- Your architecture goes live!

## After Deployment

- **Check Status**: View deployment status in the observability dashboard
- **Monitor**: Use the monitoring features to track your resources
- **Update**: Make changes and redeploy
- **Destroy**: Remove resources when no longer needed

## Troubleshooting

If deployment fails:
- Check your cloud credentials
- Verify you have necessary permissions
- Review error messages
- Try deploying individual services first`,

    "templates": `# Using Templates

Start with pre-built templates for common cloud architecture patterns.

## What are Templates?

Templates are ready-to-use cloud architectures for common use cases. They save you time and follow best practices.

## Available Templates

### Serverless API
- API Gateway + Lambda + DynamoDB
- Perfect for REST APIs and web backends

### Data Pipeline
- S3 + SQS + Lambda + SNS
- Process files and send notifications

### Static Website
- CloudFront + S3
- Host static websites with CDN

### Event Processing
- EventBridge + Lambda + DynamoDB
- Process events and store data

## Using a Template

1. **Browse Templates**: Go to the Templates page
2. **Choose a Template**: Click on a template to see details
3. **Customize**: Modify the template to fit your needs
4. **Deploy**: Deploy the template to your cloud account

## Customizing Templates

- Add or remove services
- Change service configurations
- Modify connections
- Adjust resource sizes

## Creating Your Own Template

1. Design your architecture on the canvas
2. Save it as a template
3. Share with your team
4. Reuse for future projects`,

    "cost-optimization": `# Cost Optimization

Save money on your cloud infrastructure with AI-powered optimization suggestions.

## How It Works

1. **Analyze**: CloudFlow analyzes your architecture
2. **Suggest**: Get personalized cost-saving suggestions
3. **Review**: See potential savings for each suggestion
4. **Apply**: Apply suggestions with one click

## Types of Suggestions

### Service Substitutions
- Replace expensive services with cheaper alternatives
- Example: Use Lambda instead of EC2 for short-running tasks

### Configuration Optimizations
- Adjust resource sizes and settings
- Example: Reduce Lambda memory if not needed

### Architecture Improvements
- Restructure for better efficiency
- Example: Use Step Functions for complex workflows

## Using Cost Optimization

1. **Design Your Architecture**: Create your design on the canvas
2. **Click Optimize**: Click the "Optimize Costs" button
3. **Review Suggestions**: See all optimization opportunities
4. **Apply Changes**: Click to apply suggestions
5. **See Savings**: View your potential monthly savings

## Best Practices

- Review suggestions before applying
- Test changes in a development environment first
- Monitor costs after applying changes
- Use optimization regularly as your needs change`,

    "cost-estimation": `# Cost Estimation

See how much your infrastructure will cost before you deploy.

## How It Works

CloudFlow calculates costs based on:
- Service types and configurations
- Expected usage patterns
- Current cloud provider pricing

## Viewing Costs

1. **Add Services**: Add services to your canvas
2. **Configure**: Set resource sizes and settings
3. **See Costs**: View cost breakdown in the left panel
4. **Adjust**: Modify configurations to see cost changes

## Cost Breakdown

- **Per Service**: See cost for each service
- **Total Monthly**: View total estimated monthly cost
- **Breakdown**: Understand what drives costs

## Tips for Cost Management

- Start small and scale up as needed
- Use cost optimization suggestions
- Monitor actual costs after deployment
- Review and adjust regularly`,

    "monitoring": `# Monitoring & Observability

Monitor your deployed projects and track their health.

## Observability Dashboard

View all your deployed projects in one place:
- **Deployed Projects**: See all active deployments
- **Pipeline Runs**: Track pipeline execution history
- **Scheduled Pipelines**: View scheduled deployments

## What You Can Monitor

### Deployment Status
- See if deployments succeeded or failed
- View deployment timestamps
- Check resource counts

### Pipeline Execution
- Track pipeline runs
- See execution times
- View success/failure rates

### Resource Health
- Monitor service health
- View error rates
- Check performance metrics

## Using the Dashboard

1. **Go to Observability**: Click "Observability" in the sidebar
2. **View Projects**: See all your deployed projects
3. **Check Status**: View deployment and health status
4. **Review History**: See past pipeline runs

## Best Practices

- Check the dashboard regularly
- Set up alerts for failures
- Review pipeline history
- Monitor costs alongside health`,

    "aws-services": `# AWS Services

CloudFlow supports a wide range of AWS services for building cloud architectures.

## Available Services

### Compute
- **Lambda**: Run code without managing servers
- **EC2**: Virtual servers in the cloud
- **Step Functions**: Orchestrate workflows

### Storage
- **S3**: Store and retrieve any amount of data
- **DynamoDB**: Fast NoSQL database

### Networking
- **API Gateway**: Create REST APIs
- **VPC**: Isolated cloud network

### Messaging
- **SQS**: Message queues
- **SNS**: Notifications and pub/sub
- **EventBridge**: Event-driven architecture
- **Kinesis**: Real-time data streaming

## Common Use Cases

### Web Application
API Gateway → Lambda → DynamoDB
- Build scalable web backends

### Data Processing
S3 → Lambda → SQS → Lambda → S3
- Process files and data

### Event-Driven
EventBridge → Lambda → SNS
- React to events automatically

## Getting Started

1. Connect your AWS account
2. Drag AWS services onto the canvas
3. Configure services as needed
4. Connect services together
5. Deploy to AWS`,

    "azure-services": `# Azure Services

Build cloud architectures using Microsoft Azure services.

## Available Services

### Compute
- **Function App**: Serverless functions
- **Container Apps**: Run containerized applications
- **Virtual Machines**: Full control servers

### Storage
- **Storage Account**: File and blob storage
- **Cosmos DB**: Globally distributed database

### Networking
- **API Management**: API gateway and management
- **Virtual Network**: Isolated network infrastructure

### Messaging
- **Service Bus**: Message queues and topics

### Other Services
- **Key Vault**: Secure secret storage
- **Application Insights**: Application monitoring
- **SQL Database**: Relational database

## Common Use Cases

### Serverless API
API Management → Function App → Cosmos DB
- Build serverless REST APIs

### Data Pipeline
Storage → Service Bus → Function App
- Process data through queues

### Containerized Apps
Container Apps → Storage → Cosmos DB
- Run containerized applications

## Getting Started

1. Connect your Azure account
2. Drag Azure services onto the canvas
3. Configure services
4. Connect services
5. Deploy to Azure`,

    "gcp-services": `# Google Cloud Services

Use Google Cloud Platform services in your architectures.

## Available Services

### Compute
- **Cloud Functions**: Serverless functions
- **Cloud Run**: Containerized applications

### Storage
- **Cloud Storage**: Object storage
- **Firestore**: NoSQL database

### Messaging
- **Pub/Sub**: Messaging and event streaming

### Other Services
- **Secret Manager**: Secure secret storage

## Common Use Cases

### Serverless Backend
Cloud Functions → Firestore
- Build serverless applications

### Event Processing
Pub/Sub → Cloud Functions → Cloud Storage
- Process events and store results

### Container Apps
Cloud Run → Cloud Storage → Firestore
- Run containerized applications

## Getting Started

1. Connect your GCP account
2. Drag GCP services onto the canvas
3. Configure services
4. Connect services
5. Deploy to GCP`,

    "faq": `# Frequently Asked Questions

Common questions about using CloudFlow.

## General Questions

**Q: What is CloudFlow?**
A: CloudFlow is a visual platform for designing and deploying cloud architectures without writing code.

**Q: Do I need to know how to code?**
A: No! CloudFlow is designed for users of all technical levels. The visual interface makes it easy.

**Q: Which cloud providers are supported?**
A: CloudFlow supports AWS, Microsoft Azure, and Google Cloud Platform.

**Q: Is CloudFlow free?**
A: CloudFlow itself is free to use. You only pay for the cloud resources you deploy.

## Getting Started

**Q: How do I create my first project?**
A: Sign up, connect your cloud account, and start designing on the canvas. See our "Creating Your First Project" guide.

**Q: Do I need cloud provider accounts?**
A: Yes, you need accounts with AWS, Azure, or GCP to deploy resources.

**Q: How do I connect my cloud account?**
A: Go to Settings → Cloud Credentials and enter your credentials. See "Setting Up Cloud Accounts" for details.

## Using CloudFlow

**Q: Can I modify templates?**
A: Yes! Templates are starting points that you can customize to fit your needs.

**Q: How accurate is cost estimation?**
A: Cost estimates are based on current cloud provider pricing and your configurations. Actual costs may vary based on usage.

**Q: Can I deploy to multiple cloud providers?**
A: Yes, you can create separate projects for different cloud providers.

## Troubleshooting

**Q: My deployment failed. What should I do?**
A: Check your cloud credentials, verify permissions, and review error messages. See our troubleshooting guide.

**Q: How do I delete deployed resources?**
A: Use the destroy feature in the observability dashboard to remove deployed resources.`,

    "troubleshooting": `# Troubleshooting

Solutions to common problems when using CloudFlow.

## Deployment Issues

### Deployment Failed

**Problem**: Deployment fails with an error message.

**Solutions**:
- Check your cloud credentials are correct
- Verify you have necessary permissions in your cloud account
- Ensure your cloud account has available quota
- Review the error message for specific details
- Try deploying individual services first

### Credentials Not Working

**Problem**: Can't connect to your cloud account.

**Solutions**:
- Verify credentials are correct
- Check if credentials have expired
- Ensure credentials have necessary permissions
- Try regenerating credentials
- For AWS, check IAM role permissions

## Canvas Issues

### Services Not Appearing

**Problem**: Can't see services on the canvas.

**Solutions**:
- Refresh the page
- Check your internet connection
- Clear browser cache
- Try a different browser

### Can't Connect Services

**Problem**: Unable to draw connections between services.

**Solutions**:
- Ensure both services are on the canvas
- Check if the connection type is supported
- Verify services are compatible
- Try re-adding the services

## Cost Estimation Issues

### Costs Not Showing

**Problem**: Cost estimation panel is empty.

**Solutions**:
- Ensure services are configured
- Check your internet connection
- Refresh the page
- Verify cloud provider pricing API is accessible

## Performance Issues

### Slow Loading

**Problem**: CloudFlow is loading slowly.

**Solutions**:
- Check your internet connection
- Clear browser cache
- Close other browser tabs
- Try a different browser
- Disable browser extensions

## Getting More Help

If you're still experiencing issues:
- Check our FAQ section
- Review best practices
- Contact support through the help page`,

    "best-practices": `# Best Practices

Tips and recommendations for using CloudFlow effectively.

## Design Best Practices

### Start Simple
- Begin with basic architectures
- Add complexity gradually
- Test each addition

### Use Templates
- Start with templates when possible
- Customize templates to your needs
- Learn from template structures

### Plan Before Building
- Sketch your architecture first
- Consider data flow
- Think about scalability

## Cost Management

### Estimate First
- Always check costs before deploying
- Use cost optimization suggestions
- Start with smaller resource sizes

### Monitor Regularly
- Check actual costs after deployment
- Review cost optimization suggestions periodically
- Adjust resources based on usage

### Right-Size Resources
- Don't over-provision
- Start small and scale up
- Use auto-scaling when available

## Security Best Practices

### Credentials
- Never share credentials
- Use IAM roles when possible
- Rotate credentials regularly
- Use separate accounts for dev/prod

### Access Control
- Limit who can deploy
- Review deployments regularly
- Use cloud provider security features

## Deployment Best Practices

### Test First
- Test in development environment
- Verify configurations
- Check connections between services

### Monitor After Deployment
- Check deployment status
- Monitor resource health
- Review logs and metrics

### Version Control
- Save your designs
- Document changes
- Keep backups

## Performance Tips

### Optimize Connections
- Minimize unnecessary connections
- Use efficient data flow patterns
- Consider batch processing

### Resource Sizing
- Match resources to workload
- Use cost optimization
- Monitor and adjust`,

  };

  const loadDocContent = (docId: string) => {
    setLoadingDoc(true);
    setDocContent(null);
    
    // Simulate loading for better UX
    setTimeout(() => {
      const content = documentationContent[docId] || `# ${docId}\n\nDocumentation content coming soon.`;
      setDocContent(content);
      setLoadingDoc(false);
    }, 300);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const sidebarSections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Rocket,
      items: [
        { title: "What is CloudFlow?", href: "/docs?doc=what-is-cloudflow", docFile: "what-is-cloudflow", description: "Learn about CloudFlow and what it can do for you", keywords: ["overview", "introduction", "what is", "cloudflow", "features"] },
        { title: "Creating Your First Project", href: "/docs?doc=first-project", docFile: "first-project", description: "Step-by-step guide to create your first cloud architecture", keywords: ["first", "project", "tutorial", "beginner", "start"] },
        { title: "Setting Up Cloud Accounts", href: "/docs?doc=cloud-setup", docFile: "cloud-setup", description: "How to connect your AWS, Azure, or GCP accounts", keywords: ["setup", "cloud", "aws", "azure", "gcp", "credentials", "account"] }
      ]
    },
    {
      id: "using-cloudflow",
      title: "Using CloudFlow",
      icon: Book,
      items: [
        { title: "The Canvas Workspace", href: "/docs?doc=canvas", docFile: "canvas", description: "Learn how to use the drag-and-drop canvas to design architectures", keywords: ["canvas", "workspace", "drag", "drop", "design", "interface"] },
        { title: "Adding Services", href: "/docs?doc=adding-services", docFile: "adding-services", description: "How to add and configure cloud services", keywords: ["services", "add", "configure", "lambda", "s3", "database"] },
        { title: "Connecting Services", href: "/docs?doc=connecting-services", docFile: "connecting-services", description: "How to connect services together to build workflows", keywords: ["connect", "connections", "edges", "workflow", "pipeline"] },
        { title: "Deploying Your Architecture", href: "/docs?doc=deploying", docFile: "deploying", description: "How to deploy your designs to the cloud", keywords: ["deploy", "deployment", "publish", "launch", "cloud"] }
      ]
    },
    {
      id: "features",
      title: "Features",
      icon: Zap,
      items: [
        { title: "Using Templates", href: "/docs?doc=templates", docFile: "templates", description: "How to use pre-built templates for common patterns", keywords: ["templates", "patterns", "pre-built", "quick start"] },
        { title: "Cost Optimization", href: "/docs?doc=cost-optimization", docFile: "cost-optimization", description: "Save money with AI-powered cost optimization suggestions", keywords: ["cost", "optimization", "savings", "money", "budget", "pricing"] },
        { title: "Cost Estimation", href: "/docs?doc=cost-estimation", docFile: "cost-estimation", description: "See how much your infrastructure will cost before deploying", keywords: ["cost", "estimation", "pricing", "calculate", "budget"] },
        { title: "Monitoring & Observability", href: "/docs?doc=monitoring", docFile: "monitoring", description: "Monitor your deployed projects and pipelines", keywords: ["monitoring", "observability", "dashboard", "status", "health"] }
      ]
    },
    {
      id: "cloud-providers",
      title: "Cloud Providers",
      icon: Cloud,
      items: [
        { title: "AWS Services", href: "/docs?doc=aws-services", docFile: "aws-services", description: "Available AWS services and how to use them", keywords: ["aws", "amazon", "lambda", "s3", "dynamodb", "services"] },
        { title: "Azure Services", href: "/docs?doc=azure-services", docFile: "azure-services", description: "Available Azure services and how to use them", keywords: ["azure", "microsoft", "functions", "storage", "services"] },
        { title: "Google Cloud Services", href: "/docs?doc=gcp-services", docFile: "gcp-services", description: "Available GCP services and how to use them", keywords: ["gcp", "google", "cloud", "functions", "storage", "services"] }
      ]
    },
    {
      id: "troubleshooting",
      title: "Help & Support",
      icon: Settings,
      items: [
        { title: "Common Questions", href: "/docs?doc=faq", docFile: "faq", description: "Frequently asked questions and answers", keywords: ["faq", "questions", "help", "common", "issues"] },
        { title: "Troubleshooting", href: "/docs?doc=troubleshooting", docFile: "troubleshooting", description: "Solutions to common problems", keywords: ["troubleshooting", "problems", "errors", "fix", "help"] },
        { title: "Best Practices", href: "/docs?doc=best-practices", docFile: "best-practices", description: "Tips and best practices for using CloudFlow", keywords: ["best practices", "tips", "guidelines", "recommendations"] }
      ]
    }
  ];

  // Flatten all documentation items for search
  const allDocs: DocItem[] = useMemo(() => {
    return sidebarSections.flatMap(section => 
      section.items.map(item => ({
        ...item,
        section: section.title
      }))
    );
  }, []);

  // Filter docs based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return sidebarSections;
    }

    const query = searchQuery.toLowerCase();
    return sidebarSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const keywordMatch = item.keywords?.some(kw => kw.toLowerCase().includes(query));
        return titleMatch || descMatch || keywordMatch;
      })
    })).filter(section => section.items.length > 0);
  }, [searchQuery, sidebarSections]);

  const quickLinks = [
    { title: "Template Library", href: "/templates", description: "Browse our collection of templates", docId: null },
    { title: "Getting Started", href: "/docs?doc=first-project", description: "Create your first project", docId: "first-project" },
    { title: "Cost Optimization", href: "/docs?doc=cost-optimization", description: "Save money on cloud costs", docId: "cost-optimization" },
    { title: "Using Templates", href: "/docs?doc=templates", description: "Learn about templates", docId: "templates" }
  ];

  const isActive = (href: string) => {
    const docParam = new URLSearchParams(href.split("?")[1] || "").get("doc");
    const currentDoc = searchParams?.get("doc");
    return docParam === currentDoc;
  };

  const handleDocClick = (docId: string) => {
    setSelectedDoc(docId);
    loadDocContent(docId);
    
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set("doc", docId);
    window.history.pushState({}, "", url.toString());
  };

  // Get selected documentation item
  const selectedDocItem = useMemo(() => {
    if (!selectedDoc) return null;
    return allDocs.find(doc => doc.docFile === selectedDoc);
  }, [selectedDoc, allDocs]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Search Header */}
      <div className="bg-card border-b border-border py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">Documentation</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Everything you need to build amazing cloud architectures with CloudFlow
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <div className="absolute right-3 top-3 text-sm text-muted-foreground">
                  {filteredSections.reduce((sum, section) => sum + section.items.length, 0)} results
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-80 bg-card border-r border-border sticky top-16 h-screen overflow-y-auto">
          <div className="p-6">
            <nav className="space-y-4">
              {filteredSections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No documentation found matching "{searchQuery}"</p>
                </div>
              ) : (
                filteredSections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center justify-between w-full text-left p-2 rounded-md hover:bg-muted transition-smooth"
                    >
                      <div className="flex items-center space-x-2">
                        <section.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{section.title}</span>
                      </div>
                      {expandedSections.includes(section.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    
                    {expandedSections.includes(section.id) && (
                      <div className="ml-6 mt-2 space-y-1">
                        {section.items.map((item) => (
                          <button
                            key={item.href}
                            onClick={() => handleDocClick(item.docFile)}
                            className={`block w-full text-left text-sm p-2 rounded-md transition-smooth ${
                              selectedDoc === item.docFile
                                ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                          >
                            <div className="font-medium">{item.title}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {!selectedDocItem ? (
              <>
                {/* Welcome Section */}
                <div className="mb-12">
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                      Welcome to CloudFlow Documentation
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Learn how to design, build, and deploy cloud architectures with our comprehensive guides, 
                      tutorials, and API documentation. Whether you're just starting or building complex 
                      multi-cloud solutions, we've got you covered.
                    </p>
                  </div>
                  
                  {/* Quick Links */}
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    {quickLinks.map((link, index) => (
                      <Card 
                        key={index} 
                        className="card-hover border-border cursor-pointer"
                        onClick={() => {
                          if (link.docId) {
                            handleDocClick(link.docId);
                          } else if (link.href.startsWith("/")) {
                            window.location.href = link.href;
                          }
                        }}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center justify-between">
                            {link.title}
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>{link.description}</CardDescription>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Getting Started Content */}
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center">
                        <Rocket className="h-6 w-6 mr-2 text-primary" />
                        Quick Start Guide
                      </h3>
                      <div className="prose prose-lg max-w-none">
                        <p className="text-muted-foreground leading-relaxed mb-6">
                          Get up and running with CloudFlow in just a few minutes. Follow these steps to create 
                          your first cloud architecture.
                        </p>
                        
                        <div className="bg-card border border-border rounded-lg p-6 mb-6">
                          <h4 className="font-semibold text-foreground mb-4">Prerequisites</h4>
                          <ul className="space-y-2 text-muted-foreground">
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              A CloudFlow account (sign up is free)
                            </li>
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              Basic understanding of cloud concepts
                            </li>
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              Access to your preferred cloud provider account (AWS, Azure, or GCP)
                            </li>
                          </ul>
                        </div>

                        <div className="grid gap-6">
                          <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                                1
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-2">Create Your Account</h4>
                                <p className="text-muted-foreground mb-4">
                                  Sign up for a free CloudFlow account and verify your email address.
                                </p>
                                <Button size="sm" className="btn-primary" asChild>
                                  <Link href="/signup">
                                    Sign Up Now
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                                2
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-2">Choose a Template</h4>
                                <p className="text-muted-foreground mb-4">
                                  Browse our library of pre-built templates or start with a blank canvas.
                                </p>
                                <Button size="sm" variant="outline" className="btn-use-template" asChild>
                                  <Link href="/templates">
                                    Browse Templates
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                                3
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-2">Design & Deploy</h4>
                                <p className="text-muted-foreground mb-4">
                                  Use our drag-and-drop interface to customize your architecture and deploy with one click.
                                </p>
                                <Button size="sm" variant="outline" className="btn-use-template" asChild>
                                  <Link href="/workplace">
                                    Open Canvas
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <Separator />

                    <section>
                      <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center">
                        <Book className="h-6 w-6 mr-2 text-secondary" />
                        Documentation Sections
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <Card className="card-hover border-border">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Server className="h-5 w-5 mr-2" />
                              Backend Documentation
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="mb-4">
                              Complete API reference, AWS capabilities, cost optimization, and templates system.
                            </CardDescription>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDocClick("BackendREADME.md")}
                            >
                              View Backend Docs
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="card-hover border-border">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Cloud className="h-5 w-5 mr-2" />
                              Cloud Providers
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="mb-4">
                              Integration guides for AWS, Azure, and Google Cloud Platform.
                            </CardDescription>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDocClick("CAPABILITIES.md")}
                            >
                              View Cloud Docs
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </section>
                  </div>
                </div>
              </>
            ) : (
              <div className="prose prose-lg max-w-none">
                <div className="bg-card border border-border rounded-lg p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-foreground mb-2">
                        {selectedDocItem?.title || "Documentation"}
                      </h2>
                      {selectedDocItem?.description && (
                        <p className="text-muted-foreground">{selectedDocItem.description}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDoc(null);
                        setDocContent(null);
                        const url = new URL(window.location.href);
                        url.searchParams.delete("doc");
                        window.history.pushState({}, "", url.toString());
                      }}
                    >
                      Back to Overview
                    </Button>
                  </div>
                  
                  <div className="border-t border-border pt-6">
                    {loadingDoc ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading documentation...</p>
                      </div>
                    ) : docContent ? (
                      <div className="markdown-content space-y-4">
                        {(() => {
                          const lines = docContent.split('\n');
                          const elements: React.ReactElement[] = [];
                          let inCodeBlock = false;
                          let codeBlockContent: string[] = [];
                          let codeBlockLang = '';
                          let listItems: string[] = [];
                          let inList = false;
                          
                          lines.forEach((line, idx) => {
                            // Code blocks
                            if (line.startsWith('```')) {
                              if (inCodeBlock) {
                                // End code block
                                elements.push(
                                  <pre key={`code-${idx}`} className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
                                    <code className="text-sm font-mono text-foreground">
                                      {codeBlockContent.join('\n')}
                                    </code>
                                  </pre>
                                );
                                codeBlockContent = [];
                                inCodeBlock = false;
                              } else {
                                // Start code block
                                codeBlockLang = line.substring(3).trim();
                                inCodeBlock = true;
                              }
                              return;
                            }
                            
                            if (inCodeBlock) {
                              codeBlockContent.push(line);
                              return;
                            }
                            
                            // Headers
                            if (line.startsWith('# ')) {
                              if (inList) {
                                elements.push(
                                  <ul key={`list-${idx}`} className="list-disc ml-6 mb-4 space-y-1">
                                    {listItems.map((item, i) => (
                                      <li key={i} className="text-muted-foreground">{item}</li>
                                    ))}
                                  </ul>
                                );
                                listItems = [];
                                inList = false;
                              }
                              elements.push(<h1 key={idx} className="text-3xl font-bold text-foreground mb-4 mt-8">{line.substring(2)}</h1>);
                              return;
                            }
                            if (line.startsWith('## ')) {
                              if (inList) {
                                elements.push(
                                  <ul key={`list-${idx}`} className="list-disc ml-6 mb-4 space-y-1">
                                    {listItems.map((item, i) => (
                                      <li key={i} className="text-muted-foreground">{item}</li>
                                    ))}
                                  </ul>
                                );
                                listItems = [];
                                inList = false;
                              }
                              elements.push(<h2 key={idx} className="text-2xl font-bold text-foreground mb-3 mt-6">{line.substring(3)}</h2>);
                              return;
                            }
                            if (line.startsWith('### ')) {
                              if (inList) {
                                elements.push(
                                  <ul key={`list-${idx}`} className="list-disc ml-6 mb-4 space-y-1">
                                    {listItems.map((item, i) => (
                                      <li key={i} className="text-muted-foreground">{item}</li>
                                    ))}
                                  </ul>
                                );
                                listItems = [];
                                inList = false;
                              }
                              elements.push(<h3 key={idx} className="text-xl font-semibold text-foreground mb-2 mt-4">{line.substring(4)}</h3>);
                              return;
                            }
                            if (line.startsWith('#### ')) {
                              if (inList) {
                                elements.push(
                                  <ul key={`list-${idx}`} className="list-disc ml-6 mb-4 space-y-1">
                                    {listItems.map((item, i) => (
                                      <li key={i} className="text-muted-foreground">{item}</li>
                                    ))}
                                  </ul>
                                );
                                listItems = [];
                                inList = false;
                              }
                              elements.push(<h4 key={idx} className="text-lg font-semibold text-foreground mb-2 mt-3">{line.substring(5)}</h4>);
                              return;
                            }
                            
                            // Horizontal rules
                            if (line.trim() === '---' || line.trim() === '***') {
                              if (inList) {
                                elements.push(
                                  <ul key={`list-${idx}`} className="list-disc ml-6 mb-4 space-y-1">
                                    {listItems.map((item, i) => (
                                      <li key={i} className="text-muted-foreground">{item}</li>
                                    ))}
                                  </ul>
                                );
                                listItems = [];
                                inList = false;
                              }
                              elements.push(<hr key={idx} className="my-6 border-border" />);
                              return;
                            }
                            
                            // Lists
                            if (line.match(/^[\-\*\+]\s/)) {
                              inList = true;
                              listItems.push(line.substring(2));
                              return;
                            }
                            
                            if (line.match(/^\d+\.\s/)) {
                              inList = true;
                              const match = line.match(/^\d+\.\s(.*)/);
                              if (match) listItems.push(match[1]);
                              return;
                            }
                            
                            // End list if we hit a non-list line
                            if (inList && line.trim() !== '') {
                              elements.push(
                                <ul key={`list-${idx}`} className="list-disc ml-6 mb-4 space-y-1">
                                  {listItems.map((item, i) => (
                                    <li key={i} className="text-muted-foreground">{item}</li>
                                  ))}
                                </ul>
                              );
                              listItems = [];
                              inList = false;
                            }
                            
                            // Regular text
                            if (line.trim()) {
                              const processedLine = line
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
                                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
                              
                              elements.push(
                                <p 
                                  key={idx} 
                                  className="text-muted-foreground leading-relaxed mb-4"
                                  dangerouslySetInnerHTML={{ __html: processedLine }}
                                />
                              );
                            } else if (!inList) {
                              elements.push(<br key={idx} />);
                            }
                          });
                          
                          // Close any remaining list
                          if (inList && listItems.length > 0) {
                            elements.push(
                              <ul key="list-final" className="list-disc ml-6 mb-4 space-y-1">
                                {listItems.map((item, i) => (
                                  <li key={i} className="text-muted-foreground">{item}</li>
                                ))}
                              </ul>
                            );
                          }
                          
                          return elements;
                        })()}
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-6 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">
                          Documentation content for <strong>{selectedDocItem?.docFile}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Click to load the documentation content.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

