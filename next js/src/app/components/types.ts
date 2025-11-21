export interface ServiceConfig {
  name: string
  description: string
  environment: "development" | "staging" | "production"
  region: string
  details?: string

}

export interface ServiceItem {
  id: string;
  label: string;
  img: string;
  config?: ServiceConfig;
  x?: number;
  y?: number;
  
}

export interface DraggableIconProps {
  id: string
  label: string
  img: string
}

export interface CanvasProps {
  items: ServiceItem[];
  updateItemPosition: (index: number, newX: number, newY: number) => void;
  onServiceClick: (service: ServiceItem) => void;
  onDeleteService: (serviceId: string) => void;
  onSelectedNodesChange?: (nodes: { id: string; type: string }[]) => void;
  onCanvasNodesChange?: (nodes: { id: string; type: string }[]) => void;
  currentPipelineId?: string | null;
  onPipelineCreated?: (pipelineId: string) => void;
}
