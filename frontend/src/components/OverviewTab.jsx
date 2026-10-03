import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Server,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Shield,
  Hash,
  ExternalLink,
  Upload,
  Sparkles,
  Play
} from 'lucide-react';

const OverviewTab = ({ auditData, findings = [], setActiveTab, onReAudit, reAuditing, onLoadDemo, loadingDemo }) => {
  const summary = auditData?.summary || {
    compliance_score: 0,
    device_count: 0,
    pass_count: 0,
    fail_count: 0,
    inconclusive_count: 0,
    total_findings: 0
  };

  const devices = auditData?.devices || [];
  const score = summary.compliance_score || 0;

  // Group findings by severity for immediate authority review
  const criticalFails = findings.filter(f => f.status === 'FAIL' && f.severity === 'CRITICAL');
  const highFails = findings.filter(f => f.status === 'FAIL' && f.severity === 'HIGH');
  const topIssues = [...criticalFails, ...highFails].slice(0, 6);

  const workflowStages = [
    { id: 'ingestion', label: '1. Ingest', status: 'Done' },
    { id: 'ingestion', label: '2. Vendor Detect', status: 'Done' },
    { id: 'findings', label: '3. AST Parser', status: 'Done' },
    { id: 'equivalence', label: '4. Properties', status: 'Done' },
    { id: 'findings', label: '5. Frameworks', status: 'Done' },
    { id: 'findings', label: '6. Verdicts', status: 'Done' },
    { id: 'dialect', label: '7. Local AI', status: 'Gated' },
    { id: 'knowledge', label: '8. Audit Log', status: 'Gated' },
    { id: 'diff', label: '9. Diff Engine', status: 'Ready' },
    { id: 'simulator', label: '10. Simulation', status: 'Ready' },
  ];

  const frameworksList = [
    { code: 'CIS Benchmarks', scope: 'Cisco IOS v4.1 · Junos · FortiOS', status: '100% Deterministic' },
    { code: 'NIST SP 800-53', scope: 'Rev. 5 AC-17, IA-5, AU-6, CM-7', status: 'Authoritative' },
    { code: 'DISA STIGs', scope: 'DoD NET-0420, NET-0810, NET-0750', status: 'Authoritative' },
    { code: 'ISO/IEC 27001', scope: '2022 A.9.4.2, A.12.4.1, A.13.1.1', status: 'Standardized' },
    { code: 'NCIIPC Guidance', scope: 'Sec 4.2, 5.1, 6.3, 7.1 Hardening', status: 'National CII' },
  ];

  if (!auditData || summary.device_count === 0) {
    return (
      <div className="space-y-6 animate-fadeIn text-slate-800">
        <div className="rounded-2xl p-8 sm:p-10 bg-white border border-slate-200 shadow-sm text-center max-w-3xl mx-auto my-8 space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={32} />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
              Real-Time Compliance Audit Engine Ready
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Argus operates on 100% real-time deterministic AST analysis. No hardcoded dummy data is loaded by default. Upload your network configuration file(s) or launch a live real-time fleet audit below.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab('ingestion')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              <span>Upload Config File(s) Live</span>
            </button>

            {onLoadDemo && (
              <button
                onClick={onLoadDemo}
                disabled={loadingDemo}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingDemo ? (
                  <>
                    <RefreshCw size={18} className="animate-spin text-emerald-600" />
                    <span>Auditing Live...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="text-emerald-600" />
                    <span>Run Live Audit on Sample Fleet</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-mono">
            <span>&bull; Cisco IOS-XE (.cfg)</span>
            <span>&bull; Juniper Junos (.conf)</span>
            <span>&bull; Fortinet FortiOS (.conf)</span>
            <span>&bull; Palo Alto PAN-OS (.xml/.txt)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Top Banner & Audit Integrity Header */}
      <div className="rounded-xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
                {auditData?.title || 'Multi-Vendor Network Security Compliance Audit'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                auditData?.status === 'RE_AUDIT_REQUIRED'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {auditData?.status || 'COMPLETED'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Official regulatory compliance dossier. Heterogeneous network device analysis evaluated against
              CIS Benchmarks, NIST SP 800-53, DISA STIGs, ISO/IEC 27001, and NCIIPC directives with line-level configuration proof.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Hash size={12} className="text-slate-400" />
                Audit Hash: <strong className="text-slate-800 font-semibold">{auditData?.input_hash ? auditData.input_hash.slice(0, 16) + '...' : 'N/A'}</strong>
              </span>
              <span>&bull;</span>
              <span>Devices Ingested: <strong className="text-slate-900 font-semibold">{summary.device_count}</strong></span>
              <span>&bull;</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                100% Local Deterministic Core
              </span>
            </div>
          </div>

          {auditData?.status === 'RE_AUDIT_REQUIRED' && (
            <button
              onClick={onReAudit}
              disabled={reAuditing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-all shrink-0"
            >
              <RefreshCw size={14} className={reAuditing ? 'animate-spin' : ''} />
              <span>Knowledge Changed: Run Re-Audit</span>
            </button>
          )}
        </div>

        {/* 10-Stage Pipeline Horizontal Mini-Tracker */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">
            <span>Audit Workflow Pipeline Status</span>
            <span className="text-slate-700 font-medium">Deterministic Core &rarr; Local AI &rarr; Human Review</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
            {workflowStages.map((stage, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(stage.id)}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors text-left group"
              >
                <div className="text-[9px] font-mono text-slate-500 group-hover:text-slate-700">
                  {stage.status}
                </div>
                <div className="text-[10px] font-semibold text-slate-800 truncate mt-0.5">
                  {stage.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid: PASS / FAIL / INCONCLUSIVE / SCORE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Score */}
        <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Fleet Compliance Rate</span>
            <div className={`p-2 rounded-lg border ${
              score >= 80
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : score >= 50
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-extrabold tracking-tight ${score >= 80 ? 'text-emerald-700' : score >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                {score}%
              </span>
              <span className="text-xs text-slate-500 font-mono">weighted pass</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-600' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Passed Controls */}
        <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Passed Controls</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-extrabold text-emerald-700">{summary.pass_count}</div>
            <p className="text-xs text-slate-500 mt-1 font-mono">Compliant deterministic assertions</p>
          </div>
        </div>

        {/* Failed Violations */}
        <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Security Violations</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-extrabold text-rose-700">{summary.fail_count}</div>
            <p className="text-xs text-slate-500 mt-1 font-mono">Non-compliant policy findings</p>
          </div>
        </div>

        {/* Inconclusive / Human Triage */}
        <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Inconclusive / Triage</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-extrabold text-amber-700">{summary.inconclusive_count}</div>
            <p className="text-xs text-slate-500 mt-1 font-mono">Gated for human auditor review</p>
          </div>
        </div>
      </div>

      {/* Authoritative Security Framework Coverage */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
              <Shield size={15} className="text-emerald-600" />
              Authoritative Security Framework Coverage
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic compliance controls mapped across international, military, and national baselines.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('findings')}
            className="text-xs text-slate-600 hover:text-emerald-700 font-mono flex items-center gap-1 transition-colors"
          >
            <span>View Rule Matrices</span> &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {frameworksList.map((fw, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-900">{fw.code}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {fw.status}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 leading-tight">
                {fw.scope}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Inventory & Actionable Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Device Fleet Quick List */}
        <div className="lg:col-span-5 rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Server size={15} className="text-slate-700" />
              Ingested Network Fleet ({devices.length})
            </h2>
            <button
              onClick={() => setActiveTab('ingestion')}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-mono transition-colors"
            >
              Manage Fleet <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2">
            {devices.map((d) => (
              <div key={d.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100 transition-colors">
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs sm:text-sm text-slate-900">{d.hostname}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-bold">{d.vendor}</span>
                    <span>{d.platform}</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[11px] text-emerald-700 font-semibold">Conf: {Math.round(d.confidence * 100)}%</span>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{d.source_file}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Violations Requiring Remediation */}
        <div className="lg:col-span-7 rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
              <AlertTriangle size={15} className="text-rose-600" />
              Actionable Security Violations & Gaps
            </h2>
            <button
              onClick={() => setActiveTab('findings')}
              className="text-xs text-rose-700 hover:text-rose-800 flex items-center gap-1 font-mono transition-colors font-semibold"
            >
              View All ({findings.length}) <ArrowRight size={12} />
            </button>
          </div>

          {topIssues.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic font-mono bg-slate-50 rounded-lg">
              No critical or high severity violations detected in active audit session.
            </div>
          ) : (
            <div className="space-y-2.5">
              {topIssues.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setActiveTab('findings')}
                  className="p-3 rounded-lg bg-rose-50/40 border border-rose-200 hover:bg-rose-50 transition-all cursor-pointer flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-800 font-mono text-[10px] font-bold">
                        {f.severity}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {f.control_code}: {f.control_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug line-clamp-2">{f.description}</p>
                    <div className="text-[11px] font-mono text-slate-500 pt-0.5">
                      Target: <span className="text-slate-800 font-semibold">{f.device_hostname}</span> ({f.device_vendor})
                    </div>
                  </div>
                  <button className="px-2.5 py-1 text-xs rounded bg-white text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all whitespace-nowrap font-mono self-center shadow-xs">
                    Inspect Evidence
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
