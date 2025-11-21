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

export default function WorkplaceClient() {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [idCounter, setIdCounter] = useState(0);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [isDraggingExisting, setIsDraggingExisting] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [selectedForCost, setSelectedForCost] = useState<{ id: string; type: string }[]>([]);
  const [nodesOnCanvasForCost, setNodesOnCanvasForCost] = useState<{ id: string; type: string }[]>([]);
  const [projectName, setProjectName] = useState("");
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [isNewPipeline, setIsNewPipeline] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
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
    
    // Check if this is a new pipeline (no saved pipeline ID in URL or state)
    const urlParams = new URLSearchParams(window.location.search);
    const pipelineId = urlParams.get("id");
    setCurrentPipelineId(pipelineId);
    setIsNewPipeline(!pipelineId);
  }, []);

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

  if (!isClient) {
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-gray-200 animate-pulse"></div>
        <div className="flex flex-col flex-1">
          <div className="h-16 bg-gray-100 animate-pulse"></div>
          <div className="flex-1 bg-white animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragMove={handleDragMove} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen relative">
        <LeftPanel 
          isCollapsed={isLeftPanelCollapsed}
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