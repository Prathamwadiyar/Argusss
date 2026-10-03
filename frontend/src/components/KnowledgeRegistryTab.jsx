import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, RotateCcw, AlertTriangle, Shield, X, RefreshCw } from 'lucide-react';
import { auditService } from '../services/api';

const KnowledgeRegistryTab = ({ onAuditFlaggedForReAudit }) => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [revocationImpact, setRevocationImpact] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const data = await auditService.getKnowledgeRegistry(statusFilter === 'ALL' ? null : statusFilter);
      setMappings(data);
    } catch (err) {
      console.error('Failed to fetch knowledge mappings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, [statusFilter]);

  const handleRevoke = async (mappingId) => {
    if (!window.confirm('Are you sure you want to revoke this learned syntax interpretation? All audits relying on this mapping will be marked for re-audit.')) {
      return;
    }
    setRevokingId(mappingId);
    try {
      const res = await auditService.revokeKnowledgeMapping(mappingId, 'Senior Compliance Auditor');
      setRevocationImpact(res.impact_analysis);
      fetchMappings();
      if (onAuditFlaggedForReAudit) onAuditFlaggedForReAudit();
    } catch (err) {
      console.error('Revocation failed', err);
      alert('Revocation failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header Info */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Knowledge Governance
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Auditable Knowledge Registry & Reversal
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Immutable versioned lifecycle governance for learned syntax. When a mapping is revoked,
              provenance is preserved and all historical dependent audits are automatically flagged for re-audit.
            </p>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            {['ALL', 'APPROVED', 'REVOKED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Mappings' : st === 'APPROVED' ? 'Active' : 'Revoked'}
              </button>
            ))}
          </div>
        </div>

        {/* Provenance & Reversal Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-slate-100 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Governance</span>
            <span className="text-emerald-700 font-bold">Immutable Audit Provenance</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Revocation Safety</span>
            <span className="text-rose-700 font-bold">Blast-Radius Propagation</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Dependency Tracking</span>
            <span className="text-slate-800 font-bold">Automatic Re-Audit Trigger</span>
          </div>
        </div>
      </div>

      {/* Revocation Impact Alert Box */}
      {revocationImpact && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 bg-rose-50 border border-rose-200 text-xs font-mono space-y-1.5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-800 flex items-center gap-2">
              <AlertTriangle size={15} /> Knowledge Revocation Blast-Radius Analysis
            </span>
            <button onClick={() => setRevocationImpact(null)} className="text-rose-400 hover:text-rose-700">
              <X size={14} />
            </button>
          </div>
          <div className="text-rose-900 leading-relaxed">
            Mapping <strong>{revocationImpact.revoked_mapping_id}</strong> revoked.
            Affected <strong className="text-rose-700">{revocationImpact.affected_audits?.length || 0}</strong> historical audits and{' '}
            <strong className="text-rose-700">{revocationImpact.affected_findings_count || 0}</strong> findings.
            Dependent audits have been transitioned to <strong className="text-amber-800">RE_AUDIT_REQUIRED</strong>.
          </div>
        </motion.div>
      )}

      {/* Mappings Table */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Shield size={15} className="text-slate-700" />
            Versioned Syntax Knowledge Base ({mappings.length})
          </h3>
          <button
            onClick={fetchMappings}
            className="text-xs text-slate-600 hover:text-slate-900 font-mono flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh List
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono bg-slate-50 rounded-lg">Loading knowledge registry...</div>
        ) : mappings.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic font-mono bg-slate-50 rounded-lg">
            No learned knowledge mappings registered yet. Approve unfamiliar syntax in the Dialect Engine tab to seed the registry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] bg-slate-50">
                  <th className="py-2.5 px-3 rounded-l">Status</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Command Syntax Pattern</th>
                  <th className="py-2.5 px-3">Mapped Security Property</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Ver</th>
                  <th className="py-2.5 px-3">Reviewer / Provenance</th>
                  <th className="py-2.5 px-3 text-right rounded-r">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mappings.map((m) => {
                  const isRevoked = m.review_status === 'REVOKED';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isRevoked
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {m.review_status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px] border border-slate-200">
                          {m.vendor}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-semibold">
                        <code>{m.fragment_pattern}</code>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-bold">{m.property_id}</td>
                      <td className="py-3 px-3 text-emerald-700 font-bold">{m.property_state}</td>
                      <td className="py-3 px-3 text-slate-500">v{m.version}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <div>{m.reviewer}</div>
                        <div className="text-[10px] text-slate-400">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isRevoked ? (
                          <button
                            onClick={() => handleRevoke(m.id)}
                            disabled={revokingId === m.id}
                            className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-all shadow-xs"
                          >
                            <RotateCcw size={11} />
                            <span>Revoke Mapping</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Archived</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeRegistryTab;
