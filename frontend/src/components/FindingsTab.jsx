import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Code,
  Shield,
  ChevronDown,
  ChevronUp,
  FileText,
  Server
} from 'lucide-react';

const FindingsTab = ({ findings = [], devices = [] }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [deviceFilter, setDeviceFilter] = useState('ALL');
  const [frameworkFilter, setFrameworkFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const filteredFindings = findings.filter((f) => {
    const matchSearch =
      search === '' ||
      f.control_code.toLowerCase().includes(search.toLowerCase()) ||
      f.control_name.toLowerCase().includes(search.toLowerCase()) ||
      f.property_id.toLowerCase().includes(search.toLowerCase()) ||
      (f.device_hostname && f.device_hostname.toLowerCase().includes(search.toLowerCase())) ||
      f.standard_refs?.some(r => r.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const matchSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchDevice = deviceFilter === 'ALL' || String(f.device_id) === deviceFilter;

    const matchFramework =
      frameworkFilter === 'ALL' ||
      f.standard_refs?.some((ref) => {
        const rLower = ref.toLowerCase();
        if (frameworkFilter === 'CIS') return rLower.includes('cis');
        if (frameworkFilter === 'NIST') return rLower.includes('nist');
        if (frameworkFilter === 'DISA') return rLower.includes('disa') || rLower.includes('stig');
        if (frameworkFilter === 'ISO') return rLower.includes('iso');
        if (frameworkFilter === 'NCIIPC') return rLower.includes('nciipc');
        return true;
      });

    return matchSearch && matchStatus && matchSeverity && matchDevice && matchFramework;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 size={12} /> PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
            <XCircle size={12} /> FAIL
          </span>
        );
      case 'INCONCLUSIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <AlertTriangle size={12} /> INCONCLUSIVE
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 text-white">{status}</span>;
    }
  };

  const getSeverityBadge = (sev) => {
    const color =
      sev === 'CRITICAL' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
      sev === 'HIGH' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' :
      sev === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
      'text-blue-400 bg-blue-500/10 border-blue-500/30';

    return <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${color}`}>{sev}</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn text-[#f5f5f7]">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 bg-[#06060a]/95 backdrop-blur-2xl border border-white/[0.12] space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-white/[0.04] text-cyan-400 border border-white/[0.08]">
                <Shield size={18} />
              </span>
              <h2 className="text-xl font-bold text-white font-display">
                Findings & Evidence Registry
              </h2>
            </div>
            <p className="text-xs text-white/60 max-w-3xl leading-relaxed">
              Deterministic rules are the compliance source of truth. Every finding is backed by exact line-level configuration citations,
              observed versus expected canonical states, confidence metrics, and cross-references to CIS Benchmarks, NIST SP 800-53, DISA STIGs, ISO/IEC 27001, and NCIIPC.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-emerald-400 font-semibold">
              Deterministic Rules Authoritative
            </span>
          </div>
        </div>

        {/* Framework Filter Buttons */}
        <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 mr-1">
            Filter by Framework:
          </span>
          {[
            { id: 'ALL', label: 'All Frameworks' },
            { id: 'CIS', label: 'CIS Benchmarks' },
            { id: 'NIST', label: 'NIST SP 800-53' },
            { id: 'DISA', label: 'DISA STIGs' },
            { id: 'ISO', label: 'ISO/IEC 27001' },
            { id: 'NCIIPC', label: 'NCIIPC Guidance' },
          ].map((fw) => (
            <button
              key={fw.id}
              onClick={() => setFrameworkFilter(fw.id)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                frameworkFilter === fw.id
                  ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-white/70'
              }`}
            >
              {fw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl p-5 bg-[#06060a]/95 border border-white/[0.12] space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search controls (MGMT-01, AUTH-01), properties, rules, or hostnames..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/80 border border-white/[0.12] text-xs text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none font-mono"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex rounded-lg bg-black/80 p-1 border border-white/[0.08] text-xs">
              {['ALL', 'PASS', 'FAIL', 'INCONCLUSIVE'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md font-mono text-[11px] font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-white text-black shadow-sm font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-black/80 border border-white/[0.12] text-xs text-white/80 font-mono focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Device Filter */}
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-black/80 border border-white/[0.12] text-xs text-white/80 font-mono focus:outline-none"
            >
              <option value="ALL">All Ingested Devices</option>
              {devices.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.hostname} ({d.vendor})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-white/40 pt-2 border-t border-white/[0.08]">
          <div>
            Showing <strong className="text-white">{filteredFindings.length}</strong> of{' '}
            <strong className="text-white">{findings.length}</strong> total compliance findings
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-semibold">
              {findings.filter((f) => f.status === 'PASS').length} Passed
            </span>
            <span>&bull;</span>
            <span className="text-rose-400 font-semibold">
              {findings.filter((f) => f.status === 'FAIL').length} Failed
            </span>
            <span>&bull;</span>
            <span className="text-amber-400 font-semibold">
              {findings.filter((f) => f.status === 'INCONCLUSIVE').length} Inconclusive
            </span>
          </div>
        </div>
      </div>

      {/* Findings Cards List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="rounded-2xl p-12 text-center text-white/40 text-xs italic font-mono bg-[#06060a]/95 border border-white/[0.08]">
            No compliance findings match your current filter query.
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isExpanded = expandedId === finding.id;
            const ev = finding.evidence || {};
            const borderCol =
              finding.status === 'PASS'
                ? 'border-l-emerald-400'
                : finding.status === 'FAIL'
                ? 'border-l-rose-500'
                : 'border-l-amber-400';

            return (
              <div
                key={finding.id}
                className={`rounded-2xl bg-[#06060a]/95 border border-white/[0.1] border-l-4 ${borderCol} p-4 sm:p-5 transition-all shadow-lg hover:border-white/[0.2]`}
              >
                {/* Finding Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {getStatusBadge(finding.status)}
                      {getSeverityBadge(finding.severity)}
                      <span className="font-extrabold text-sm text-white font-display">
                        {finding.control_code}: {finding.control_name}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-white/50 font-mono">
                      <span>
                        Target: <strong className="text-white">{finding.device_hostname}</strong> ({finding.device_vendor})
                      </span>
                      <span>&bull;</span>
                      <span>
                        Property: <code className="text-cyan-400">{finding.property_id}</code>
                      </span>
                      <span>&bull;</span>
                      <span className="text-emerald-400">
                        Confidence: {(finding.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Mapped Frameworks Badges */}
                    {finding.standard_refs?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {finding.standard_refs.map((ref, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-cyan-300/80"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-white/50 justify-end self-start md:self-center">
                    <span className="font-mono text-[11px] hidden sm:inline">
                      {isExpanded ? 'Hide Evidence' : 'Inspect Evidence'}
                    </span>
                    <button className="p-1 rounded-md bg-white/[0.06] text-white/70 hover:text-white">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expandable Line-by-Line Evidence Inspector */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/[0.08] space-y-4 overflow-hidden text-xs"
                    >
                      {/* Control Description */}
                      <div>
                        <span className="text-white/40 font-mono uppercase tracking-wider text-[10px] block mb-1">
                          Control Description:
                        </span>
                        <p className="text-white/80 text-xs leading-relaxed">{finding.description}</p>
                      </div>

                      {/* State Comparison: Expected vs Observed */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08]">
                          <span className="text-[10px] uppercase text-white/40 font-mono font-semibold block">
                            Expected Canonical State:
                          </span>
                          <div className="font-mono text-emerald-400 font-bold mt-1 text-xs sm:text-sm">
                            {finding.expected_state}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08]">
                          <span className="text-[10px] uppercase text-white/40 font-mono font-semibold block">
                            Observed Canonical State:
                          </span>
                          <div className={`font-mono font-bold mt-1 text-xs sm:text-sm ${
                            finding.status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {finding.actual_state}
                          </div>
                        </div>
                      </div>

                      {/* Exact Code Line Evidence Box */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-white/50 font-mono mb-1.5">
                          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                            <Code size={13} />
                            Exact File Line Evidence Reference
                          </span>
                          <span>
                            Origin: <strong className="text-white">{ev.source || 'DETERMINISTIC'}</strong> &bull; Line {ev.line_start || 1}-{ev.line_end || 1}
                          </span>
                        </div>
                        <div className="bg-black/90 rounded-xl p-3.5 font-mono text-xs text-white/90 border border-white/[0.1] flex items-start gap-4">
                          <span className="text-white/30 select-none text-right font-bold w-6">
                            {ev.line_start || 1}
                          </span>
                          <span className={finding.status === 'PASS' ? 'text-emerald-300' : 'text-rose-300'}>
                            {ev.text || '// No explicit configuration syntax match detected in uploaded file'}
                          </span>
                        </div>
                      </div>

                      {/* Remediation Guidance */}
                      {finding.remediation && (
                        <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs space-y-1">
                          <span className="font-bold text-cyan-400 flex items-center gap-1.5 font-mono">
                            <Shield size={13} /> Recommended Vendor Remediation:
                          </span>
                          <p className="text-white/80 font-mono text-[11px] leading-relaxed">
                            {finding.remediation}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FindingsTab;
