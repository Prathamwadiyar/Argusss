import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Edit2, X, AlertTriangle, Shield, Cpu, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { auditService } from '../services/api';

const DialectEngineTab = ({ auditId, onMappingApproved }) => {
  const [unknowns, setUnknowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFragment, setSelectedFragment] = useState(null);
  const [editedProperty, setEditedProperty] = useState('');
  const [editedState, setEditedState] = useState('TRUE');
  const [reviewerName, setReviewerName] = useState('Senior Security Officer');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const propertyOptions = [
    { id: 'mgmt.ssh_only', name: 'Management SSH Only (CIS 4.1, NIST AC-17)', category: 'Management' },
    { id: 'mgmt.timeout', name: 'Session Inactivity Timeout <= 10m (CIS 4.3, NIST AC-12)', category: 'Management' },
    { id: 'auth.password_complexity', name: 'Password Complexity & Length (CIS 5.2, NIST IA-5)', category: 'Authentication' },
    { id: 'auth.root_auth', name: 'Privileged / Root Authentication (CIS 5.1, NIST IA-2)', category: 'Authentication' },
    { id: 'logging.central', name: 'Centralized Syslog SIEM (CIS 6.3, NIST AU-6)', category: 'Logging' },
    { id: 'time.ntp', name: 'NTP Time Synchronization (CIS 6.1, NIST AU-8)', category: 'Time' },
    { id: 'snmp.secure', name: 'Secure SNMPv3 Encryption Only (CIS 4.8, NIST SC-8)', category: 'SNMP' },
    { id: 'svc.insecure_services', name: 'Insecure Protocols Disabled (CIS 4.2, NIST CM-7)', category: 'Service' },
  ];

  const fetchUnknowns = async () => {
    setLoading(true);
    try {
      const data = await auditService.listUnknowns(auditId);
      setUnknowns(data);
    } catch (err) {
      console.error('Failed to load unknowns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnknowns();
  }, [auditId]);

  const handleOpenReview = (item) => {
    setSelectedFragment(item);
    setEditedProperty(item.ai_interpretation?.property_id || 'mgmt.ssh_only');
    setEditedState(item.ai_interpretation?.state || 'TRUE');
  };

  const handleApproveMapping = async (item, overrideProperty = null) => {
    setSubmitting(true);
    try {
      const propId = overrideProperty || editedProperty || item.ai_interpretation?.property_id;
      const payload = {
        vendor: item.device_vendor,
        fragment: item.raw_text,
        property_id: propId,
        property_state: editedState || 'TRUE',
        confidence: item.ai_interpretation?.confidence || 0.95,
        reviewer: reviewerName,
      };

      await auditService.reviewMapping(payload);
      setSuccessMessage(`Learned syntax "${item.raw_text.substring(0, 30)}..." committed to Knowledge Registry with provenance!`);
      setSelectedFragment(null);
      fetchUnknowns();
      if (onMappingApproved) onMappingApproved();
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err) {
      console.error('Failed to approve mapping', err);
      alert('Error approving mapping: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-[#f5f5f7]">
      {/* Header Info */}
      <div className="rounded-2xl p-6 bg-[#06060a]/95 backdrop-blur-2xl border border-white/[0.12] space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <Sparkles size={18} />
              </span>
              <h2 className="text-xl font-bold text-white font-display">
                Self-Evolving Vendor Dialect Engine (PRD DIF-01)
              </h2>
            </div>
            <p className="text-xs text-white/60 max-w-3xl leading-relaxed">
              Never silently drop or ignore unfamiliar syntax. Unrecognized CLI commands are classified by a bounded local
              scikit-learn TF-IDF (character + word n-gram) classifier. AI output provides a candidate property and calibrated confidence score;
              uncertain predictions fail closed into INCONCLUSIVE and require explicit human sign-off.
            </p>
          </div>

          <button
            onClick={fetchUnknowns}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white/80 hover:text-white text-xs font-mono font-semibold transition-all self-start md:self-center"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Triage Queue</span>
          </button>
        </div>

        {/* Architectural Principles Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/[0.08] text-xs font-mono">
          <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08]">
            <span className="text-[10px] text-white/40 uppercase block">Local Inference</span>
            <span className="text-emerald-400 font-bold">100% Offline scikit-learn</span>
          </div>
          <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08]">
            <span className="text-[10px] text-white/40 uppercase block">Confidence Threshold</span>
            <span className="text-cyan-400 font-bold">&ge; 75% for Candidate Mapping</span>
          </div>
          <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08]">
            <span className="text-[10px] text-white/40 uppercase block">Compliance Authority</span>
            <span className="text-amber-400 font-bold">Human Gated Approval Loop</span>
          </div>
        </div>

        {successMessage && (
          <div className="mt-2 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-2">
            <Check size={14} />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Unknown Fragments Triage Queue */}
      <div className="rounded-2xl p-6 bg-[#06060a]/95 border border-white/[0.12] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display uppercase tracking-wider">
            <AlertTriangle size={16} className="text-amber-400" />
            Detected Unfamiliar Syntax Triage Queue ({unknowns.length})
          </h3>
          <span className="text-xs text-white/50 font-mono">Gated Approval Loop &middot; Local ML Inference</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-white/40 text-xs font-mono">
            Scanning syntax fragments with local TF-IDF model...
          </div>
        ) : unknowns.length === 0 ? (
          <div className="p-12 text-center text-white/40 text-xs italic font-mono">
            No unclassified syntax fragments pending review in current audit session. All lines are either deterministically known or approved in Knowledge Registry.
          </div>
        ) : (
          <div className="space-y-3">
            {unknowns.map((item) => {
              const ai = item.ai_interpretation || {};
              const confPct = Math.round((ai.confidence || 0) * 100);
              const isHighConf = ai.high_confidence;

              return (
                <div
                  key={item.fragment_id}
                  className="rounded-2xl bg-black/60 border border-white/[0.08] hover:border-white/[0.2] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 font-bold">
                        {item.device_vendor}
                      </span>
                      <span className="font-bold text-white">{item.device_hostname}</span>
                      <span className="text-white/30">&bull;</span>
                      <span className="text-white/50">Line {item.line_start}</span>
                    </div>

                    <div className="bg-black/90 p-3.5 rounded-xl border border-white/[0.1] font-mono text-xs text-amber-200">
                      <code>{item.raw_text}</code>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 font-mono">
                      <span>
                        AI Inferred Property:{' '}
                        <strong className="text-cyan-400">{ai.property_name || ai.property_id}</strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Predicted State: <strong className="text-emerald-400">{ai.state}</strong>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        Confidence:{' '}
                        <strong className={isHighConf ? 'text-emerald-400' : 'text-amber-400'}>
                          {confPct}% {isHighConf ? '(High)' : '(Low - Gated Review)'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 justify-end shrink-0">
                    <button
                      onClick={() => handleApproveMapping(item)}
                      disabled={submitting}
                      className="px-3.5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <Check size={13} />
                      <span>Accept Prediction</span>
                    </button>

                    <button
                      onClick={() => handleOpenReview(item)}
                      className="px-3.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.12] text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Edit2 size={13} />
                      <span>Review / Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Human Review & Correction Modal */}
      <AnimatePresence>
        {selectedFragment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-[#06060a] border border-white/[0.15] p-6 sm:p-7 space-y-5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-display">
                  <Shield size={16} className="text-amber-400" />
                  Human Dialect Review & Mapping
                </h3>
                <button
                  onClick={() => setSelectedFragment(null)}
                  className="p-1 rounded-md text-white/50 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <span className="text-white/40 uppercase text-[10px] block mb-1">
                    Unfamiliar CLI Syntax Fragment:
                  </span>
                  <div className="bg-black/90 p-3 rounded-xl border border-white/[0.1] text-amber-300">
                    <code>{selectedFragment.raw_text}</code>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1.5">
                    Target Normalized Security Property:
                  </label>
                  <select
                    value={editedProperty}
                    onChange={(e) => setEditedProperty(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black border border-white/[0.12] text-white text-xs focus:border-cyan-400 focus:outline-none"
                  >
                    {propertyOptions.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-[#0e0e14] text-white">
                        {opt.category} &rarr; {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 font-semibold mb-1.5">
                      Mapped State Value:
                    </label>
                    <input
                      type="text"
                      value={editedState}
                      onChange={(e) => setEditedState(e.target.value)}
                      placeholder="e.g. TRUE, SSH_ONLY, RESTRICTED"
                      className="w-full p-2.5 rounded-xl bg-black border border-white/[0.12] text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 font-semibold mb-1.5">
                      Reviewer Signoff:
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black border border-white/[0.12] text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3 font-mono">
                <button
                  onClick={() => setSelectedFragment(null)}
                  className="px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white/70 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproveMapping(selectedFragment, editedProperty)}
                  disabled={submitting}
                  className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 shadow-md shadow-white/20"
                >
                  {submitting ? 'Committing...' : 'Commit to Knowledge Registry'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DialectEngineTab;
