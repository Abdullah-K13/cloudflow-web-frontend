"use client";

import { X, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider?: "gcp" | "aws" | "azure";
}

export default function CredentialsModal({ isOpen, onClose, provider = "gcp" }: CredentialsModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const providerName = provider.toUpperCase();
  
  // Determine colors based on provider
  const iconBgClass = provider === "gcp" || provider === "aws" 
    ? "bg-orange-100" 
    : "bg-blue-100";
  const iconTextClass = provider === "gcp" || provider === "aws" 
    ? "text-orange-600" 
    : "text-blue-600";
  const buttonBgClass = provider === "gcp" || provider === "aws"
    ? "bg-orange-600 hover:bg-orange-700"
    : "bg-blue-600 hover:bg-blue-700";

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
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${iconBgClass} flex items-center justify-center`}>
              <Settings className={`h-6 w-6 ${iconTextClass}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {providerName} Credentials Required
              </h3>
              <p className="text-sm text-gray-600">
                Please configure your {providerName} credentials in Settings to preview or deploy your infrastructure.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                router.push("/settings#credentials");
              }}
              className={`flex-1 px-4 py-2.5 text-sm font-medium text-white ${buttonBgClass} rounded-xl transition-colors flex items-center justify-center gap-2`}
            >
              <Settings className="h-4 w-4" />
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

