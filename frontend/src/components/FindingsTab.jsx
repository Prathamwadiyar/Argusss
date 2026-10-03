import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Code,
  Shield,
  ChevronDown,
  ChevronUp
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
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-600" /> PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
            <XCircle size={12} className="text-rose-600" /> FAIL
          </span>
        );
      case 'INCONCLUSIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-amber-600" /> INCONCLUSIVE
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const getSeverityBadge = (sev) => {
    const color =
      sev === 'CRITICAL' ? 'text-rose-800 bg-rose-50 border-rose-200' :
      sev === 'HIGH' ? 'text-orange-800 bg-orange-50 border-orange-200' :
      sev === 'MEDIUM' ? 'text-amber-800 bg-amber-50 border-amber-200' :
      'text-blue-800 bg-blue-50 border-blue-200';

    return <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${color}`}>{sev}</span>;
  };

  return (
    <div className="space-y-5 animate-fadeIn text-slate-800">
      {/* Header Banner */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Shield size={16} />
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Findings & Evidence Registry
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Deterministic verification source of truth. Every finding links to exact configuration line citations,
              observed versus expected states, confidence scores, and cross-references to CIS, NIST, DISA, ISO, and NCIIPC.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              Deterministic Verification Active
            </span>
          </div>
        </div>

        {/* Framework Filter Buttons */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mr-1">
            Framework:
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
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                frameworkFilter === fw.id
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {fw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search controls (MGMT-01, AUTH-01), rules, or hostnames..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-500 focus:outline-none font-mono"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
              {['ALL', 'PASS', 'FAIL', 'INCONCLUSIVE'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
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
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none shadow-xs"
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
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none shadow-xs"
            >
              <option value="ALL">All Devices</option>
              {devices.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.hostname} ({d.vendor})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-900">{filteredFindings.length}</strong> of{' '}
            <strong className="text-slate-900">{findings.length}</strong> total compliance findings
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-700 font-semibold">
              {findings.filter((f) => f.status === 'PASS').length} Passed
            </span>
            <span>&bull;</span>
            <span className="text-rose-700 font-semibold">
              {findings.filter((f) => f.status === 'FAIL').length} Failed
            </span>
            <span>&bull;</span>
            <span className="text-amber-700 font-semibold">
              {findings.filter((f) => f.status === 'INCONCLUSIVE').length} Inconclusive
            </span>
          </div>
        </div>
      </div>

      {/* Findings Cards List */}
      <div className="space-y-2.5">
        {filteredFindings.length === 0 ? (
          <div className="rounded-xl p-10 text-center text-slate-400 text-xs italic font-mono bg-white border border-slate-200">
            No compliance findings match your current filter query.
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isExpanded = expandedId === finding.id;
            const ev = finding.evidence || {};
            const borderCol =
              finding.status === 'PASS'
                ? 'border-l-emerald-500'
                : finding.status === 'FAIL'
                ? 'border-l-rose-500'
                : 'border-l-amber-500';

            return (
              <div
                key={finding.id}
                className={`rounded-xl bg-white border border-slate-200 border-l-4 ${borderCol} p-4 sm:p-5 transition-all shadow-xs hover:border-slate-300`}
              >
                {/* Finding Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(finding.status)}
                      {getSeverityBadge(finding.severity)}
                      <span className="font-bold text-sm text-slate-900">
                        {finding.control_code}: {finding.control_name}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 font-mono">
                      <span>
                        Target: <strong className="text-slate-800">{finding.device_hostname}</strong> ({finding.device_vendor})
                      </span>
                      <span>&bull;</span>
                      <span>
                        Property: <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-semibold">{finding.property_id}</code>
                      </span>
                      <span>&bull;</span>
                      <span className="text-emerald-700 font-medium">
                        Confidence: {(finding.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Mapped Frameworks Badges */}
                    {finding.standard_refs?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {finding.standard_refs.map((ref, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-700"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 justify-end self-start md:self-center">
                    <span className="font-mono text-[11px] hidden sm:inline">
                      {isExpanded ? 'Hide Evidence' : 'Inspect Evidence'}
                    </span>
                    <button className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
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
                      className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-3 overflow-hidden text-xs"
                    >
                      {/* Control Description */}
                      <div>
                        <span className="text-slate-400 font-mono uppercase tracking-wider text-[10px] block mb-0.5">
                          Control Description:
                        </span>
                        <p className="text-slate-700 text-xs leading-relaxed">{finding.description}</p>
                      </div>

                      {/* State Comparison: Expected vs Observed */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] uppercase text-slate-500 font-mono font-semibold block">
                            Expected Canonical State:
                          </span>
                          <div className="font-mono text-emerald-700 font-bold mt-0.5 text-xs">
                            {finding.expected_state}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] uppercase text-slate-500 font-mono font-semibold block">
                            Observed Canonical State:
                          </span>
                          <div className={`font-mono font-bold mt-0.5 text-xs ${
                            finding.status === 'PASS' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {finding.actual_state}
                          </div>
                        </div>
                      </div>

                      {/* Exact Code Line Evidence Box */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-1">
                          <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                            <Code size={13} className="text-slate-600" />
                            Configuration File Citation
                          </span>
                          <span>
                            Origin: <strong className="text-slate-800">{ev.source || 'DETERMINISTIC'}</strong> &bull; Line {ev.line_start || 1}-{ev.line_end || 1}
                          </span>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-100 flex items-start gap-3">
                          <span className="text-slate-500 select-none text-right font-bold w-6">
                            {ev.line_start || 1}
                          </span>
                          <span className={finding.status === 'PASS' ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>
                            {ev.text || '// No explicit configuration syntax match detected in uploaded file'}
                          </span>
                        </div>
                      </div>

                      {/* Remediation Guidance */}
                      {finding.remediation && (
                        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs space-y-0.5">
                          <span className="font-bold text-blue-900 flex items-center gap-1.5 font-mono text-[11px]">
                            <Shield size={13} /> Recommended Vendor Remediation:
                          </span>
                          <p className="text-blue-950 font-mono text-[11px] leading-relaxed">
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
