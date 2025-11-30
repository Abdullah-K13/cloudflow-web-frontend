"use client";

import { useState, useEffect } from "react";
import { X, FolderPlus } from "lucide-react";

interface PipelineNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function PipelineNameModal({ isOpen, onClose, onSubmit }: PipelineNameModalProps) {
  const [pipelineName, setPipelineName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPipelineName("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pipelineName.trim()) {
      onSubmit(pipelineName.trim());
      setPipelineName("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 border border-gray-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <FolderPlus className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Create New Pipeline
              </h3>
              <p className="text-sm text-gray-600">
                Enter a name for your pipeline (also called project name)
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="pipeline-name" className="block text-sm font-medium text-gray-700 mb-2">
              Pipeline Name *
            </label>
            <input
              id="pipeline-name"
              type="text"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              placeholder="e.g., My Production Pipeline"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!pipelineName.trim()}
              className={`px-4 py-2 rounded-lg text-white transition-colors ${
                pipelineName.trim()
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Create Pipeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

