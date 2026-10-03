import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck,
  Sparkles,
  Code,
  Terminal,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle
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
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">PASS</span>;
      case 'FAIL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">FAIL</span>;
      case 'INCONCLUSIVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">INCONCLUSIVE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
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
                Intent Compiler
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Universal Security Intent Compiler
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Translates human security policies into vendor-neutral AST predicate expressions evaluated across heterogeneous fleets.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-700 font-medium self-start md:self-auto">
            <Code size={13} className="text-emerald-600" />
            <span>Deterministic AST Evaluator</span>
          </div>
        </div>
      </div>

      {/* Input Prompt Box & Preset Chips */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
            Enter Natural-Language Security Policy:
          </label>
          <textarea
            rows={3}
            value={intentInput}
            onChange={(e) => setIntentInput(e.target.value)}
            placeholder="e.g., Remote management access must enforce SSH-only and session idle timeout must be restricted..."
            className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:bg-white focus:border-slate-500 focus:outline-none"
          />
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">
            Standard Policy Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetIntents.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIntentInput(preset);
                  handleCompile(preset);
                }}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-mono text-left transition-all shadow-xs"
              >
                &ldquo;{preset}&rdquo;
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={() => handleCompile()}
            disabled={compiling}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            {compiling ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Compiling AST &amp; Evaluating...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Compile Intent &amp; Evaluate Fleet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compiled AST Predicates & Fleet Evaluation Result */}
      {evaluationResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Compiled AST Box */}
          <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Code size={15} className="text-slate-700" />
                Compiled AST Predicates ({evaluationResult.compiled_intent?.predicates?.length || 0})
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {evaluationResult.compiled_intent?.predicates?.map((pred, idx) => {
                const frameworkRefs = INTENT_FRAMEWORK_MAP[pred.property_id] || ['CIS', 'NIST', 'DISA'];
                return (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 font-bold">{pred.predicate_expression}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px]">{pred.category}</span>
                    </div>
                    <div className="text-slate-600 text-[11px] font-sans">{pred.description}</div>
                    
                    <div className="pt-1.5 border-t border-slate-200/60 flex flex-wrap gap-1">
                      {frameworkRefs.map((ref, rIdx) => (
                        <span key={rIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
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
          <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Terminal size={15} className="text-slate-700" />
                  Fleet Policy Compliance Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluated across {evaluationResult.fleet_summary?.total_devices} devices with evidence verification.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono font-semibold">
                <span className="text-emerald-700">
                  {evaluationResult.fleet_summary?.passed} Passed
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-rose-700">
                  {evaluationResult.fleet_summary?.failed} Failed
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-amber-700">
                  {evaluationResult.fleet_summary?.inconclusive} Inconclusive
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-xs font-mono font-bold">
                  {evaluationResult.fleet_summary?.compliance_rate}% Compliance
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {evaluationResult.device_evaluations?.map((dev) => (
                <div
                  key={dev.device_id}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 font-mono">
                      <span className="font-bold text-sm text-slate-900">{dev.hostname}</span>
                      <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-bold">{dev.vendor}</span>
                    </div>
                    <div>{getStatusBadge(dev.overall_status)}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-0.5">
                    {dev.predicates?.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="space-y-0.5">
                          <div className="text-slate-900 font-semibold">{p.property_id}</div>
                          <div className="text-slate-500 text-[10px]">
                            Expected: <strong className="text-slate-800">{p.expected}</strong> | Actual: <strong className="text-slate-800">{p.actual}</strong>
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
