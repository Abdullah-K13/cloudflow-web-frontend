//app/component/workplace-client.tsx
"use client"

import { useRef, useState, useEffect } from "react";
import { ReactFlowProvider } from "reactflow";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import TopBar from "./topbar";
import Canvas from "./canvas";
import LeftPanel from "./leftpanel";
import ServiceConfigPanel from "./service-config-panel";
import DeleteZone from "./deletezone";
import UnsavedChangesModal from "./ui/unsaved-changes-modal";
import { useUnsavedChanges } from "../hooks/use-unsaved-changes";
import type { ServiceItem } from "./types";

interface DraggedItem {
  label: string;
  img: string;
}

export default function WorkplaceClient({ pipelineId: propPipelineId }: { pipelineId?: string } = {}) {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(typeof window !== "undefined");
  const [idCounter, setIdCounter] = useState(0);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [isDraggingExisting, setIsDraggingExisting] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const sidebarRenderedRef = useRef(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [selectedForCost, setSelectedForCost] = useState<{ id: string; type: string }[]>([]);
  const [nodesOnCanvasForCost, setNodesOnCanvasForCost] = useState<{ id: string; type: string; data?: { cost?: number; label?: string } }[]>([]);
  const [projectName, setProjectName] = useState("");
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [isNewPipeline, setIsNewPipeline] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [initialEdges, setInitialEdges] = useState<Array<{ from: string; to: string }>>([]);
  const [initialProvider, setInitialProvider] = useState<"aws" | "gcp" | "azure" | undefined>(undefined);
  const canvasRef = useRef<{ getPlan: () => any; getPrompt: () => string; buildDeploymentPayload: (plan: any) => any; getProvider: () => "aws" | "gcp" | "azure"; getAllServices: () => any[] } | null>(null);

  // Track unsaved changes - check if there are services on canvas
  // Use nodesOnCanvasForCost which is updated by the Canvas component
  useEffect(() => {
    // Check if there are nodes on canvas (services from any cloud provider)
    const hasChanges = nodesOnCanvasForCost.length > 0;
    const shouldTrack = hasChanges && isNewPipeline;
    setHasUnsavedChanges(shouldTrack);
    console.log("Unsaved changes tracking:", {
      nodesCount: nodesOnCanvasForCost.length,
      itemsCount: items.length,
      isNewPipeline,
      hasUnsavedChanges: shouldTrack
    });
  }, [nodesOnCanvasForCost, items, isNewPipeline]);

  const { allowNavigation } = useUnsavedChanges({
    hasUnsavedChanges,
    onBeforeNavigate: (targetPath) => {
      console.log("Navigation intercepted:", targetPath);
      setPendingNavigation(targetPath);
      setShowUnsavedModal(true);
    },
    enabled: true, // Always enabled, we check hasUnsavedChanges inside
  });


  useEffect(() => {
    setIsClient(true);

    // Check if this is a new pipeline (no saved pipeline ID in URL, route params, or props)
    const urlParams = new URLSearchParams(window.location.search);
    const queryPipelineId = urlParams.get("id");
    const pipelineName = urlParams.get("name");
    const finalPipelineId = propPipelineId || queryPipelineId;
    setCurrentPipelineId(finalPipelineId);
    setIsNewPipeline(!finalPipelineId);
    
    // Set initial pipeline name if provided
    if (pipelineName) {
      setProjectName(decodeURIComponent(pipelineName));
    }
  }, [propPipelineId]);

  // Ensure sidebar is always visible
  useEffect(() => {
    setIsLeftPanelCollapsed(false);
  }, [currentPipelineId]);

  // Load pipeline data when pipeline ID is present
  useEffect(() => {
    const loadPipeline = async () => {
      if (!currentPipelineId || !isClient) return;

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (!token) {
          console.log("No auth token, cannot load pipeline");
          return;
        }

        const API_BASE =
          typeof window === "undefined"
            ? process.env.API_BASE_URL || "http://127.0.0.1:8000"
            : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

        const res = await fetch(`${API_BASE}/pipelines/${currentPipelineId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("Failed to load pipeline:", res.statusText);
          return;
        }

        const pipeline = await res.json();
        console.log("Loaded pipeline:", pipeline);

        // Set project name
        if (pipeline.name) {
          setProjectName(pipeline.name);
        }

        // Set provider based on pipeline cloud
        if (pipeline.cloud) {
          const cloudToProvider: Record<string, "aws" | "gcp" | "azure"> = {
            aws: "aws",
            gcp: "gcp",
            azure: "azure",
          };
          setInitialProvider(cloudToProvider[pipeline.cloud] || "aws");
        }

        // Restore nodes from payload if it exists
        if (pipeline.payload && pipeline.payload.nodes) {
          // Map kind back to service ID, label, and image
          const kindToServiceMap: Record<string, { id: string; label: string; img: string }> = {
            // AWS
            "aws.s3": { id: "s3", label: "AWS S3", img: "/aws-icons/s3.png" },
            "aws.sqs": { id: "sqs", label: "AWS SQS", img: "/aws-icons/sqs.png" },
            "aws.lambda": { id: "lambda", label: "AWS Lambda", img: "/aws-icons/lambda.png" },
            "aws.dynamodb": { id: "dynamodb", label: "DynamoDB", img: "/aws-icons/DynamoDB.png" },
            "aws.apigw": { id: "apigateway", label: "API Gateway", img: "/aws-api-gateway-icon.png" },
            "aws.sns": { id: "sns", label: "AWS SNS", img: "/aws-icons/sns.png" },
            "aws.events.rule": { id: "events_rule", label: "EventBridge Rule", img: "/aws-icons/eventbridge.png" },
            "aws.sfn": { id: "sfn", label: "Step Functions", img: "/aws-icons/stepfunctions.png" },
            "aws.kinesis": { id: "kinesis", label: "AWS Kinesis", img: "/aws-icons/kinesis.png" },
            "aws.ec2": { id: "ec2", label: "AWS EC2", img: "/aws-icons/ec2.png" },
            "aws.rds": { id: "rds", label: "AWS RDS", img: "/aws-icons/rds.png" },
            "aws.ecs": { id: "ecs", label: "AWS ECS", img: "/aws-icons/ecs.png" },
            "aws.ecr": { id: "ecr", label: "AWS ECR", img: "/aws-icons/ecr.png" },
            "aws.secretsmanager": { id: "secretsmanager", label: "Secrets Manager", img: "/aws-icons/secretsmanager.png" },
            "aws.cognito": { id: "cognito", label: "Cognito", img: "/aws-icons/cognito.png" },
            "aws.vpc": { id: "vpc", label: "AWS VPC", img: "/aws-icons/vpc.png" },
            "aws.cloudwatch": { id: "cloudwatch", label: "CloudWatch", img: "/aws-icons/cloudwatch.png" },
            "aws.elasticache": { id: "elasticache", label: "ElastiCache", img: "/aws-icons/elasticache.png" },
            "aws.cloudfront": { id: "cloudfront", label: "CloudFront", img: "/placeholder-gtzyx.png" },
            "aws.other": { id: "other", label: "Other", img: "/placeholder-gtzyx.png" },
            // GCP
            "gcp.storage": { id: "gcp-storage", label: "GCP Storage", img: "/gcp-icons/Google_Storage-Logo.wine.png" },
            "gcp.pubsub": { id: "pubsub", label: "Pub/Sub", img: "/gcp-icons/google-cloud-pub-sub-logo.png" },
            "gcp.run": { id: "cloud-run", label: "Cloud Run", img: "/gcp-icons/google-cloud-run-logo-png.png" },
            "gcp.secretmanager": { id: "secret-manager", label: "GCP Secret Manager", img: "/gcp-icons/secret manager.png" },
            "gcp.firestore": { id: "firestore", label: "GCP Firestore", img: "/gcp-icons/firestore.png" },
            "gcp.other": { id: "other", label: "Other", img: "/placeholder-gtzyx.png" },
            // Azure
            "azure.storage": { id: "azure.storage", label: "Azure Storage", img: "/azure-icons/10086-icon-service-Storage-Accounts.png" },
            "azure.servicebus": { id: "azure.servicebus", label: "Azure Service Bus", img: "/azure-icons/10836-icon-service-Azure-Service-Bus.png" },
            "azure.containerapp": { id: "azure.containerapp", label: "Azure Container Apps", img: "/azure-icons/02989-icon-service-Container-Apps-Environments.png" },
            "azure.vm": { id: "azure.vm", label: "Azure Virtual Machine", img: "/azure-icons/10021-icon-service-Virtual-Machine.png" },
            "azure.functionapp": { id: "azure.functionapp", label: "Azure Function App", img: "/azure-icons/10029-icon-service-Function-Apps.png" },
            "azure.sql": { id: "azure.sql", label: "Azure SQL Database", img: "/azure-icons/10130-icon-service-SQL-Database.png" },
            "azure.cosmosdb": { id: "azure.cosmosdb", label: "Azure Cosmos DB", img: "/azure-icons/10121-icon-service-Azure-Cosmos-DB.png" },
            "azure.apimanagement": { id: "azure.apimanagement", label: "Azure API Management", img: "/azure-icons/10042-icon-service-API-Management-Services.png" },
            "azure.keyvault": { id: "azure.keyvault", label: "Azure Key Vault", img: "/azure-icons/10245-icon-service-Key-Vaults.png" },
            "azure.appinsights": { id: "azure.appinsights", label: "Azure Application Insights", img: "/azure-icons/00012-icon-service-Application-Insights.png" },
            "azure.vnet": { id: "azure.vnet", label: "Azure Virtual Network", img: "/azure-icons/10061-icon-service-Virtual-Networks.png" },
            "azure.other": { id: "other", label: "Other", img: "/placeholder-gtzyx.png" },
          };

          const restoredItems: ServiceItem[] = pipeline.payload.nodes.map((node: any) => {
            const serviceInfo = kindToServiceMap[node.kind] || { id: "other", label: node.name || "Unknown", img: "/placeholder-gtzyx.png" };
            const position = node.position || { x: 0, y: 0 };

            // Preserve the original node ID but ensure it starts with the service type
            // Node IDs are like "s3-172705..." where "s3" is the service type
            // If the node.id doesn't start with the service type, we need to fix it
            let nodeId = node.id;
            if (!nodeId.startsWith(serviceInfo.id)) {
              // Extract timestamp if present, otherwise generate new one
              const timestampMatch = nodeId.match(/-(\d+)$/);
              const timestamp = timestampMatch ? timestampMatch[1] : Date.now().toString();
              nodeId = `${serviceInfo.id}-${timestamp}`;
            }

            // Extract configuration from node.props
            // The props contain: label, region, and all details spread
            const props = node.props || {};
            const { label: _label, region: propsRegion, ...details } = props;
            
            // Use region from props if available, otherwise from pipeline
            const configRegion = propsRegion || pipeline.region || pipeline.payload.region || "us-east-1";

            return {
              id: nodeId,
              label: serviceInfo.label,
              img: serviceInfo.img,
              x: position.x,
              y: position.y,
              config: {
                name: node.name || serviceInfo.label,
                description: `A ${serviceInfo.label.toLowerCase()} service`,
                environment: (pipeline.env === "prod" ? "production" : pipeline.env === "staging" ? "staging" : "development") as "development" | "staging" | "production",
                region: configRegion,
                details: details, // All the service-specific details (bucketName, queueName, etc.)
              },
            };
          });

          setItems(restoredItems);
          console.log("Restored items from pipeline:", restoredItems);
          if (restoredItems.length > 0) {
            console.log("Sample restored item config:", restoredItems[0]?.config);
            console.log("Sample restored item details:", restoredItems[0]?.config?.details);
            console.log("Original node props:", pipeline.payload.nodes[0]?.props);
          }
          
          // Ensure sidebar is visible after loading pipeline
          setIsLeftPanelCollapsed(false);
          console.log("Pipeline loaded, sidebar should be visible. isLeftPanelCollapsed set to false");
          
          // Force a small delay to ensure sidebar renders after state updates
          setTimeout(() => {
            setIsLeftPanelCollapsed(false);
            console.log("Sidebar visibility forced after pipeline load");
          }, 100);

          // Restore edges if they exist in the payload
          if (pipeline.payload.edges && Array.isArray(pipeline.payload.edges)) {
            const restoredEdges = pipeline.payload.edges.map((edge: any) => ({
              from: edge.from,
              to: edge.to,
            }));
            setInitialEdges(restoredEdges);
            console.log("Restored edges from pipeline:", restoredEdges);
          }
        }
      } catch (error: any) {
        console.error("Error loading pipeline:", error);
      }
    };

    loadPipeline();
  }, [currentPipelineId, isClient]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const updateItemPosition = (index: number, newX: number, newY: number) => {
    setItems((prev: ServiceItem[]) =>
      prev.map((node: ServiceItem, i: number) => (i === index ? { ...node, x: newX, y: newY } : node)),
    );
  };

  const handleServiceClick = (service: ServiceItem) => {
    setSelectedService(service);
  };

  const handleServiceUpdate = (updatedService: ServiceItem) => {
    setItems((prev) => prev.map((item) => (item.id === updatedService.id ? updatedService : item)));
    setSelectedService(updatedService);
  };

  const handleDeleteService = (serviceId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== serviceId));
    if (selectedService?.id === serviceId) {
      setSelectedService(null);
    }
  };

  const handleLeftPanelToggle = () => {
    setIsLeftPanelCollapsed(!isLeftPanelCollapsed);
  };

  const getServiceName = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('dataset') || lowerLabel.includes('data')) return 'Datasets';
    if (lowerLabel.includes('pipeline') || lowerLabel.includes('kinesis') || lowerLabel.includes('stream')) return 'Pipelines';
    return 'Random';
  };

  const handleNodeDragStart = (nodeId: string) => {
    setShowDeleteZone(true);
    setDraggedNodeId(nodeId);
    setIsDraggingExisting(true);
  };

  const handleNodeDragEnd = () => {
    setShowDeleteZone(false);
    setDraggedNodeId(null);
    setIsDraggingExisting(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const isExistingItem = items.some((item) => item.id === event.active.id);
    setIsDraggingExisting(isExistingItem);
    setShowDeleteZone(isExistingItem);

    if (isExistingItem) {
      setDraggedNodeId(event.active.id as string);
    }

    setDraggedItem({
      label: event.active.data.current?.label || "",
      img: event.active.data.current?.img || "",
    });

    if (event.activatorEvent && "clientX" in event.activatorEvent) {
      setCursorPosition({
        x: (event.activatorEvent as MouseEvent).clientX,
        y: (event.activatorEvent as MouseEvent).clientY,
      });
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (event.active.rect.current.translated) {
      const translated = event.active.rect.current.translated;
      setCursorPosition({
        x: translated.left + 60,
        y: translated.top + 50,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;

    if (over?.id === "delete-zone" && isDraggingExisting) {
      setItems((prev) => prev.filter((item) => item.id !== active.id));
      setSelectedService(null);
    } else if (over?.id === "canvas-dropzone" && !isDraggingExisting) {
      if (!canvasContainerRef.current) return;

      const canvasRect = canvasContainerRef.current.getBoundingClientRect();

      // Get the actual drop position more accurately
      const reactFlowWrapper = canvasContainerRef.current.querySelector('.react-flow__renderer');
      const reactFlowViewport = canvasContainerRef.current.querySelector('.react-flow__viewport');

      let dropX = 100; // Default fallback
      let dropY = 100; // Default fallback

      // Calculate position based on the final delta
      if (event.delta) {
        dropX = cursorPosition.x - canvasRect.left + event.delta.x - 60; // Center the 120px wide node
        dropY = cursorPosition.y - canvasRect.top + event.delta.y - 40; // Center the 80px tall node
      }

      // Account for React Flow viewport transform
      if (reactFlowViewport) {
        const transform = window.getComputedStyle(reactFlowViewport).transform;
        if (transform && transform !== 'none') {
          const matrix = transform.match(/matrix\((.+)\)/);
          if (matrix) {
            const values = matrix[1].split(', ');
            const translateX = parseFloat(values[4]) || 0;
            const translateY = parseFloat(values[5]) || 0;
            const scaleX = parseFloat(values[0]) || 1;
            const scaleY = parseFloat(values[3]) || 1;

            // Adjust for viewport transform
            dropX = (dropX - translateX) / scaleX;
            dropY = (dropY - translateY) / scaleY;
          }
        }
      }

      // Ensure minimum positioning
      dropX = Math.max(0, dropX);
      dropY = Math.max(0, dropY);

      const newId = `${active.id}-${idCounter}`;
      setIdCounter((prev) => prev + 1);

      const serviceName = getServiceName(active.data.current?.label || "");

      const newItem: ServiceItem = {
        id: newId,
        label: active.data.current?.label || "",
        img: active.data.current?.img || "",
        x: dropX,
        y: dropY,
        config: {
          name: serviceName,
          description: `A ${serviceName.toLowerCase()} service`,
          environment: "development",
          region: "us-east-1",
        },
      };

      setItems((prev: ServiceItem[]) => [...prev, newItem]);
    }

    // Reset drag state
    setDraggedItem(null);
    setShowDeleteZone(false);
    setIsDraggingExisting(false);
    setDraggedNodeId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen relative">
        <LeftPanel
          isCollapsed={false}
          onToggle={handleLeftPanelToggle}
          canvasNodes={nodesOnCanvasForCost}
          projectName={projectName}
          onSavePipeline={async (name: string, pipelineId?: string) => {
            // This callback is called by LeftPanel after successful save
            // Update project name and mark as no longer new pipeline
            setProjectName(name);
            if (pipelineId) {
              console.log("Setting currentPipelineId to:", pipelineId);
              setCurrentPipelineId(pipelineId);
              setIsNewPipeline(false);
            }
            setHasUnsavedChanges(false);
          }}
          onPipelineSelect={(pipeline) => {
            // Navigate to the pipeline builder when a pipeline is selected from the sidebar
            window.location.href = `/pipelines/${pipeline.id}/builder`;
          }}
          currentPipelineId={currentPipelineId}
          canvasRef={canvasRef}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* <TopBar /> */}
          <div className="flex-1 relative" ref={canvasContainerRef} id="canvas-dropzone">
            <ReactFlowProvider>
              <Canvas
                ref={canvasRef}
                items={items}
                updateItemPosition={updateItemPosition}
                onServiceClick={handleServiceClick}
                onDeleteService={handleDeleteService}
                onSelectedNodesChange={setSelectedForCost}
                onCanvasNodesChange={setNodesOnCanvasForCost}
                currentPipelineId={currentPipelineId}
                initialEdges={initialEdges}
                initialProvider={initialProvider}
                initialPipelineName={projectName}
                onPipelineCreated={(pipelineId) => {
                  console.log("Pipeline auto-created, updating currentPipelineId:", pipelineId);
                  setCurrentPipelineId(pipelineId);
                  setIsNewPipeline(false);
                }}
              />
            </ReactFlowProvider>
            <DeleteZone
              isVisible={showDeleteZone}
              onDelete={handleDeleteService}
              draggedNodeId={draggedNodeId}
            />
          </div>
        </div>

        {/* {selectedService && (
          // <ServiceConfigPanel
          //   // isOpen={!!selectedService}
          //   service={selectedService}
          //   onUpdate={handleServiceUpdate}
          //   onClose={() => setSelectedService(null)}
          //   onDelete={handleDeleteService}
          // />
        )} */}
      </div>

      <DragOverlay>
        {draggedItem ? (
          <div className="w-16 h-16 opacity-80 bg-white rounded-lg shadow-lg border-2 border-blue-200 flex items-center justify-center pointer-events-none">
            <img
              src={draggedItem.img || "/placeholder.svg"}
              alt={draggedItem.label}
              className="w-10 h-10 object-contain"
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={() => {
          setShowUnsavedModal(false);
          setPendingNavigation(null);
        }}
        onSave={async () => {
          if (!projectName.trim()) {
            console.log("Save blocked: No pipeline name");
            return;
          }

          console.log("Save button clicked, starting save process...");

          // Get data from canvas
          if (!canvasRef.current) {
            console.error("Canvas ref not available");
            alert("Canvas not available. Please ensure the canvas is loaded.");
            return;
          }

          try {
            // Validate all services are configured
            const { validateAllServices } = await import("./utils/service-validation");
            const allServices = canvasRef.current.getAllServices();

            if (allServices.length === 0) {
              alert("Please add at least one service to the canvas before saving.");
              return;
            }

            const validationErrors = validateAllServices(allServices);
            const unconfiguredServices = Object.keys(validationErrors);

            if (unconfiguredServices.length > 0) {
              const errorMessages = Object.values(validationErrors).flat();
              const errorMessage = `Please configure all services before saving:\n\n${errorMessages.join("\n")}\n\nClick on each service to configure it.`;
              alert(errorMessage);
              return;
            }

            console.log("Getting plan and payload from canvas...");
            const plan = canvasRef.current.getPlan();
            const payload = canvasRef.current.buildDeploymentPayload(plan);
            const provider = canvasRef.current.getProvider();

            console.log("Plan:", plan);
            console.log("Payload:", payload);
            console.log("Provider:", provider);

            // Extract fields from payload (as user requested)
            // The payload contains: project, env, region, location (for GCP), nodes, edges
            const env = payload.env || "dev";
            const region = payload.region || payload.location || "us-east-1";
            const cloud = provider === "gcp" ? "gcp" : provider === "azure" ? "azure" : "aws";

            // Extract env and region from payload (they come from service configs via buildDeploymentPayload)
            // The payload already contains the correct env and region based on service configurations
            const finalEnv = env;
            const finalRegion = region;

            const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
            if (!token) {
              console.error("No auth token found");
              alert("Please log in to save");
              return;
            }

            const API_BASE =
              typeof window === "undefined"
                ? process.env.API_BASE_URL || "http://127.0.0.1:8000"
                : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

            // Create pipeline - payload is saved as-is, other fields extracted from payload/config
            // Default status is "draft" for new pipelines
            const pipelineData = {
              name: projectName.trim(),
              env: finalEnv as "dev" | "staging" | "prod",
              cloud: cloud as "aws" | "gcp" | "azure",
              region: finalRegion,
              payload: payload, // Save payload as-is
              status: "draft" as const, // Default status for new pipelines
            };

            console.log("Saving pipeline with data:", JSON.stringify(pipelineData, null, 2));

            // Use PATCH if pipeline exists, POST if new
            const isUpdate = currentPipelineId && currentPipelineId.trim().length > 0;
            const url = isUpdate
              ? `${API_BASE}/pipelines/${currentPipelineId}`
              : `${API_BASE}/pipelines/`;
            const method = isUpdate ? "PATCH" : "POST";

            console.log(`Saving pipeline: ${method} ${url}`);

            const res = await fetch(url, {
              method,
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify(pipelineData),
            });

            console.log("Save response status:", res.status);

            if (res.ok) {
              const savedPipeline = await res.json();
              console.log("Pipeline saved successfully:", savedPipeline);

              setCurrentPipelineId(savedPipeline.id);
              setIsNewPipeline(false);
              setHasUnsavedChanges(false);
              setShowUnsavedModal(false);
              setProjectName(savedPipeline.name);

              // Navigate after successful save
              if (pendingNavigation) {
                console.log("Navigating to:", pendingNavigation);
                allowNavigation(pendingNavigation);
                setPendingNavigation(null);
              }
            } else {
              const error = await res.json().catch(() => ({ detail: res.statusText }));
              console.error("Failed to save pipeline:", error);
              alert(error.detail || "Failed to save pipeline");
            }
          } catch (error: any) {
            console.error("Error saving pipeline:", error);
            alert(error?.message || "Failed to save pipeline");
          }
        }}
        onDiscard={() => {
          setHasUnsavedChanges(false);
          setIsNewPipeline(false);
          setShowUnsavedModal(false);

          // Navigate after discarding
          if (pendingNavigation) {
            allowNavigation(pendingNavigation);
            setPendingNavigation(null);
          }
        }}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        hasProjectName={projectName.trim().length > 0}
      />
    </DndContext>
  );
}