//app/component/serviceNode.tsx
"use client"
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface ServiceNodeData {
  label: string;
  img: string;
  onClick: () => void;
  index: number;
}

const ServiceNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as ServiceNodeData;
  
  const getServiceDisplayName = (serviceLabel: string) => {
    if (serviceLabel.toLowerCase().includes('dataset')) return 'Datasets';
    if (serviceLabel.toLowerCase().includes('pipeline')) return 'Pipelines';
    if (serviceLabel.toLowerCase().includes('orders')) return 'Orders';
    if (serviceLabel.toLowerCase().includes('random')) return 'Random';
    return serviceLabel;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    nodeData.onClick();
  };

  return (
    <div 
      className={`
        relative bg-card border rounded-lg shadow-sm transition-all duration-200 
        min-w-[120px] min-h-[80px] group
        ${selected ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground hover:shadow-md'}
      `}
      onClick={handleClick}
    >
      {/* Connection Handles - Made more visible */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background !-left-1.5 group-hover:!opacity-100 !opacity-0 transition-opacity duration-200"
        style={{ left: '-6px' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background !-top-1.5 group-hover:!opacity-100 !opacity-0 transition-opacity duration-200"
        style={{ top: '-6px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background !-right-1.5 group-hover:!opacity-100 !opacity-0 transition-opacity duration-200"
        style={{ right: '-6px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background !-bottom-1.5 group-hover:!opacity-100 !opacity-0 transition-opacity duration-200"
        style={{ bottom: '-6px' }}
      />

      {/* Node Content */}
      <div 
          className="flex flex-col items-center justify-center p-3 space-y-2 drag-handle"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-lg">
            <img 
              src={nodeData.img || "/placeholder.svg"} 
              alt={nodeData.label} 
              className="w-6 h-6 object-contain"
            />
          </div>
          <div className="text-xs font-medium text-foreground text-center leading-tight">
            {getServiceDisplayName(nodeData.label)}
          </div>
        </div>


      {/* Selection Indicator */}
      {selected && (
        <div className="absolute -inset-0.5 border-2 border-primary rounded-lg pointer-events-none">
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default ServiceNode;