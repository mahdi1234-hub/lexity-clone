"use client";

import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AutoMLDashboardProps {
  sessionId: string;
  uploadResult: any;
  onClose: () => void;
}

type PipelineStep = {
  step: string;
  status: string;
  detail?: string;
  leaderboard?: any[];
  results?: any[];
  metrics?: any[];
  predictions_preview?: any[];
};

export default function AutoMLDashboard({ sessionId, uploadResult, onClose }: AutoMLDashboardProps) {
  const [taskType, setTaskType] = useState("");
  const [target, setTarget] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [plots, setPlots] = useState<{ type: string; image?: string; error?: string }[]>([]);
  const [currentPhase, setCurrentPhase] = useState<"select" | "configure" | "running" | "results">("select");
  const [error, setError] = useState<string | null>(null);

  // Configuration options
  const [trainSize, setTrainSize] = useState(0.7);
  const [normalize, setNormalize] = useState(false);
  const [featureSelection, setFeatureSelection] = useState(false);
  const [removeOutliers, setRemoveOutliers] = useState(false);
  const [fixImbalance, setFixImbalance] = useState(false);
  const [nClusters, setNClusters] = useState(4);
  const [anomalyFraction, setAnomalyFraction] = useState(0.05);
  const [fh, setFh] = useState(12);

  const columns = uploadResult?.columns || [];
  const possibleTasks = uploadResult?.possible_tasks || [];

  const handleTaskSelect = (type: string) => {
    setTaskType(type);
    const task = possibleTasks.find((t: any) => t.type === type);
    if (task?.requires_target) {
      setCurrentPhase("configure");
    } else {
      setCurrentPhase("configure");
    }
  };

  const runFullPipeline = async () => {
    setIsRunning(true);
    setCurrentPhase("running");
    setError(null);
    setPipelineSteps([]);
    setPlots([]);

    try {
      const params: any = {
        action: "full_pipeline",
        session_id: sessionId,
        task_type: taskType,
        train_size: trainSize,
        normalize,
        feature_selection: featureSelection,
        remove_outliers: removeOutliers,
        fix_imbalance: fixImbalance,
        n_clusters: nClusters,
        anomaly_fraction: anomalyFraction,
        fh,
      };
      if (target) params.target = target;

      const res = await fetch("/api/automl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || errData.error || "Pipeline failed");
      }

      const data = await res.json();
      setPipelineSteps(data.steps || []);
      setPlots(data.plots || []);
      setCurrentPhase("results");
    } catch (err: any) {
      setError(err.message);
      setCurrentPhase("results");
    } finally {
      setIsRunning(false);
    }
  };

  const font = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto bg-[#F2EFEA] rounded-2xl shadow-2xl border border-black/10">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#F2EFEA]/95 backdrop-blur-xl border-b border-black/10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C48C56] to-[#8B6B3D] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight" style={font}>AutoML Pipeline</h2>
              <p className="text-xs opacity-60" style={font}>Powered by PyCaret</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
            <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Data Summary */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/60 rounded-xl p-3 border border-black/5">
              <p className="text-xs opacity-50 uppercase tracking-wider" style={font}>Rows</p>
              <p className="text-xl font-semibold" style={font}>{uploadResult?.shape?.rows?.toLocaleString()}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3 border border-black/5">
              <p className="text-xs opacity-50 uppercase tracking-wider" style={font}>Columns</p>
              <p className="text-xl font-semibold" style={font}>{uploadResult?.shape?.columns}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3 border border-black/5">
              <p className="text-xs opacity-50 uppercase tracking-wider" style={font}>Missing</p>
              <p className="text-xl font-semibold" style={font}>{uploadResult?.missing_values || 0}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3 border border-black/5">
              <p className="text-xs opacity-50 uppercase tracking-wider" style={font}>Duplicates</p>
              <p className="text-xl font-semibold" style={font}>{uploadResult?.duplicate_rows || 0}</p>
            </div>
          </div>

          {/* Phase: Select Task */}
          {currentPhase === "select" && (
            <div>
              <h3 className="text-lg font-medium mb-4" style={font}>Select ML Task Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {possibleTasks.map((task: any) => (
                  <button
                    key={task.type}
                    onClick={() => handleTaskSelect(task.type)}
                    className="text-left p-5 rounded-xl bg-white/70 border border-black/5 hover:border-[#C48C56]/30 hover:bg-white/90 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-[#C48C56]/10 flex items-center justify-center group-hover:bg-[#C48C56]/20 transition-colors">
                        {task.type === "classification" && <span className="text-[#C48C56] text-sm font-bold">C</span>}
                        {task.type === "regression" && <span className="text-[#C48C56] text-sm font-bold">R</span>}
                        {task.type === "clustering" && <span className="text-[#C48C56] text-sm font-bold">K</span>}
                        {task.type === "anomaly_detection" && <span className="text-[#C48C56] text-sm font-bold">A</span>}
                        {task.type === "time_series" && <span className="text-[#C48C56] text-sm font-bold">T</span>}
                      </div>
                      <h4 className="font-medium" style={font}>{task.label}</h4>
                    </div>
                    <p className="text-sm opacity-60" style={font}>{task.description}</p>
                    {task.requires_target && (
                      <p className="text-xs mt-2 text-[#C48C56]" style={font}>Requires target column</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Phase: Configure */}
          {currentPhase === "configure" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setCurrentPhase("select")} className="p-1 rounded hover:bg-black/5">
                  <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <h3 className="text-lg font-medium" style={font}>
                  Configure {taskType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target column selection */}
                {(taskType === "classification" || taskType === "regression" || taskType === "time_series") && (
                  <div>
                    <label className="block text-sm font-medium mb-2 opacity-80" style={font}>Target Column *</label>
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#C48C56]/30"
                      style={font}
                    >
                      <option value="">Select target column...</option>
                      {columns.map((col: any) => (
                        <option key={col.name} value={col.name}>
                          {col.name} ({col.type}, {col.unique} unique)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Train/Test Split */}
                {(taskType === "classification" || taskType === "regression") && (
                  <div>
                    <label className="block text-sm font-medium mb-2 opacity-80" style={font}>
                      Train Size: {(trainSize * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="0.9"
                      step="0.05"
                      value={trainSize}
                      onChange={(e) => setTrainSize(parseFloat(e.target.value))}
                      className="w-full accent-[#C48C56]"
                    />
                  </div>
                )}

                {/* Clustering: Number of clusters */}
                {taskType === "clustering" && (
                  <div>
                    <label className="block text-sm font-medium mb-2 opacity-80" style={font}>
                      Number of Clusters: {nClusters}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      step="1"
                      value={nClusters}
                      onChange={(e) => setNClusters(parseInt(e.target.value))}
                      className="w-full accent-[#C48C56]"
                    />
                  </div>
                )}

                {/* Anomaly: Fraction */}
                {taskType === "anomaly_detection" && (
                  <div>
                    <label className="block text-sm font-medium mb-2 opacity-80" style={font}>
                      Anomaly Fraction: {(anomalyFraction * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.01"
                      max="0.3"
                      step="0.01"
                      value={anomalyFraction}
                      onChange={(e) => setAnomalyFraction(parseFloat(e.target.value))}
                      className="w-full accent-[#C48C56]"
                    />
                  </div>
                )}

                {/* Time Series: Forecast Horizon */}
                {taskType === "time_series" && (
                  <div>
                    <label className="block text-sm font-medium mb-2 opacity-80" style={font}>
                      Forecast Horizon: {fh} periods
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      step="1"
                      value={fh}
                      onChange={(e) => setFh(parseInt(e.target.value))}
                      className="w-full accent-[#C48C56]"
                    />
                  </div>
                )}

                {/* Advanced Options */}
                {(taskType === "classification" || taskType === "regression") && (
                  <>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium mb-3 opacity-70" style={font}>Advanced Preprocessing</h4>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { key: "normalize", label: "Normalize", state: normalize, set: setNormalize },
                          { key: "feature_selection", label: "Feature Selection", state: featureSelection, set: setFeatureSelection },
                          { key: "remove_outliers", label: "Remove Outliers", state: removeOutliers, set: setRemoveOutliers },
                          ...(taskType === "classification" ? [{ key: "fix_imbalance", label: "Fix Imbalance", state: fixImbalance, set: setFixImbalance }] : []),
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => opt.set(!opt.state)}
                            className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                              opt.state
                                ? "bg-[#C48C56]/10 border-[#C48C56]/30 text-[#C48C56]"
                                : "bg-white/50 border-black/5 opacity-60 hover:opacity-80"
                            }`}
                            style={font}
                          >
                            {opt.state ? "ON" : "OFF"}: {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Run Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={runFullPipeline}
                  disabled={isRunning || ((taskType === "classification" || taskType === "regression" || taskType === "time_series") && !target)}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#C48C56] to-[#8B6B3D] text-white font-medium text-sm
                    hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={font}
                >
                  {isRunning ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Running Full Pipeline...
                    </span>
                  ) : (
                    "Run Full AutoML Pipeline"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Phase: Running */}
          {currentPhase === "running" && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <svg className="w-16 h-16 animate-spin text-[#C48C56]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2" style={font}>Running AutoML Pipeline</h3>
              <p className="text-sm opacity-60 max-w-md text-center" style={font}>
                PyCaret is training, comparing, tuning, ensembling, and interpreting models.
                This may take a few minutes depending on your dataset size.
              </p>
              <div className="mt-6 flex gap-2">
                {["Setup", "Compare", "Tune", "Ensemble", "Blend", "Stack", "Interpret"].map((s, i) => (
                  <div key={s} className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${i <= 1 ? "bg-[#C48C56] animate-pulse" : "bg-black/10"}`} />
                    <span className="text-[10px] mt-1 opacity-50" style={font}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase: Results */}
          {currentPhase === "results" && (
            <div>
              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" style={font}>
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Pipeline Steps */}
              {pipelineSteps.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4" style={font}>Pipeline Steps</h3>
                  <div className="space-y-3">
                    {pipelineSteps.map((step, i) => (
                      <div key={i} className="bg-white/60 rounded-xl p-4 border border-black/5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            step.status === "complete" ? "bg-green-500" : step.status === "skipped" ? "bg-yellow-500" : "bg-red-500"
                          }`}>
                            {step.status === "complete" ? "+" : step.status === "skipped" ? "-" : "!"}
                          </div>
                          <h4 className="font-medium text-sm" style={font}>{step.step}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            step.status === "complete" ? "bg-green-100 text-green-700" :
                            step.status === "skipped" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                          }`} style={font}>{step.status}</span>
                        </div>
                        {step.detail && <p className="text-sm opacity-60 ml-9" style={font}>{step.detail}</p>}

                        {/* Leaderboard Table */}
                        {step.leaderboard && step.leaderboard.length > 0 && (
                          <div className="mt-3 ml-9 overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-black/10">
                                  {Object.keys(step.leaderboard[0]).map((key) => (
                                    <th key={key} className="text-left px-2 py-1.5 font-medium opacity-70" style={font}>{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {step.leaderboard.slice(0, 10).map((row: any, ri: number) => (
                                  <tr key={ri} className={`border-b border-black/5 ${ri === 0 ? "bg-[#C48C56]/5" : ""}`}>
                                    {Object.values(row).map((val: any, vi: number) => (
                                      <td key={vi} className="px-2 py-1.5" style={font}>
                                        {typeof val === "number" ? (Number.isInteger(val) ? val : val.toFixed(4)) : String(val ?? "")}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Metrics Table */}
                        {step.metrics && step.metrics.length > 0 && (
                          <div className="mt-3 ml-9 overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-black/10">
                                  {Object.keys(step.metrics[0]).map((key) => (
                                    <th key={key} className="text-left px-2 py-1.5 font-medium opacity-70" style={font}>{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {step.metrics.map((row: any, ri: number) => (
                                  <tr key={ri} className="border-b border-black/5">
                                    {Object.values(row).map((val: any, vi: number) => (
                                      <td key={vi} className="px-2 py-1.5" style={font}>
                                        {typeof val === "number" ? (Number.isInteger(val) ? val : val.toFixed(4)) : String(val ?? "")}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Results Table */}
                        {step.results && step.results.length > 0 && (
                          <div className="mt-3 ml-9 overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-black/10">
                                  {Object.keys(step.results[0]).map((key) => (
                                    <th key={key} className="text-left px-2 py-1.5 font-medium opacity-70" style={font}>{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {step.results.slice(0, 5).map((row: any, ri: number) => (
                                  <tr key={ri} className="border-b border-black/5">
                                    {Object.values(row).map((val: any, vi: number) => (
                                      <td key={vi} className="px-2 py-1.5" style={font}>
                                        {typeof val === "number" ? (Number.isInteger(val) ? val : val.toFixed(4)) : String(val ?? "")}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Predictions Preview */}
                        {step.predictions_preview && step.predictions_preview.length > 0 && (
                          <div className="mt-3 ml-9 overflow-x-auto">
                            <p className="text-xs font-medium mb-1 opacity-60" style={font}>Predictions Preview:</p>
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-black/10">
                                  {Object.keys(step.predictions_preview[0]).map((key) => (
                                    <th key={key} className="text-left px-2 py-1.5 font-medium opacity-70" style={font}>{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {step.predictions_preview.slice(0, 10).map((row: any, ri: number) => (
                                  <tr key={ri} className="border-b border-black/5">
                                    {Object.values(row).map((val: any, vi: number) => (
                                      <td key={vi} className="px-2 py-1.5" style={font}>
                                        {typeof val === "number" ? (Number.isInteger(val) ? val : val.toFixed(4)) : String(val ?? "")}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plots */}
              {plots.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4" style={font}>Analysis Plots & Explainability</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plots.map((plot, i) => (
                      <div key={i} className="bg-white/60 rounded-xl p-4 border border-black/5">
                        <p className="text-xs font-medium mb-2 uppercase tracking-wider opacity-60" style={font}>
                          {plot.type.replace(/_/g, " ")}
                        </p>
                        {plot.image ? (
                          <img
                            src={`data:image/png;base64,${plot.image}`}
                            alt={plot.type}
                            className="w-full rounded-lg"
                          />
                        ) : plot.error ? (
                          <p className="text-xs text-red-500" style={font}>{plot.error}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setCurrentPhase("select"); setPipelineSteps([]); setPlots([]); setError(null); }}
                  className="px-5 py-2.5 rounded-xl bg-white/70 border border-black/10 text-sm font-medium hover:bg-white/90 transition-all"
                  style={font}
                >
                  Run Another Analysis
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#2C2824] text-[#F2EFEA] text-sm font-medium hover:bg-[#2C2824]/90 transition-all"
                  style={font}
                >
                  Close Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
