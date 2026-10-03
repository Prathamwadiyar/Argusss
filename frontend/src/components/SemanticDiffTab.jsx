import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCompare } from 'lucide-react';
import { auditService } from '../services/api';

const SemanticDiffTab = ({ devices = [] }) => {
  const [beforeId, setBeforeId] = useState('');
  const [afterId, setAfterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [diffResult, setDiffResult] = useState(null);

  useEffect(() => {
    if (devices.length >= 2) {
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
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">STATE DRIFT</span>;
      case 'EVIDENCE_ONLY_CHANGE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">SYNTAX EQUIVALENT</span>;
      case 'ADDED_PROPERTY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ADDED</span>;
      case 'REMOVED_PROPERTY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">REMOVED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-50 text-slate-500 border border-slate-200">IDENTICAL</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header Info */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Semantic Comparison
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Cross-Vendor Semantic Difference Engine
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Compares appliances at the security property level rather than raw character diffs. Distinguishes
              superficial syntax differences from genuine configuration security drifts.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-700 font-medium self-start md:self-auto">
            <GitCompare size={13} className="text-emerald-600" />
            <span>AST Property Diff</span>
          </div>
        </div>
      </div>

      {/* Device Selection Sandbox */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
              Baseline Appliance A:
            </label>
            <select
              value={beforeId}
              onChange={(e) => setBeforeId(e.target.value)}
              className="w-full p-2 text-xs font-mono bg-white border border-slate-300 text-slate-900 rounded-lg shadow-xs focus:outline-none"
            >
              {devices.map((d) => (
                <option key={d.id} value={String(d.id)} className="bg-white text-slate-900">
                  {d.hostname} &mdash; {d.vendor} ({d.platform})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
              Comparison Appliance B:
            </label>
            <select
              value={afterId}
              onChange={(e) => setAfterId(e.target.value)}
              className="w-full p-2 text-xs font-mono bg-white border border-slate-300 text-slate-900 rounded-lg shadow-xs focus:outline-none"
            >
              {devices.map((d) => (
                <option key={d.id} value={String(d.id)} className="bg-white text-slate-900">
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3"
        >
          {/* Summary Metric Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs font-mono">
            <div className="text-slate-700">
              Comparing <span className="text-slate-900 font-bold">{diffResult.before_device?.hostname}</span>{' '}
              <span className="text-slate-500">({diffResult.before_device?.vendor})</span> vs{' '}
              <span className="text-slate-900 font-bold">{diffResult.after_device?.hostname}</span>{' '}
              <span className="text-slate-500">({diffResult.after_device?.vendor})</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-rose-700 font-bold">
                {diffResult.summary?.state_changes} Security Drifts
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-700 font-bold">
                {diffResult.summary?.evidence_only_changes} Syntax Equivalent
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-emerald-700 font-bold">
                {diffResult.summary?.unchanged} Identical
              </span>
            </div>
          </div>

          {/* Comparative Properties Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono uppercase tracking-wider text-[11px] bg-slate-50">
                  <th className="py-2.5 px-3 rounded-l">Classification</th>
                  <th className="py-2.5 px-3">Property</th>
                  <th className="py-2.5 px-3">Device A ({diffResult.before_device?.vendor})</th>
                  <th className="py-2.5 px-3 rounded-r">Device B ({diffResult.after_device?.vendor})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {diffResult.property_diffs?.map((diff, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      {getDiffBadge(diff.diff_type)}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div>{diff.property_id}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{diff.category}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className={`font-bold ${diff.before.state === 'UNKNOWN' ? 'text-amber-700' : 'text-slate-900'}`}>
                        State: {diff.before.state}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs font-mono pt-0.5">
                        {diff.before.raw_text || '// not configured / absent'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className={`font-bold ${diff.after.state === 'UNKNOWN' ? 'text-amber-700' : 'text-emerald-700'}`}>
                        State: {diff.after.state}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs font-mono pt-0.5">
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
