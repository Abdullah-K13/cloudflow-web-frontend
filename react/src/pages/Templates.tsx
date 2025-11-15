import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Server, GitBranch, Globe, Zap, Shield, Search, Filter } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Templates = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { value: "all", label: "All Templates" },
    { value: "data", label: "Data & Analytics" },
    { value: "web", label: "Web Applications" },
    { value: "ml", label: "Machine Learning" },
    { value: "security", label: "Security" },
    { value: "serverless", label: "Serverless" }
  ];

  const templates = [
    {
      id: 1,
      title: "Data Lake Architecture",
      description: "Complete ETL pipeline with S3, Lambda, Glue, and Redshift for scalable data processing",
      category: "data",
      badge: "Popular",
      badgeVariant: "default" as const,
      icon: Database,
      complexity: "Intermediate",
      estimatedCost: "$200-500/month",
      services: ["S3", "Lambda", "Glue", "Redshift", "IAM"],
      useCase: "Perfect for companies processing large amounts of structured and unstructured data"
    },
    {
      id: 2,
      title: "Serverless Web App",
      description: "Full-stack serverless application with CloudFront, API Gateway, Lambda, and DynamoDB",
      category: "web",
      badge: "New",
      badgeVariant: "secondary" as const,
      icon: Server,
      complexity: "Beginner",
      estimatedCost: "$50-150/month",
      services: ["CloudFront", "API Gateway", "Lambda", "DynamoDB"],
      useCase: "Ideal for modern web applications requiring high scalability and low operational overhead"
    },
    {
      id: 3,
      title: "ML Training Pipeline",
      description: "End-to-end machine learning workflow with SageMaker, automated model training and deployment",
      category: "ml",
      badge: "AI/ML",
      badgeVariant: "outline" as const,
      icon: GitBranch,
      complexity: "Advanced",
      estimatedCost: "$300-800/month",
      services: ["SageMaker", "S3", "Lambda", "ECR", "CloudWatch"],
      useCase: "Comprehensive ML pipeline for data scientists and ML engineers"
    },
    {
      id: 4,
      title: "Multi-Tier Web Application",
      description: "Traditional 3-tier architecture with load balancer, auto-scaling, and RDS database",
      category: "web",
      badge: "Enterprise",
      badgeVariant: "outline" as const,
      icon: Globe,
      complexity: "Intermediate",
      estimatedCost: "$400-1000/month",
      services: ["ALB", "EC2", "RDS", "VPC", "Auto Scaling"],
      useCase: "Production-ready web applications requiring high availability and reliability"
    },
    {
      id: 5,
      title: "Event-Driven Architecture",
      description: "Microservices communication using EventBridge, SQS, SNS, and Lambda functions",
      category: "serverless",
      badge: "Trending",
      badgeVariant: "secondary" as const,
      icon: Zap,
      complexity: "Advanced",
      estimatedCost: "$100-300/month",
      services: ["EventBridge", "SQS", "SNS", "Lambda", "DynamoDB"],
      useCase: "Decoupled microservices architecture for complex distributed systems"
    },
    {
      id: 6,
      title: "Security & Compliance Stack",
      description: "Complete security monitoring with GuardDuty, SecurityHub, and CloudTrail integration",
      category: "security",
      badge: "Security",
      badgeVariant: "destructive" as const,
      icon: Shield,
      complexity: "Advanced",
      estimatedCost: "$200-600/month",
      services: ["GuardDuty", "SecurityHub", "CloudTrail", "Config", "IAM"],
      useCase: "Enterprise security monitoring and compliance for regulated industries"
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case "secondary": return "secondary";
      case "outline": return "outline";
      case "destructive": return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-card border-b border-border py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Choose from 100+ Proven Templates
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Jump-start your cloud projects with battle-tested architectures. Each template includes 
            pre-configured resources, best practices, and production-ready Terraform code.
          </p>
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates, services, or use cases..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">No templates found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-muted-foreground">
                  Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                  {selectedCategory !== "all" && ` in ${categories.find(c => c.value === selectedCategory)?.label}`}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="card-hover border-border h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <template.icon className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant={getBadgeVariant(template.badgeVariant)} className="text-xs">
                          {template.badge}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col">
                      <CardDescription className="mb-6 leading-relaxed">
                        {template.description}
                      </CardDescription>
                      
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Complexity:</span>
                          <Badge variant="outline" className="text-xs">
                            {template.complexity}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Est. Cost:</span>
                          <span className="font-medium text-foreground">{template.estimatedCost}</span>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Services:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.services.slice(0, 4).map((service, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                            {template.services.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.services.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Best for:</p>
                          <p className="text-sm text-foreground leading-relaxed">
                            {template.useCase}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-auto space-y-2">
                        <Button className="w-full btn-primary">
                          Use This Template
                        </Button>
                        <Button variant="outline" size="sm" className="w-full btn-ghost">
                          Preview & Customize
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Templates;