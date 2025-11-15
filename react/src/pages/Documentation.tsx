import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  ExternalLink 
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(["getting-started"]);
  const location = useLocation();

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
        { title: "Quick Start Guide", href: "/docs/quickstart" },
        { title: "Installation", href: "/docs/installation" },
        { title: "First Project", href: "/docs/first-project" },
        { title: "Basic Concepts", href: "/docs/concepts" }
      ]
    },
    {
      id: "tutorials",
      title: "Tutorials",
      icon: Book,
      items: [
        { title: "Building a Web App", href: "/docs/tutorials/web-app" },
        { title: "Data Pipeline Setup", href: "/docs/tutorials/data-pipeline" },
        { title: "ML Workflow", href: "/docs/tutorials/ml-workflow" },
        { title: "Multi-Cloud Deploy", href: "/docs/tutorials/multi-cloud" }
      ]
    },
    {
      id: "api",
      title: "API Reference",
      icon: Code,
      items: [
        { title: "REST API", href: "/docs/api/rest" },
        { title: "GraphQL API", href: "/docs/api/graphql" },
        { title: "Webhooks", href: "/docs/api/webhooks" },
        { title: "Rate Limits", href: "/docs/api/limits" }
      ]
    },
    {
      id: "integrations",
      title: "Integrations",
      icon: Zap,
      items: [
        { title: "AWS Integration", href: "/docs/integrations/aws" },
        { title: "Azure Integration", href: "/docs/integrations/azure" },
        { title: "Google Cloud", href: "/docs/integrations/gcp" },
        { title: "GitHub Actions", href: "/docs/integrations/github" }
      ]
    },
    {
      id: "configuration",
      title: "Configuration",
      icon: Settings,
      items: [
        { title: "Environment Setup", href: "/docs/config/environment" },
        { title: "Authentication", href: "/docs/config/auth" },
        { title: "Team Management", href: "/docs/config/teams" },
        { title: "Billing & Usage", href: "/docs/config/billing" }
      ]
    },
    {
      id: "security",
      title: "Security",
      icon: Shield,
      items: [
        { title: "Security Overview", href: "/docs/security/overview" },
        { title: "Access Control", href: "/docs/security/access" },
        { title: "Compliance", href: "/docs/security/compliance" },
        { title: "Audit Logs", href: "/docs/security/audit" }
      ]
    }
  ];

  const quickLinks = [
    { title: "API Keys Setup", href: "/docs/api-keys", description: "Generate and manage your API keys" },
    { title: "Terraform Export", href: "/docs/terraform", description: "Export your designs as Terraform code" },
    { title: "Template Library", href: "/templates", description: "Browse our collection of templates" },
    { title: "Support", href: "/support", description: "Get help from our support team" }
  ];

  const isActive = (href: string) => location.pathname === href;

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
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-80 bg-card border-r border-border sticky top-16 h-screen overflow-y-auto">
          <div className="p-6">
            <nav className="space-y-4">
              {sidebarSections.map((section) => (
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
                        <Link
                          key={item.href}
                          to={item.href}
                          className={`block text-sm p-2 rounded-md transition-smooth ${
                            isActive(item.href)
                              ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
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
              <div className="grid md:grid-cols-2 gap-4">
                {quickLinks.map((link, index) => (
                  <Card key={index} className="card-hover border-border">
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
                        Access to your preferred cloud provider account
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
                          <Link to="/signup">
                            <Button size="sm" className="btn-primary">
                              Sign Up Now
                            </Button>
                          </Link>
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
                          <Link to="/templates">
                            <Button size="sm" variant="outline" className="btn-ghost">
                              Browse Templates
                            </Button>
                          </Link>
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
                          <Badge variant="secondary">Coming Soon</Badge>
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
                  Popular Tutorials
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="card-hover border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Building Your First Web App</CardTitle>
                      <Badge variant="outline" className="w-fit">30 min read</Badge>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        Learn how to create a scalable web application using CloudFlow's serverless template.
                      </CardDescription>
                      <Button size="sm" variant="outline" className="btn-ghost">
                        Start Tutorial
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="card-hover border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Data Pipeline Essentials</CardTitle>
                      <Badge variant="outline" className="w-fit">45 min read</Badge>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        Build a complete ETL pipeline from data ingestion to analysis and visualization.
                      </CardDescription>
                      <Button size="sm" variant="outline" className="btn-ghost">
                        Start Tutorial
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Documentation;