import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Edit2, X, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
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
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header Info */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Dialect Engine
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Self-Evolving Vendor Dialect Engine
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Unrecognized CLI commands are classified by a bounded local TF-IDF model. Candidate mappings
              require human sign-off before being committed into the verifiable knowledge registry.
            </p>
          </div>

          <button
            onClick={fetchUnknowns}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-mono font-semibold transition-all self-start md:self-center shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Principles Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-slate-100 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Local Inference</span>
            <span className="text-emerald-700 font-bold">100% Offline scikit-learn</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Confidence Threshold</span>
            <span className="text-slate-800 font-bold">&ge; 75% for Candidate Mapping</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Compliance Authority</span>
            <span className="text-amber-700 font-bold">Human Gated Sign-Off</span>
          </div>
        </div>

        {successMessage && (
          <div className="mt-1 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-2">
            <Check size={14} className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Unknown Fragments Triage Queue */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
            <AlertTriangle size={15} className="text-amber-600" />
            Detected Unfamiliar Syntax Triage Queue ({unknowns.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Gated Approval Loop</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-xs font-mono bg-slate-50 rounded-lg">
            Scanning syntax fragments with local TF-IDF model...
          </div>
        ) : unknowns.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs italic font-mono bg-slate-50 rounded-lg">
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
                  className="rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 font-bold">
                        {item.device_vendor}
                      </span>
                      <span className="font-bold text-slate-900">{item.device_hostname}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-500">Line {item.line_start}</span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-amber-300">
                      <code>{item.raw_text}</code>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono">
                      <span>
                        AI Candidate:{' '}
                        <strong className="text-slate-900 font-semibold">{ai.property_name || ai.property_id}</strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Predicted State: <strong className="text-emerald-700">{ai.state}</strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Confidence:{' '}
                        <strong className={isHighConf ? 'text-emerald-700' : 'text-amber-700'}>
                          {confPct}% {isHighConf ? '(High)' : '(Gated Review)'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 justify-end shrink-0">
                    <button
                      onClick={() => handleApproveMapping(item)}
                      disabled={submitting}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Check size={13} />
                      <span>Accept Prediction</span>
                    </button>

                    <button
                      onClick={() => handleOpenReview(item)}
                      className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-xs"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg rounded-xl bg-white border border-slate-300 p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <Shield size={16} className="text-emerald-600" />
                  Human Dialect Review & Mapping
                </h3>
                <button
                  onClick={() => setSelectedFragment(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block mb-1">
                    Unfamiliar CLI Syntax Fragment:
                  </span>
                  <div className="bg-slate-900 p-2.5 rounded-lg text-amber-300">
                    <code>{selectedFragment.raw_text}</code>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Target Normalized Security Property:
                  </label>
                  <select
                    value={editedProperty}
                    onChange={(e) => setEditedProperty(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none"
                  >
                    {propertyOptions.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-white text-slate-900">
                        {opt.category} &rarr; {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Mapped State Value:
                    </label>
                    <input
                      type="text"
                      value={editedState}
                      onChange={(e) => setEditedState(e.target.value)}
                      placeholder="e.g. TRUE, SSH_ONLY"
                      className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Reviewer Signoff:
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 font-mono">
                <button
                  onClick={() => setSelectedFragment(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproveMapping(selectedFragment, editedProperty)}
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm"
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
