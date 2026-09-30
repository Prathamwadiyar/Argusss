import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Code,
  Terminal,
  Shield,
  Layers,
  BookOpen
} from 'lucide-react';
import { auditService } from '../services/api';

const INTENT_FRAMEWORK_MAP = {
  'mgmt.ssh_only': ['CIS 1.1', 'NIST AC-17', 'DISA NET-0420', 'ISO A.9.4.2', 'NCIIPC Sec 4.2'],
  'mgmt.timeout': ['CIS 1.2', 'NIST AC-11', 'DISA NET-0430', 'ISO A.11.2.8', 'NCIIPC Sec 4.3'],
  'logging.central': ['CIS 3.1', 'NIST AU-2', 'DISA NET-1620', 'ISO A.12.4.1', 'NCIIPC Sec 5.1'],
  'auth.password_complexity': ['CIS 2.1', 'NIST IA-2', 'DISA NET-0810', 'ISO A.9.4.3', 'NCIIPC Sec 3.1'],
  'auth.root_auth': ['CIS 2.2', 'NIST IA-5', 'DISA NET-0820', 'ISO A.9.2.3', 'NCIIPC Sec 3.2'],
  'snmp.secure': ['CIS 4.1', 'NIST SC-8', 'DISA NET-2010', 'ISO A.13.1.1', 'NCIIPC Sec 6.1'],
  'time.ntp': ['CIS 3.2', 'NIST AU-8', 'DISA NET-1630', 'ISO A.12.4.4', 'NCIIPC Sec 5.2'],
  'svc.insecure_services': ['CIS 5.1', 'NIST CM-7', 'DISA NET-2410', 'ISO A.12.5.1', 'NCIIPC Sec 7.1']
};

const IntentCompilerTab = ({ auditId }) => {
  const [intentInput, setIntentInput] = useState(
    'Management access must enforce SSH v2 only and centralized syslog SIEM streaming must be active on all network devices.'
  );
  const [compiling, setCompiling] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  const presetIntents = [
    'Management access must enforce SSH v2 only and centralized syslog SIEM streaming must be active.',
    'Session idle timeout must be restricted to 10 minutes or less across the entire fleet.',
    'Enforce strong password complexity and require privileged enable authentication.',
    'SNMP monitoring must enforce encrypted v3 authentication only and eliminate community strings.',
    'Disable insecure legacy protocols including unencrypted HTTP and Telnet daemons.'
  ];

  const handleCompile = async (textToCompile = null) => {
    const text = textToCompile || intentInput;
    if (!text.trim()) return;

    setCompiling(true);
    try {
      const result = await auditService.compileIntent({
        natural_language: text,
        audit_id: auditId
      });
      setEvaluationResult(result);
    } catch (err) {
      console.error('Intent compilation failed', err);
      alert('Intent compilation failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setCompiling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PASS':
        return <span className="badge badge-pass text-[9px] font-mono py-0 px-2">PASS</span>;
      case 'FAIL':
        return <span className="badge badge-fail text-[9px] font-mono py-0 px-2">FAIL</span>;
      case 'INCONCLUSIVE':
        return <span className="badge badge-inc text-[9px] font-mono py-0 px-2">INCONCLUSIVE</span>;
      default:
        return <span className="badge badge-white text-[9px] font-mono py-0 px-2">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="minimal-panel p-6 border-white/[0.08] relative overflow-hidden bg-gradient-to-r from-[#07070a] via-[#0d0d14] to-[#07070a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-mono text-[10px] tracking-wider uppercase font-mono">
                SIH26155 &middot; DIF-02
              </span>
              <span className="badge badge-white text-[10px] font-mono">
                Universal Security Intent Compiler
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight pt-1">
              Natural-Language Intent to AST Predicate Compiler
            </h2>
            <p className="text-xs text-white/50 max-w-3xl leading-relaxed">
              Translates high-level enterprise security policies into deterministic Abstract Syntax Tree (AST) predicate
              expressions. Evaluates the multi-vendor fleet against normalized properties mapped to CIS Benchmarks, NIST SP 800-53,
              DISA STIGs, ISO/IEC 27001, and NCIIPC directives.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-[11px] font-mono text-white/60">
              <Code size={12} className="text-white/60" />
              <span>Bounded NLP Engine &middot; Offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Input Prompt Box & Preset Chips */}
      <div className="minimal-panel p-6 border-white/[0.08] space-y-4">
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 font-mono">
            Enter Natural-Language Security Intent Policy:
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              placeholder="e.g., Remote management access must enforce SSH-only and session idle timeout must be restricted..."
              className="minimal-input w-full p-4 text-xs font-mono bg-black/70 border-white/[0.12] text-white focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-2 font-mono">
            Authoritative Policy Intent Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {presetIntents.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIntentInput(preset);
                  handleCompile(preset);
                }}
                className="px-3 py-1.5 rounded-lg bg-black/50 hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.08] text-xs font-mono text-left transition-all"
              >
                &ldquo;{preset}&rdquo;
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleCompile()}
            disabled={compiling}
            className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2"
          >
            {compiling ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Compiling AST &amp; Evaluating Fleet...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Compile Intent &amp; Evaluate Multi-Vendor Fleet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compiled AST Predicates & Fleet Evaluation Result */}
      {evaluationResult && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Compiled AST Box */}
          <div className="minimal-panel p-6 border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code size={16} className="text-cyan-400" />
                Compiled Abstract Syntax Tree (AST) Predicates
              </h3>
              <span className="badge badge-white text-[10px] font-mono">
                {evaluationResult.compiled_intent?.predicates?.length || 0} Predicates Compiled
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {evaluationResult.compiled_intent?.predicates?.map((pred, idx) => {
                const frameworkRefs = INTENT_FRAMEWORK_MAP[pred.property_id] || ['CIS', 'NIST', 'DISA'];
                return (
                  <div key={idx} className="p-4 rounded-xl bg-black/60 border border-white/[0.08] space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold">{pred.predicate_expression}</span>
                      <span className="badge badge-white text-[9px]">{pred.category}</span>
                    </div>
                    <div className="text-white/60 text-[11px] font-sans">{pred.description}</div>
                    
                    <div className="pt-2 border-t border-white/[0.06] flex flex-wrap gap-1">
                      {frameworkRefs.map((ref, rIdx) => (
                        <span key={rIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/50 border border-white/[0.06]">
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fleet Evaluation Matrix */}
          <div className="minimal-panel p-6 border-white/[0.08] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal size={16} className="text-emerald-400" />
                  Multi-Vendor Fleet Policy Compliance Matrix
                </h3>
                <p className="text-xs text-white/40 mt-0.5">
                  Evaluated across {evaluationResult.fleet_summary?.total_devices} devices with evidence-based verification.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-semibold">
                <span className="text-emerald-400">
                  {evaluationResult.fleet_summary?.passed} Passed
                </span>
                <span className="text-white/20">&bull;</span>
                <span className="text-rose-400">
                  {evaluationResult.fleet_summary?.failed} Failed
                </span>
                <span className="text-white/20">&bull;</span>
                <span className="text-amber-400">
                  {evaluationResult.fleet_summary?.inconclusive} Inconclusive
                </span>
                <span className="text-white/20">&bull;</span>
                <span className="badge badge-white text-xs font-mono">
                  {evaluationResult.fleet_summary?.compliance_rate}% Compliance
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {evaluationResult.device_evaluations?.map((dev) => (
                <div
                  key={dev.device_id}
                  className="p-4 rounded-xl bg-black/60 border border-white/[0.08] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 font-mono">
                      <span className="font-bold text-sm text-white">{dev.hostname}</span>
                      <span className="badge badge-white text-[10px]">{dev.vendor}</span>
                    </div>
                    <div>{getStatusBadge(dev.overall_status)}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    {dev.predicates?.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-lg bg-[#050508] border border-white/[0.06] flex items-center justify-between text-xs font-mono"
                      >
                        <div className="space-y-0.5">
                          <div className="text-white font-medium">{p.property_id}</div>
                          <div className="text-white/40 text-[10px]">
                            Expected: <strong className="text-cyan-400">{p.expected}</strong> | Actual: <strong className="text-white/80">{p.actual}</strong>
                          </div>
                        </div>
                        <div>{getStatusBadge(p.status)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default IntentCompilerTab;
