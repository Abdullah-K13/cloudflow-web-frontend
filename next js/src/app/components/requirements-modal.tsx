
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
        // Core Fields
        use_case: "web_app",
        frequency: "continuous",
        performance: "standard",
        downtime_tolerance: "some downtime acceptable",
        data_volume: "medium",
        user_scale: "1k-10k",
        budget: "medium",
        // Advanced Fields
        avg_task_duration: "60",
        data_access_frequency: "infrequent",
        compliance_retention: "1",
        global_reach: "no",
        ha_requirement: "single-zone",
        memory_intensive: "no",
        env: "dev",
        traffic_pattern: "low",
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Transform form data to API format
        const requirements = {
            use_case: formData.use_case,
            frequency: formData.frequency,
            performance: formData.performance,
            downtime_tolerance: formData.downtime_tolerance,
            data_volume: formData.data_volume,
            user_scale: formData.user_scale,
            budget: formData.budget,
            avg_task_duration: Number(formData.avg_task_duration),
            data_access_frequency: formData.data_access_frequency,
            compliance_retention: Number(formData.compliance_retention),
            global_reach: formData.global_reach,
            ha_requirement: formData.ha_requirement,
            memory_intensive: formData.memory_intensive,
            env: formData.env,
            traffic_pattern: formData.traffic_pattern,
        };
        
        onSubmit(requirements);
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

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "80vh", overflowY: "auto", paddingRight: 8 }}>
                    {/* Core Fields Section */}
                    <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 12, marginBottom: 8 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#334155" }}>Core Requirements</h3>
                        
                        <div>
                            <label style={labelStyle}>Use Case</label>
                            <select name="use_case" value={formData.use_case} onChange={handleChange} style={inputStyle}>
                                <option value="web_app">Web Application</option>
                                <option value="data_processing">Data Processing / ETL</option>
                                <option value="real-time">Real-time</option>
                                <option value="streaming">Streaming</option>
                                <option value="fanout">Fanout</option>
                                <option value="pubsub">Pub/Sub</option>
                            </select>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                            <div>
                                <label style={labelStyle}>Frequency</label>
                                <select name="frequency" value={formData.frequency} onChange={handleChange} style={inputStyle}>
                                    <option value="continuous">Continuous</option>
                                    <option value="hourly">Hourly</option>
                                    <option value="daily">Daily</option>
                                    <option value="once">Once</option>
                                    <option value="sporadic">Sporadic</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Performance</label>
                                <select name="performance" value={formData.performance} onChange={handleChange} style={inputStyle}>
                                    <option value="instant">Instant</option>
                                    <option value="standard">Standard</option>
                                    <option value="relaxed">Relaxed</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                            <div>
                                <label style={labelStyle}>Downtime Tolerance</label>
                                <select name="downtime_tolerance" value={formData.downtime_tolerance} onChange={handleChange} style={inputStyle}>
                                    <option value="no downtime">No downtime</option>
                                    <option value="some downtime acceptable">Some downtime acceptable</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Data Volume</label>
                                <select name="data_volume" value={formData.data_volume} onChange={handleChange} style={inputStyle}>
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                            <div>
                                <label style={labelStyle}>User Scale</label>
                                <select name="user_scale" value={formData.user_scale} onChange={handleChange} style={inputStyle}>
                                    <option value="<1k">&lt;1k</option>
                                    <option value="1k-10k">1k-10k</option>
                                    <option value="10k-100k">10k-100k</option>
                                    <option value="100k+">100k+</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Budget</label>
                                <select name="budget" value={formData.budget} onChange={handleChange} style={inputStyle}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Fields Section */}
                    <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 12, marginBottom: 8 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#334155" }}>Advanced Settings</h3>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Avg Task Duration (seconds)</label>
                                <input
                                    type="number"
                                    name="avg_task_duration"
                                    value={formData.avg_task_duration}
                                    onChange={handleChange}
                                    min="1"
                                    style={inputStyle}
                                    placeholder="60"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Data Access Frequency</label>
                                <select name="data_access_frequency" value={formData.data_access_frequency} onChange={handleChange} style={inputStyle}>
                                    <option value="hot">Hot</option>
                                    <option value="warm">Warm</option>
                                    <option value="cool">Cool</option>
                                    <option value="infrequent">Infrequent</option>
                                    <option value="archive">Archive</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                            <div>
                                <label style={labelStyle}>Compliance Retention (years)</label>
                                <input
                                    type="number"
                                    name="compliance_retention"
                                    value={formData.compliance_retention}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.5"
                                    style={inputStyle}
                                    placeholder="1"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Global Reach</label>
                                <select name="global_reach" value={formData.global_reach} onChange={handleChange} style={inputStyle}>
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                    <option value="required">Required</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                            <div>
                                <label style={labelStyle}>HA Requirement</label>
                                <select name="ha_requirement" value={formData.ha_requirement} onChange={handleChange} style={inputStyle}>
                                    <option value="single-zone">Single Zone</option>
                                    <option value="multi-zone">Multi Zone</option>
                                    <option value="multi-region">Multi Region</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Memory Intensive</label>
                                <select name="memory_intensive" value={formData.memory_intensive} onChange={handleChange} style={inputStyle}>
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                            <div>
                                <label style={labelStyle}>Environment</label>
                                <select name="env" value={formData.env} onChange={handleChange} style={inputStyle}>
                                    <option value="dev">Development</option>
                                    <option value="staging">Staging</option>
                                    <option value="prod">Production</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Traffic Pattern</label>
                                <select name="traffic_pattern" value={formData.traffic_pattern} onChange={handleChange} style={inputStyle}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="variable">Variable</option>
                                </select>
                            </div>
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
