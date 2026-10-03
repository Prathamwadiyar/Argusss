import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Shield,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  FileCode,
  RotateCcw,
  Copy,
  Check,
  Zap,
  Sliders
} from 'lucide-react';
import { auditService } from '../services/api';

const DriftDetectionTab = ({ devices = [] }) => {
  const activeDevices = devices && devices.length > 0 ? devices : [
    { id: 1, hostname: 'CORE-RTR-01', vendor: 'Cisco', platform: 'IOS-XE' },
    { id: 2, hostname: 'EDGE-SW-01', vendor: 'Juniper', platform: 'Junos' },
    { id: 3, hostname: 'DC-FW-01', vendor: 'Fortinet', platform: 'FortiOS' },
    { id: 4, hostname: 'LEGACY-RTR-02', vendor: 'Cisco', platform: 'IOS-Legacy' }
  ];

  const [baselineDeviceId, setBaselineDeviceId] = useState(String(activeDevices[0]?.id || '1'));
  const [currentDeviceId, setCurrentDeviceId] = useState(String(activeDevices[activeDevices.length - 1]?.id || '4'));
  
  const [driftData, setDriftData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('properties'); // 'properties' | 'line_diff' | 'reversion_script'

  const handleRunDriftAnalysis = async (baseId, currId) => {
    setLoading(true);
    try {
      const res = await auditService.analyzeTemporalDrift({
        baseline_device_id: Number(baseId),
        target_device_id: Number(currId)
      });
      setDriftData(res);
    } catch (err) {
      console.error('Temporal drift analysis failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunDriftAnalysis(baselineDeviceId, currentDeviceId);
  }, [baselineDeviceId, currentDeviceId]);

  const handleCopyReversionScript = () => {
    if (!driftData) return;
    const scriptLines = [
      `! ARGUS Temporal Drift Reversion Patch`,
      `! Restoring device ${driftData.current_device?.hostname} to Golden Baseline (${driftData.baseline_device?.hostname})`,
      `! Generated at: ${new Date().toISOString()}`,
      ``,
      ...driftData.line_diffs?.map(d => d.type === 'REMOVED' ? `! Restore Baseline Line:\n${d.text}` : `! Revert Drift Line:\nno ${d.text}`) || []
    ].join('\n');

    navigator.clipboard.writeText(scriptLines);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header Banner */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                Continuous Governance
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <History size={20} className="text-amber-600" />
                Temporal Drift & Golden Baseline Engine
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Detect configuration decay, unauthorized manual hotfixes, and compliance regressions across time.
              Compares active running configurations against authoritative Golden Baselines to quantify compliance penalty decay.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-mono text-amber-800 font-medium self-start md:self-auto">
            <Shield size={13} className="text-amber-600" />
            <span>Anti-Drift Baseline Shield</span>
          </div>
        </div>
      </div>

      {/* Baseline vs Current Selection Sandbox */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-6 rounded-xl p-4 bg-white border border-slate-200 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Golden Baseline Appliance (Approved Standard):
          </label>
          <select
            value={baselineDeviceId}
            onChange={(e) => setBaselineDeviceId(e.target.value)}
            className="w-full p-2.5 text-xs font-mono bg-emerald-50/50 border border-emerald-300 text-slate-900 rounded-lg focus:outline-none"
          >
            {activeDevices.map((d) => (
              <option key={d.id} value={String(d.id)}>
                [BASELINE] {d.hostname} &mdash; {d.vendor} ({d.platform})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-6 rounded-xl p-4 bg-white border border-slate-200 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Current Running Appliance (Drift Candidate):
          </label>
          <select
            value={currentDeviceId}
            onChange={(e) => setCurrentDeviceId(e.target.value)}
            className="w-full p-2.5 text-xs font-mono bg-amber-50/50 border border-amber-300 text-slate-900 rounded-lg focus:outline-none"
          >
            {activeDevices.map((d) => (
              <option key={d.id} value={String(d.id)}>
                [CURRENT] {d.hostname} &mdash; {d.vendor} ({d.platform})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Drift Scorecard & Results */}
      {driftData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Executive Drift Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Golden Baseline Score
              </span>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono">
                {driftData.summary?.baseline_score}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                Approved Baseline ({driftData.baseline_device?.hostname})
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Current Running Score
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {driftData.summary?.current_score}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                Running State ({driftData.current_device?.hostname})
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Compliance Decay Penalty
              </span>
              <div className="text-2xl font-extrabold text-rose-600 font-mono flex items-center gap-1">
                <TrendingDown size={20} />
                <span>-{driftData.summary?.compliance_decay_penalty}%</span>
              </div>
              <div className="text-[10px] text-rose-700 font-mono font-medium">
                {driftData.summary?.drifted_properties_count} Security Properties Drifted
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Drift Risk Classification
              </span>
              <div className="pt-0.5">
                <span className={`inline-block px-2.5 py-1 rounded text-xs font-mono font-extrabold border uppercase tracking-wider ${
                  driftData.summary?.drift_severity === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : driftData.summary?.drift_severity === 'HIGH'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {driftData.summary?.drift_severity} RISK
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {driftData.summary?.line_diff_count} CLI Lines Modified
              </div>
            </div>
          </div>

          {/* View Mode Selector Tabs */}
          <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start">
                <button
                  onClick={() => setViewMode('properties')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-all flex items-center gap-1.5 ${
                    viewMode === 'properties'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sliders size={13} className={viewMode === 'properties' ? 'text-amber-600' : 'text-slate-400'} />
                  <span>Property Drift Matrix ({driftData.drifted_properties?.length || 0})</span>
                </button>

                <button
                  onClick={() => setViewMode('line_diff')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-all flex items-center gap-1.5 ${
                    viewMode === 'line_diff'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode size={13} className={viewMode === 'line_diff' ? 'text-amber-600' : 'text-slate-400'} />
                  <span>Line-by-Line Config Diffs ({driftData.line_diffs?.length || 0})</span>
                </button>

                <button
                  onClick={() => setViewMode('reversion_script')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-all flex items-center gap-1.5 ${
                    viewMode === 'reversion_script'
                      ? 'bg-amber-500 text-white shadow-xs border border-amber-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <RotateCcw size={13} className={viewMode === 'reversion_script' ? 'text-white' : 'text-amber-500'} />
                  <span>Baseline Reversion Patch</span>
                </button>
              </div>

              {viewMode === 'reversion_script' && (
                <button
                  onClick={handleCopyReversionScript}
                  className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1.5 transition-all font-mono self-end sm:self-auto"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy Baseline Reversion Script'}</span>
                </button>
              )}
            </div>

            {/* TAB 1: Canonical Property Drift Matrix */}
            {viewMode === 'properties' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 font-mono">
                  Comparative Analysis between <strong className="text-emerald-700">{driftData.baseline_device?.hostname}</strong> (Golden Baseline) and <strong className="text-rose-700">{driftData.current_device?.hostname}</strong> (Current Running State):
                </div>

                {driftData.drifted_properties?.length === 0 ? (
                  <div className="p-8 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                    <div className="text-sm font-bold text-emerald-900 font-mono">Zero Property Drift Detected</div>
                    <div className="text-xs text-emerald-700 max-w-md mx-auto">
                      The running device matches the Golden Baseline security specification across all audited parameters.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <th className="p-3">Security Property</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Golden Baseline</th>
                          <th className="p-3">Current Running State</th>
                          <th className="p-3">Risk Severity</th>
                          <th className="p-3">Operational Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-mono">
                        {driftData.drifted_properties?.map((prop, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-bold text-slate-900">{prop.property_id}</td>
                            <td className="p-3 text-slate-600">{prop.category}</td>
                            <td className="p-3 text-emerald-700 font-bold bg-emerald-50/40">{prop.baseline_state}</td>
                            <td className="p-3 text-rose-700 font-bold bg-rose-50/40">{prop.current_state}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                                prop.risk_severity === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : prop.risk_severity === 'HIGH'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {prop.risk_severity}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 normal-case font-sans text-xs">{prop.impact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Line-by-Line Config Diffs */}
            {viewMode === 'line_diff' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 font-mono">
                  Raw CLI stanza modifications introduced into current running configuration:
                </div>
                <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs max-h-[360px] overflow-y-auto space-y-1.5 border border-slate-800">
                  {driftData.line_diffs?.map((diff, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded font-mono text-xs flex items-start gap-2.5 ${
                        diff.type === 'REMOVED'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-900/40'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/40'
                      }`}
                    >
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        diff.type === 'REMOVED' ? 'bg-rose-900 text-rose-100' : 'bg-emerald-900 text-emerald-100'
                      }`}>
                        {diff.type === 'REMOVED' ? '- REMOVED FROM BASELINE' : '+ ADDED IN CURRENT'}
                      </span>
                      <code className="flex-1 break-all">{diff.text}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Baseline Reversion Patch */}
            {viewMode === 'reversion_script' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 font-mono">
                  Synthesized CLI Patch to undo configuration drift and restore appliance to Golden Baseline state:
                </div>
                <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-amber-300 leading-relaxed max-h-[320px] overflow-y-auto border border-amber-900/40">
                  <pre>
                    {`! ARGUS Temporal Drift Reversion Patch
! Target Appliance: ${driftData.current_device?.hostname} (${driftData.current_device?.vendor})
! Restoring to Golden Baseline: ${driftData.baseline_device?.hostname}
! Timestamp: ${new Date().toISOString()}

` + (driftData.line_diffs?.map(d => d.type === 'REMOVED' ? `! Restore Baseline Configuration:\n${d.text}` : `! Revert Drift Line:\nno ${d.text}`).join('\n\n') || '! Appliance is in 100% synchronization with Golden Baseline')}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DriftDetectionTab;
