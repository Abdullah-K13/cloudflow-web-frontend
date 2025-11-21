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
  const [projectName, setProjectName] = useState("My Project");
  const canvasRef = useRef<{ getPlan: () => any; getPrompt: () => string; buildDeploymentPayload: (plan: any) => any; getProvider: () => "aws" | "gcp" | "azure" } | null>(null);

  useEffect(() => {
    setIsClient(true);
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
const [nodesOnCanvasForCost, setNodesOnCanvasForCost] = useState<{ id: string; type: string }[]>([]);

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
          onSavePipeline={async (name: string) => {
            setProjectName(name);
            // The LeftPanel will handle the actual save via canvasRef
          }}
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
    </DndContext>
  );
}