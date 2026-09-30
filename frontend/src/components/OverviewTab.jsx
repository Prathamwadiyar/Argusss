import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Server,
  Sparkles,
  Play,
  ArrowRight,
  RefreshCw,
  Lock,
  Cpu,
  Layers,
  FileCheck,
  CheckCircle2,
  Code,
  Shield
} from 'lucide-react';

const OverviewTab = ({ auditData, findings = [], setActiveTab, onReAudit, reAuditing }) => {
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

  // Group findings by severity
  const criticalFails = findings.filter(f => f.status === 'FAIL' && f.severity === 'CRITICAL');
  const highFails = findings.filter(f => f.status === 'FAIL' && f.severity === 'HIGH');
  const topIssues = [...criticalFails, ...highFails].slice(0, 5);

  const workflowStages = [
    { id: 'ingestion', label: '1. Ingest (Cisco/Junos/Forti)', status: 'Done' },
    { id: 'ingestion', label: '2. Vendor Detection', status: 'Done' },
    { id: 'findings', label: '3. Deterministic Parsing', status: 'Done' },
    { id: 'equivalence', label: '4. Neutral Properties', status: 'Active' },
    { id: 'findings', label: '5. Framework Mapping', status: 'Done' },
    { id: 'findings', label: '6. PASS/FAIL/INC Verdicts', status: 'Done' },
    { id: 'dialect', label: '7. Bounded Local AI', status: 'Gated' },
    { id: 'knowledge', label: '8. Human Review Loop', status: 'Gated' },
    { id: 'diff', label: '9. Semantic Comparison', status: 'Ready' },
    { id: 'simulator', label: '10. Simulation & Report', status: 'Ready' },
  ];

  const frameworksList = [
    { code: 'CIS Benchmarks', scope: 'Cisco IOS v4.1 &bull; Junos &bull; FortiOS', status: '100% Deterministic' },
    { code: 'NIST SP 800-53', scope: 'Rev. 5 AC-17, IA-5, AU-6, CM-7', status: 'Authoritative' },
    { code: 'DISA STIGs', scope: 'DoD NET-0420, NET-0810, NET-0750', status: 'Authoritative' },
    { code: 'ISO/IEC 27001', scope: '2022 A.9.4.2, A.12.4.1, A.13.1.1', status: 'Standardized' },
    { code: 'NCIIPC Guidance', scope: 'Sec 4.2, 5.1, 6.3, 7.1 Hardening', status: 'National CII' },
  ];

  const differentiators = [
    {
      id: 'dialect',
      tag: 'PRD DIF-01',
      title: 'Self-Evolving Dialect Engine',
      desc: 'Local ML parser detects unfamiliar vendor syntax and learns mappings through human-gated approval.',
      icon: Sparkles,
      color: 'border-white/[0.1] text-zinc-300'
    },
    {
      id: 'intent',
      tag: 'PRD DIF-02',
      title: 'Universal Security Intent Compiler',
      desc: 'Translates natural-language policies into vendor-neutral AST predicates evaluated across fleets.',
      icon: FileCheck,
      color: 'border-white/[0.1] text-zinc-300'
    },
    {
      id: 'equivalence',
      tag: 'PRD DIF-03',
      title: 'Cross-Vendor Equivalence Graph',
      desc: 'Interactive node-link graph mapping heterogeneous commands to unified security properties.',
      icon: Layers,
      color: 'border-white/[0.1] text-zinc-300'
    },
    {
      id: 'simulator',
      tag: 'PRD DIF-04',
      title: 'Counterfactual Simulator',
      desc: 'Dry-run sandbox predicting before-and-after compliance state and generating remediation CLI scripts.',
      icon: Play,
      color: 'border-white/[0.1] text-zinc-300'
    },
    {
      id: 'knowledge',
      tag: 'PRD DIF-05',
      title: 'Auditable Reversal Engine',
      desc: 'Revoke learned mappings with instant blast-radius impact analysis across past audits.',
      icon: RefreshCw,
      color: 'border-white/[0.1] text-zinc-300'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-[#f5f5f7]">
      {/* Top Banner & Integrity Verification */}
      <div className="rounded-2xl p-6 sm:p-7 bg-[#06060a]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                {auditData?.title || 'SIH26155 Multi-Vendor Compliance Audit'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                auditData?.status === 'RE_AUDIT_REQUIRED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {auditData?.status || 'COMPLETED'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-white/70 max-w-3xl leading-relaxed">
              Deterministic verification first, bounded local AI second. Heterogeneous multi-vendor configuration analysis
              without vendor lock-in or cloud dependencies. Evaluated against CIS Benchmarks, NIST SP 800-53, DISA STIGs, ISO/IEC 27001, and NCIIPC guidelines.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-white/50 pt-1">
              <span>SHA-256 Audit Hash: <strong className="text-zinc-300">{auditData?.input_hash || 'N/A'}</strong></span>
              <span>&bull;</span>
              <span>Devices Ingested: <strong className="text-white">{summary.device_count}</strong></span>
              <span>&bull;</span>
              <span>Execution: <strong className="text-emerald-400">100% Local / Offline</strong></span>
              <span>&bull;</span>
              <span>Rule Authority: <strong className="text-emerald-400">Deterministic</strong></span>
            </div>
          </div>

          {auditData?.status === 'RE_AUDIT_REQUIRED' && (
            <button
              onClick={onReAudit}
              disabled={reAuditing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all shrink-0"
            >
              <RefreshCw size={14} className={reAuditing ? 'animate-spin' : ''} />
              <span>Knowledge Changed: Run Re-Audit</span>
            </button>
          )}
        </div>

        {/* 10-Stage Pipeline Horizontal Progress Tracker */}
        <div className="mt-6 pt-5 border-t border-white/[0.08]">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/40 uppercase tracking-wider mb-2">
            <span>SIH26155 Official Audit Workflow Pipeline</span>
            <span className="text-zinc-300">Deterministic Core &rarr; Bounded AI &rarr; Human Review</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
            {workflowStages.map((stage, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(stage.id)}
                className="p-2 rounded-lg bg-black/60 border border-white/[0.08] hover:border-white/[0.2] transition-colors text-left group"
              >
                <div className="text-[9px] font-mono text-white/40 group-hover:text-white/60">
                  {stage.status}
                </div>
                <div className="text-[10px] font-semibold text-white/80 group-hover:text-white truncate mt-0.5">
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
        <motion.div whileHover={{ y: -2 }} className="rounded-2xl p-5 bg-[#06060a]/95 border border-white/[0.1] flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Fleet Compliance Rate</span>
            <div className={`p-2 rounded-lg border ${
              score >= 80
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                : score >= 50
                ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                : 'bg-rose-400/10 text-rose-400 border-rose-400/20'
            }`}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-extrabold tracking-tight ${score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {score}%
              </span>
              <span className="text-xs text-white/40 font-mono">weighted pass</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-white/[0.06] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Passed Controls */}
        <motion.div whileHover={{ y: -2 }} className="rounded-2xl p-5 bg-[#06060a]/95 border border-white/[0.1] flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Passed Controls</span>
            <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-extrabold text-emerald-400">{summary.pass_count}</div>
            <p className="text-xs text-white/50 mt-1 font-mono">Deterministic compliant assertions</p>
          </div>
        </motion.div>

        {/* Failed Violations */}
        <motion.div whileHover={{ y: -2 }} className="rounded-2xl p-5 bg-[#06060a]/95 border border-white/[0.1] flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Security Violations</span>
            <div className="p-2 rounded-lg bg-rose-400/10 text-rose-400 border border-rose-400/20">
              <XCircle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-extrabold text-rose-400">{summary.fail_count}</div>
            <p className="text-xs text-white/50 mt-1 font-mono">Non-compliant policy findings</p>
          </div>
        </motion.div>

        {/* Inconclusive / Human Triage */}
        <motion.div whileHover={{ y: -2 }} className="rounded-2xl p-5 bg-[#06060a]/95 border border-white/[0.1] flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Inconclusive (AI / Gaps)</span>
            <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-extrabold text-amber-400">{summary.inconclusive_count}</div>
            <p className="text-xs text-white/50 mt-1 font-mono">Gated for human review & dialect learning</p>
          </div>
        </motion.div>
      </div>

      {/* Authoritative Security Framework Coverage */}
      <div className="rounded-2xl p-6 bg-[#06060a]/95 border border-white/[0.12] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Shield size={16} className="text-white" />
              Authoritative Security Framework Coverage (5 Standards)
            </h2>
            <p className="text-xs text-white/50">
              Controls are deterministically mapped across international, military, and national critical infrastructure baselines.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('findings')}
            className="text-xs text-zinc-400 hover:text-white font-mono flex items-center gap-1 transition-colors"
          >
            <span>View Framework Evidence</span> &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {frameworksList.map((fw, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white font-display">{fw.code}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-emerald-400">
                  {fw.status}
                </span>
              </div>
              <div className="text-[11px] font-mono text-white/50 leading-relaxed">
                {fw.scope}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Inventory & Top Actionable Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Device Fleet Quick List */}
        <div className="lg:col-span-5 rounded-2xl p-6 bg-[#06060a]/95 border border-white/[0.12] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display uppercase tracking-wider">
              <Server size={16} className="text-white" />
              Ingested Network Fleet ({devices.length})
            </h2>
            <button
              onClick={() => setActiveTab('ingestion')}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
            >
              Manage Fleet <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {devices.map((d) => (
              <div key={d.id} className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-between hover:border-white/[0.2] transition-colors">
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs sm:text-sm text-white">{d.hostname}</div>
                  <div className="text-[11px] text-white/50 flex items-center gap-2 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.08] text-zinc-200 font-bold">{d.vendor}</span>
                    <span>{d.platform}</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[11px] text-emerald-400">Conf: {Math.round(d.confidence * 100)}%</span>
                  <div className="text-[10px] text-white/40 truncate max-w-[120px]">{d.source_file}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Critical Violations requiring remediation */}
        <div className="lg:col-span-7 rounded-2xl p-6 bg-[#06060a]/95 border border-white/[0.12] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display uppercase tracking-wider">
              <AlertTriangle size={16} className="text-rose-400" />
              Actionable Security Violations & Gaps
            </h2>
            <button
              onClick={() => setActiveTab('findings')}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono transition-colors"
            >
              View All Findings <ArrowRight size={12} />
            </button>
          </div>

          {topIssues.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-xs italic font-mono">
              No critical or high severity violations detected in active audit session.
            </div>
          ) : (
            <div className="space-y-3">
              {topIssues.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setActiveTab('findings')}
                  className="p-3.5 rounded-xl bg-black/60 border border-rose-500/20 hover:border-rose-500/50 transition-all cursor-pointer flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold">
                        {f.severity}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-white">
                        {f.control_code}: {f.control_name}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{f.description}</p>
                    <div className="text-[11px] font-mono text-white/40 pt-0.5">
                      Target: <span className="text-white font-semibold">{f.device_hostname}</span> ({f.device_vendor})
                    </div>
                  </div>
                  <button className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all whitespace-nowrap font-mono self-center">
                    Inspect Evidence
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* The 5 Differentiating Features Showcase (PRD DIF-01 to DIF-05) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            5 Differentiating Technical Modules (PRD DIF-01 &ndash; DIF-05)
          </h2>
          <p className="text-xs text-white/50">Integrated end-to-end architecture built according to SIH26155 specifications.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {differentiators.map((diff) => {
            const Icon = diff.icon;
            return (
              <motion.div
                key={diff.id}
                whileHover={{ y: -3 }}
                onClick={() => setActiveTab(diff.id)}
                className="rounded-2xl p-5 bg-[#06060a]/95 border border-white/[0.1] hover:border-white/[0.25] cursor-pointer group flex flex-col justify-between transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                        <Icon size={18} className={diff.color.split(' ')[1]} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.1] text-white/60">
                        {diff.tag}
                      </span>
                    </div>
                    <ArrowRight size={14} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-white" />
                  </div>
                  <h3 className="font-bold text-sm text-white mb-1.5 font-display">{diff.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{diff.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] font-semibold text-zinc-300 group-hover:text-white flex items-center gap-1 font-mono transition-colors">
                  Launch Module &rarr;
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
