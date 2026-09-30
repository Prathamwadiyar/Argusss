import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ArrowRight, Code, Shield, Layers, GitCompare, CheckCircle2, AlertOctagon } from 'lucide-react';
import { auditService } from '../services/api';

const SemanticDiffTab = ({ devices = [] }) => {
  const [beforeId, setBeforeId] = useState('');
  const [afterId, setAfterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [diffResult, setDiffResult] = useState(null);

  useEffect(() => {
    if (devices.length >= 2) {
      // Default: compare vulnerable legacy against compliant core router
      const vulnerable = devices.find((d) => d.hostname.toLowerCase().includes('vulnerable') || d.hostname.toLowerCase().includes('legacy'));
      const compliant = devices.find((d) => !d.hostname.toLowerCase().includes('vulnerable') && !d.hostname.toLowerCase().includes('legacy'));

      setBeforeId(String(vulnerable ? vulnerable.id : devices[devices.length - 1].id));
      setAfterId(String(compliant ? compliant.id : devices[0].id));
    }
  }, [devices]);

  const handleRunDiff = async () => {
    if (!beforeId || !afterId || beforeId === afterId) return;
    setLoading(true);
    try {
      const data = await auditService.getSemanticDiff(Number(beforeId), Number(afterId));
      setDiffResult(data);
    } catch (err) {
      console.error('Semantic diff failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (beforeId && afterId && beforeId !== afterId) {
      handleRunDiff();
    }
  }, [beforeId, afterId]);

  const getDiffBadge = (type) => {
    switch (type) {
      case 'STATE_CHANGE':
        return <span className="badge badge-fail text-[9px] font-mono py-0.5">STATE CHANGE (DRIFT)</span>;
      case 'EVIDENCE_ONLY_CHANGE':
        return <span className="badge badge-mono text-[9px] font-mono py-0.5">SYNTAX ONLY (EQUIVALENT)</span>;
      case 'ADDED_PROPERTY':
        return <span className="badge badge-pass text-[9px] font-mono py-0.5">ADDED PROPERTY</span>;
      case 'REMOVED_PROPERTY':
        return <span className="badge badge-fail text-[9px] font-mono py-0.5">REMOVED PROPERTY</span>;
      default:
        return <span className="badge badge-white text-[9px] font-mono py-0.5 opacity-60">IDENTICAL</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="minimal-panel p-6 border-white/[0.08] relative overflow-hidden bg-gradient-to-r from-[#07070a] via-[#0d0d14] to-[#07070a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-white text-[10px] tracking-wider uppercase font-mono">
                SIH26155 &middot; Stage 08
              </span>
              <span className="badge badge-white text-[10px] font-mono">
                Semantic Configuration Diff Engine
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight pt-1">
              Cross-Vendor Semantic Property Difference Engine
            </h2>
            <p className="text-xs text-white/50 max-w-3xl leading-relaxed">
              Compares network configurations at the canonical security property and compliance state level rather than raw character text diffs.
              Distinguishes superficial vendor syntax disparities (e.g. Cisco vs Juniper commands that achieve the same result) from genuine security posture drifts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-[11px] font-mono text-white/60">
              <GitCompare size={12} className="text-white/60" />
              <span>AST-Aware Comparison</span>
            </div>
          </div>
        </div>
      </div>

      {/* Device Selection Sandbox */}
      <div className="minimal-panel p-6 border-white/[0.08]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 font-mono">
              Baseline Device A (Reference / Suspect):
            </label>
            <select
              value={beforeId}
              onChange={(e) => setBeforeId(e.target.value)}
              className="minimal-input w-full p-2.5 text-xs font-mono bg-black/70 border-white/[0.12] text-white"
            >
              {devices.map((d) => (
                <option key={d.id} value={String(d.id)} className="bg-[#0e0e14]">
                  {d.hostname} &mdash; {d.vendor} ({d.platform})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 font-mono">
              Target Device B (Comparison Benchmark):
            </label>
            <select
              value={afterId}
              onChange={(e) => setAfterId(e.target.value)}
              className="minimal-input w-full p-2.5 text-xs font-mono bg-black/70 border-white/[0.12] text-white"
            >
              {devices.map((d) => (
                <option key={d.id} value={String(d.id)} className="bg-[#0e0e14]">
                  {d.hostname} &mdash; {d.vendor} ({d.platform})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Diff Results Table */}
      {diffResult && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="minimal-panel p-6 border-white/[0.08] space-y-4"
        >
          {/* Summary Metric Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06] text-xs font-mono">
            <div className="text-white/80">
              Comparing <span className="text-white font-bold">{diffResult.before_device?.hostname}</span>{' '}
              <span className="text-white/40">({diffResult.before_device?.vendor})</span> vs{' '}
              <span className="text-zinc-200 font-bold">{diffResult.after_device?.hostname}</span>{' '}
              <span className="text-white/40">({diffResult.after_device?.vendor})</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-rose-400 font-bold">
                {diffResult.summary?.state_changes} Real Security Drifts
              </span>
              <span className="text-white/20">&bull;</span>
              <span className="text-zinc-300 font-bold">
                {diffResult.summary?.evidence_only_changes} Syntax-Only (Same Security Meaning)
              </span>
              <span className="text-white/20">&bull;</span>
              <span className="text-white/50">
                {diffResult.summary?.unchanged} Equivalent Properties
              </span>
            </div>
          </div>

          {/* Comparative Properties Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-white/40 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Semantic Classification</th>
                  <th className="py-3 px-3">Security Property</th>
                  <th className="py-3 px-3">Device A ({diffResult.before_device?.vendor})</th>
                  <th className="py-3 px-3">Device B ({diffResult.after_device?.vendor})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {diffResult.property_diffs?.map((diff, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors font-mono">
                    <td className="py-3.5 px-3">
                      {getDiffBadge(diff.diff_type)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white">
                      <div>{diff.property_id}</div>
                      <div className="text-[10px] text-white/40 font-sans">{diff.category}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className={`font-bold ${diff.before.state === 'UNKNOWN' ? 'text-amber-400' : 'text-white'}`}>
                        State: {diff.before.state}
                      </div>
                      <div className="text-[11px] text-white/50 truncate max-w-xs font-mono pt-0.5">
                        {diff.before.raw_text || '// not configured / absent'}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className={`font-bold ${diff.after.state === 'UNKNOWN' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        State: {diff.after.state}
                      </div>
                      <div className="text-[11px] text-white/50 truncate max-w-xs font-mono pt-0.5">
                        {diff.after.raw_text || '// not configured / absent'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SemanticDiffTab;
