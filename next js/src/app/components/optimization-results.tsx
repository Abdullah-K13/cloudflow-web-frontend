"use client";

import React from "react";
import { X, ArrowRight, Check, AlertTriangle } from "lucide-react";

interface OptimizationSuggestion {
    id: string;
    type: string;
    priority: "low" | "medium" | "high";
    title: string;
    description: string;
    currentCost: number;
    optimizedCost: number;
    savings: number;
    savingsPercent: number;
    affectedNodes: string[];
    canAutoApply: boolean;
}

interface OptimizationResultsProps {
    isOpen: boolean;
    onClose: () => void;
    suggestions: OptimizationSuggestion[];
    totalSavings: number;
    onApply: (suggestionId: string) => void;
}

const OptimizationResults: React.FC<OptimizationResultsProps> = ({
    isOpen,
    onClose,
    suggestions,
    totalSavings,
    onApply
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
            <div style={{
                backgroundColor: "white", borderRadius: 12, width: 800, maxWidth: "90%", maxHeight: "85vh",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", overflow: "hidden"
            }}>
                {/* Header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc" }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#0f172a" }}>Optimization Results</h2>
                        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
                            Found {suggestions.length} opportunities to save <span style={{ color: "#10b981", fontWeight: 600 }}>${totalSavings.toFixed(2)}/mo</span>
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                        <X size={24} />
                    </button>
                </div>

                {/* List */}
                <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                    {suggestions.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                            <Check size={48} style={{ marginBottom: 16, color: "#10b981" }} />
                            <p>Your architecture is already optimized! Great job.</p>
                        </div>
                    ) : (
                        suggestions.map((suggestion) => (
                            <div key={suggestion.id} style={{
                                border: "1px solid #e2e8f0", borderRadius: 8, padding: 16,
                                display: "flex", gap: 16, alignItems: "flex-start",
                                backgroundColor: suggestion.priority === "high" ? "#fff1f2" : "white"
                            }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: "50%",
                                    backgroundColor: suggestion.priority === "high" ? "#fee2e2" : "#f1f5f9",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    color: suggestion.priority === "high" ? "#ef4444" : "#64748b"
                                }}>
                                    {suggestion.priority === "high" ? <AlertTriangle size={20} /> : <DollarSignIcon />}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{suggestion.title}</h3>
                                        <span style={{
                                            fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 12,
                                            backgroundColor: getPriorityColor(suggestion.priority), color: "white"
                                        }}>
                                            {suggestion.priority.toUpperCase()}
                                        </span>
                                    </div>

                                    <p style={{ margin: "0 0 12px", fontSize: 14, color: "#475569" }}>{suggestion.description || "Optimization suggestion based on your requirements."}</p>

                                    <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14 }}>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: 12 }}>Current Cost</span>
                                            <span style={{ fontWeight: 500 }}>${suggestion.currentCost.toFixed(2)}</span>
                                        </div>
                                        <ArrowRight size={16} style={{ color: "#94a3b8" }} />
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: 12 }}>Optimized Cost</span>
                                            <span style={{ fontWeight: 600, color: "#10b981" }}>${suggestion.optimizedCost.toFixed(2)}</span>
                                        </div>
                                        <div style={{ marginLeft: "auto" }}>
                                            <span style={{ color: "#64748b", display: "block", fontSize: 12 }}>Savings</span>
                                            <span style={{ fontWeight: 600, color: "#10b981" }}>${suggestion.savings.toFixed(2)} ({suggestion.savingsPercent.toFixed(0)}%)</span>
                                        </div>
                                    </div>
                                </div>

                                {suggestion.canAutoApply && (
                                    <button
                                        onClick={() => onApply(suggestion.id)}
                                        style={{
                                            alignSelf: "center", padding: "8px 16px", backgroundColor: "#0f172a", color: "white",
                                            border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer"
                                        }}
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const DollarSignIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
);

function getPriorityColor(priority: string) {
    switch (priority) {
        case "high": return "#ef4444";
        case "medium": return "#f59e0b";
        case "low": return "#3b82f6";
        default: return "#64748b";
    }
}

export default OptimizationResults;
