
"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface RequirementsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (requirements: any) => void;
    isLoading: boolean;
}

const RequirementsModal: React.FC<RequirementsModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        use_case: "Web Application Backend",
        user_scale: "1k-10k",
        frequency: "continuous",
        performance: "Fast is nice",
        downtime_tolerance: "Some downtime is OK",
        data_volume: "Medium 1-100GB",
        budget: "<$50",
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
            <div style={{
                backgroundColor: "white", padding: 24, borderRadius: 12, width: 500, maxWidth: "90%",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", position: "relative"
            }}>
                <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer" }}>
                    <X size={20} />
                </button>

                <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20, fontWeight: 600 }}>Optimize Your Architecture</h2>
                <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>
                    Answer a few questions to help us find the best cost optimizations for your needs.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    <div>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Use Case</label>
                        <select name="use_case" value={formData.use_case} onChange={handleChange} style={inputStyle}>
                            <option>Web Application Backend</option>
                            <option>Data Processing / ETL</option>
                            <option>Real-time / Streaming</option>
                            <option>Scheduled Job / Cron</option>
                            <option>Fanout / PubSub</option>
                        </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={labelStyle}>User Scale</label>
                            <select name="user_scale" value={formData.user_scale} onChange={handleChange} style={inputStyle}>
                                <option>0-1k (Prototype)</option>
                                <option>1k-10k (Startup)</option>
                                <option>10k-100k (Growth)</option>
                                <option>100k+ (Enterprise)</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Frequency</label>
                            <select name="frequency" value={formData.frequency} onChange={handleChange} style={inputStyle}>
                                <option value="continuous">Always On (Continuous)</option>
                                <option value="sporadic">Sporadic / On-Demand</option>
                                <option value="daily">Daily Batch</option>
                                <option value="once">One-off Task</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Data Volume</label>
                            <select name="data_volume" value={formData.data_volume} onChange={handleChange} style={inputStyle}>
                                <option value="small">Small (&lt;1GB)</option>
                                <option value="medium">Medium (1-100GB)</option>
                                <option value="large">Large (100GB+)</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Downtime Tolerance</label>
                            <select name="downtime_tolerance" value={formData.downtime_tolerance} onChange={handleChange} style={inputStyle}>
                                <option>No downtime allowed</option>
                                <option>Some downtime is OK</option>
                                <option>Development / Test</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            marginTop: 10, padding: "10px 20px", backgroundColor: "#000", color: "white",
                            border: "none", borderRadius: 6, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? "Analyzing..." : "Find Optimizations"}
                    </button>
                </form>
            </div>
        </div>
    );
};

const labelStyle = { display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 };
const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14,
    backgroundColor: "#f8fafc"
};

export default RequirementsModal;
