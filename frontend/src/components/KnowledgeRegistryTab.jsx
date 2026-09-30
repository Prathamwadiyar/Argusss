import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, RotateCcw, AlertTriangle, CheckCircle, Shield, X, RefreshCw, FileText } from 'lucide-react';
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
    <div className="space-y-6 animate-fadeIn text-[#f5f5f7]">
      {/* Header Info */}
      <div className="rounded-2xl p-6 bg-[#06060a]/95 backdrop-blur-2xl border border-white/[0.12] space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Database size={18} />
              </span>
              <h2 className="text-xl font-bold text-white font-display">
                Auditable Knowledge Registry & Reversal (PRD DIF-05)
              </h2>
            </div>
            <p className="text-xs text-white/60 max-w-3xl leading-relaxed">
              Versioned lifecycle governance for all learned syntax interpretations. When an unsafe or
              outdated mapping is revoked, the system preserves provenance and instantly identifies all historical dependent audits,
              marking them for re-evaluation.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono">
            {['ALL', 'APPROVED', 'REVOKED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-white text-black font-bold'
                    : 'bg-white/[0.04] text-white/60 hover:text-white border border-white/[0.08]'
                }`}
              >
                {st === 'ALL' ? 'All Mappings' : st === 'APPROVED' ? 'Active' : 'Revoked'}
              </button>
            ))}
          </div>
        </div>

        {/* Provenance & Reversal Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/[0.08] text-xs font-mono">
          <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08]">
            <span className="text-[10px] text-white/40 uppercase block">Governance Rule</span>
            <span className="text-emerald-400 font-bold">Immutable Audit Provenance</span>
          </div>
          <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08]">
            <span className="text-[10px] text-white/40 uppercase block">Revocation Safety</span>
            <span className="text-rose-400 font-bold">Instant Blast-Radius Propagation</span>
          </div>
          <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08]">
            <span className="text-[10px] text-white/40 uppercase block">Re-Audit State</span>
            <span className="text-amber-400 font-bold">Automatic Dependency Invalidation</span>
          </div>
        </div>
      </div>

      {/* Revocation Impact Alert Box */}
      {revocationImpact && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 bg-rose-950/30 border border-rose-500/40 text-xs font-mono space-y-2 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle size={15} /> Knowledge Revocation Blast-Radius Analysis
            </span>
            <button onClick={() => setRevocationImpact(null)} className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="text-white/80">
            Mapping <strong className="text-white">{revocationImpact.revoked_mapping_id}</strong> revoked.
            Affected <strong className="text-rose-400">{revocationImpact.affected_audits?.length || 0}</strong> historical audits and{' '}
            <strong className="text-rose-400">{revocationImpact.affected_findings_count || 0}</strong> findings.
            Dependent audits have been transitioned to <strong className="text-amber-300">RE_AUDIT_REQUIRED</strong>.
          </div>
        </motion.div>
      )}

      {/* Mappings Table */}
      <div className="rounded-2xl p-6 bg-[#06060a]/95 border border-white/[0.12] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display uppercase tracking-wider">
            <Shield size={16} className="text-cyan-400" />
            Versioned Syntax Knowledge Base ({mappings.length})
          </h3>
          <button
            onClick={fetchMappings}
            className="text-xs text-cyan-400 hover:text-white font-mono flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh List
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-white/40 text-xs font-mono">Loading knowledge registry...</div>
        ) : mappings.length === 0 ? (
          <div className="p-12 text-center text-white/40 text-xs italic font-mono">
            No learned knowledge mappings registered yet. Approve unfamiliar syntax in the Dialect Engine tab to seed the registry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] text-white/40 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Vendor</th>
                  <th className="py-3 px-3">Command Syntax Pattern</th>
                  <th className="py-3 px-3">Mapped Security Property</th>
                  <th className="py-3 px-3">State</th>
                  <th className="py-3 px-3">Ver</th>
                  <th className="py-3 px-3">Reviewer / Provenance</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {mappings.map((m) => {
                  const isRevoked = m.review_status === 'REVOKED';

                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isRevoked
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {m.review_status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-cyan-300 font-bold text-[10px]">
                          {m.vendor}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-amber-200">
                        <code>{m.fragment_pattern}</code>
                      </td>
                      <td className="py-3 px-3 text-cyan-400 font-bold">{m.property_id}</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{m.property_state}</td>
                      <td className="py-3 px-3 text-white/50">v{m.version}</td>
                      <td className="py-3 px-3 text-white/70">
                        <div>{m.reviewer}</div>
                        <div className="text-[10px] text-white/40">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isRevoked ? (
                          <button
                            onClick={() => handleRevoke(m.id)}
                            disabled={revokingId === m.id}
                            className="px-3 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-all"
                          >
                            <RotateCcw size={12} />
                            <span>Revoke Mapping</span>
                          </button>
                        ) : (
                          <span className="text-white/30 text-[11px] italic">Revoked & Archived</span>
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
