//app/component/deletezone.tsx
"use client"
import React from 'react';
import { Trash2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

interface DeleteZoneProps {
  isVisible: boolean;
  onDelete: (serviceId: string) => void;
  draggedNodeId: string | null;
}

const DeleteZone: React.FC<DeleteZoneProps> = ({ isVisible, onDelete, draggedNodeId }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'delete-zone',
  });

  if (!isVisible) return null;

  return (
    <div
      ref={setNodeRef}
      className={`
        fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 
        transition-all duration-300 ease-out
        ${isOver 
          ? "bg-red-600 scale-110 shadow-2xl animate-pulse" 
          : "bg-red-500/90 hover:bg-red-600"
        } 
        text-white px-6 py-4 rounded-full 
        flex items-center space-x-3 shadow-lg backdrop-blur-sm
        cursor-pointer border-2 border-red-400
      `}
    >
      <Trash2 className={`w-6 h-6 transition-transform duration-200 ${isOver ? 'scale-110' : ''}`} />
      <span className="font-medium whitespace-nowrap">
        {isOver ? "Release to Delete" : "Drag here to delete"}
      </span>
    </div>
  );
};

export default DeleteZone;