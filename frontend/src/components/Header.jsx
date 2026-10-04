import React from 'react';
import {
  Menu,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Trash2,
  Upload
} from 'lucide-react';

const TAB_METADATA = {
  overview: { section: 'Executive & Audit', title: 'Audit Overview', desc: 'Real-time multi-vendor compliance posture' },
  findings: { section: 'Executive & Audit', title: 'Findings & Evidence', desc: 'Deterministic violation proofs & citations' },
  reports: { section: 'Executive & Audit', title: 'Formal Audit Dossier', desc: 'Printable cryptographic compliance report' },
  ingestion: { section: 'Fleet & Dialects', title: 'Fleet Ingestion', desc: 'Multi-vendor configs parsing & SHA-256 checksums' },
  dialect: { section: 'Fleet & Dialects', title: 'Dialect Engine', desc: 'AST normalization across Cisco, Juniper, and Fortinet' },
  knowledge: { section: 'Fleet & Dialects', title: 'Knowledge Registry', desc: 'Verified vendor syntax grammar & rule registry' },
  intent: { section: 'Verification Lab', title: 'Intent Compiler', desc: 'High-level RFC intent to formal logic constraints' },
  equivalence: { section: 'Verification Lab', title: 'Equivalence Graph', desc: 'Cross-vendor AST bipartite semantic matching' },
  simulator: { section: 'Verification Lab', title: 'Counterfactual Simulator', desc: 'SMT-driven counterfactual what-if verification' },
  diff: { section: 'Verification Lab', title: 'Semantic Diff', desc: 'Behavioral policy diffing beyond syntactic text lines' },
};

const Header = ({
  activeTab = 'overview',
  audits = [],
  activeAuditId,
  onSelectAudit,
  onLoadDemo,
  loadingDemo,
  onClearAudits,
  complianceScore = 0,
  setMobileOpen,
  isAdmin = true,
}) => {
  const currentTab = TAB_METADATA[activeTab] || {
    section: 'Console',
    title: 'Audit Console',
    desc: 'Deterministic Compliance Verification'
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all px-4 sm:px-8 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* Left Side: Mobile Menu + Breadcrumb & Current Tab Scope */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Open Navigation Menu"
          >
            <Menu size={18} />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              <span>{currentTab.section}</span>
              <ChevronRight size={11} className="text-slate-400" />
              <span className="text-emerald-700 font-semibold">{currentTab.title}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                {currentTab.title}
              </h1>
              <span className="hidden xl:inline-block text-xs text-slate-400 font-normal">
                &mdash; {currentTab.desc}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Deterministic Engine Status + Audit Selector + 1-Click Audit */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 justify-end">
          
          {/* OFFLINE DETERMINISTIC CORE indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-800 font-semibold shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>OFFLINE DETERMINISTIC CORE</span>
          </div>

          {/* Active Role Chip */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase shadow-xs ${
            isAdmin
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>ROLE: {isAdmin ? 'ADMIN' : 'AUDITOR'}</span>
          </div>

          {/* Compliance Score Chip */}
          {complianceScore > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>{complianceScore}%</span>
            </div>
          )}

          {/* Audit Selector Dropdown */}
          {audits.length > 0 && (
            <select
              value={activeAuditId || ''}
              onChange={(e) => onSelectAudit(Number(e.target.value))}
              className="text-xs px-2.5 sm:px-3 py-1.5 font-mono text-slate-800 bg-white border border-slate-300 rounded-lg shadow-xs hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[140px] sm:max-w-xs truncate cursor-pointer"
            >
              {audits.map((a) => (
                <option key={a.id} value={a.id} className="bg-white text-slate-900 truncate">
                  Audit #{a.id} &mdash; {a.title} ({a.input_hash ? a.input_hash.slice(0, 8) : ''})
                </option>
              ))}
            </select>
          )}

          {/* Clear / Reset Action */}
          {audits.length > 0 && onClearAudits && (
            <button
              onClick={onClearAudits}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Clear all stored audits to perform a fresh live real-time ingestion"
            >
              <Trash2 size={13} />
              <span className="hidden xs:inline">Clear / Reset</span>
              <span className="xs:hidden">Reset</span>
            </button>
          )}

          {/* Run Live Audit Action */}
          <button
            onClick={onLoadDemo}
            disabled={loadingDemo}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {loadingDemo ? (
              <>
                <RefreshCw size={13} className="animate-spin text-white shrink-0" />
                <span className="truncate">Auditing...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-white shrink-0" />
                <span className="hidden sm:inline">Run Live Audit on Sample Fleet</span>
                <span className="sm:hidden">Run Live Audit</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};

export default Header;
