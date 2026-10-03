"use client";

import { X, AlertCircle } from "lucide-react";
import { useEffect } from "react";

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message?: string;
    details?: string;
    autoCloseDelay?: number; // milliseconds, 0 = no auto-close
}

export default function ErrorModal({
    isOpen,
    onClose,
    title,
    message,
    details,
    autoCloseDelay = 0,
}: ErrorModalProps) {
    useEffect(() => {
        if (isOpen && autoCloseDelay > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoCloseDelay, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-red-100 transform transition-all duration-300">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="p-6 pt-8">
                    {/* Error Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="h-10 w-10 text-red-600" />
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    {message && (
                        <p className="text-sm text-gray-600 text-center mb-4">
                            {message}
                        </p>
                    )}

                    {/* Details (scrollable if long) */}
                    {details && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 max-h-48 overflow-y-auto">
                            <pre className="text-xs text-red-800 whitespace-pre-wrap font-mono">
                                {details}
                            </pre>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors focus:outline-none focus:ring-4 focus:ring-red-200/70"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
