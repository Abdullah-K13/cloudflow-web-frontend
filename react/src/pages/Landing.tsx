import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Cloud, Code, Shield, Users, Workflow, Database, Server, GitBranch } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Landing = () => {
  const features = [
    {
      icon: Workflow,
      title: "Drag & Drop Workspace",
      description: "Build cloud architectures visually with our intuitive drag-and-drop interface. No code required to get started."
    },
    {
      icon: Cloud,
      title: "Multi-Cloud Integration", 
      description: "Deploy across AWS, Azure, Google Cloud, and more. One platform for all your cloud infrastructure needs."
    },
    {
      icon: Database,
      title: "Pre-built Templates",
      description: "Choose from hundreds of tested templates for data pipelines, web apps, ML workflows, and enterprise solutions."
    },
    {
      icon: Code,
      title: "Auto Terraform Generation",
      description: "Every design automatically generates production-ready Terraform code. Export, customize, and deploy instantly."
    }
  ];

  const templates = [
    {
      title: "Data Lake Architecture",
      description: "Complete ETL pipeline with S3, Lambda, and Redshift",
      badge: "Popular",
      icon: Database
    },
    {
      title: "Serverless Web App",
      description: "CloudFront, API Gateway, Lambda, and DynamoDB stack",
      badge: "New",
      icon: Server
    },
    {
      title: "ML Training Pipeline", 
      description: "SageMaker workflow with automated model deployment",
      badge: "AI/ML",
      icon: GitBranch
    }
  ];

  const trustLogos = [
    "TechCorp", "DataFlow Inc", "CloudVision", "ScaleTech", "BuildFast"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="hero-section flex items-center justify-center py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 text-sm px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Now with Auto-Terraform Generation
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Visualize, Build & Deploy
              <span className="block text-primary mt-2">Multi-Cloud Architectures</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your cloud infrastructure ideas into reality with our visual design platform. 
              Drag, drop, connect, and deploy across any cloud provider in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link to="/signup">
                <Button size="lg" className="btn-primary text-lg px-8 py-6 shadow-glow">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/templates">
                <Button variant="outline" size="lg" className="btn-ghost text-lg px-8 py-6">
                  View Templates
                </Button>
              </Link>
            </div>
            
            <div className="text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to build in the cloud
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From visual design to production deployment, CloudFlow streamlines your entire cloud development workflow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover border-border">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              See CloudFlow in Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Watch how easy it is to design, configure, and deploy complex cloud architectures.
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="relative bg-gradient-to-br from-primary-light to-secondary-light rounded-2xl p-8 md:p-12 shadow-custom">
              <div className="bg-card rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-foreground">Visual Workspace</h3>
                  <Badge variant="outline">Live Demo</Badge>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium mb-2">Node Library</h4>
                    <p className="text-sm text-muted-foreground">Drag components from our extensive library</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium mb-2">Canvas</h4>
                    <p className="text-sm text-muted-foreground">Design your architecture visually</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium mb-2">Configuration</h4>
                    <p className="text-sm text-muted-foreground">Configure resources with forms</p>
                  </div>
                </div>
                <div className="mt-6 bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Generated Terraform</h4>
                  <code className="text-sm text-muted-foreground">
                    resource "aws_s3_bucket" "data_lake" {'{'}...{'}'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Start with proven templates
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Jump-start your projects with battle-tested architectures used by thousands of developers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {templates.map((template, index) => (
              <Card key={index} className="card-hover border-border">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <template.icon className="h-5 w-5 text-secondary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">{template.badge}</Badge>
                  </div>
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {template.description}
                  </CardDescription>
                  <Button variant="outline" size="sm" className="w-full btn-ghost">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/templates">
              <Button variant="outline" size="lg" className="btn-ghost">
                View All Templates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Trust Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-12">
            Trusted by leading development teams
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            {trustLogos.map((company, index) => (
              <div key={index} className="text-2xl font-bold text-muted-foreground">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;