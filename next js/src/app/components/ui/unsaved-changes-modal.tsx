"use client";

import { X, AlertTriangle, Save } from "lucide-react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  hasProjectName: boolean;
}

export default function UnsavedChangesModal({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  projectName,
  onProjectNameChange,
  hasProjectName,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  const handleSave = () => {
    if (!hasProjectName) {
      return; // Don't save if project name is empty
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Unsaved Changes
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            You have unsaved changes on the canvas. Your progress will be lost if you leave without saving.
          </p>

          {/* Pipeline Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pipeline Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="Enter pipeline name"
              className={`w-full px-3 py-2 rounded-lg border ${
                !hasProjectName && projectName === ""
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-300 focus:border-orange-500 focus:ring-orange-100"
              } focus:outline-none focus:ring-2 transition-colors`}
              autoFocus
            />
            {!hasProjectName && projectName === "" && (
              <p className="text-xs text-red-600">
                Pipeline name is required to save
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={!hasProjectName}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
              hasProjectName
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <Save className="h-4 w-4" />
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

