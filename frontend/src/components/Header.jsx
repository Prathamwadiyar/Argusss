import React from 'react';
import { Shield, Play, RefreshCw, FileText, CheckCircle, Database, Layers, Sparkles, ArrowLeft, LogOut } from 'lucide-react';

const Header = ({
  activeTab,
  setActiveTab,
  audits = [],
  activeAuditId,
  onSelectAudit,
  onLoadDemo,
  loadingDemo,
  complianceScore,
  onBack,
  currentUser,
  onSignOut
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'ingestion', label: 'Fleet Ingestion', icon: Database },
    { id: 'findings', label: 'Findings & Evidence', icon: CheckCircle },
    { id: 'dialect', label: 'Dialect Engine', icon: Sparkles },
    { id: 'knowledge', label: 'Knowledge Registry', icon: Database },
    { id: 'intent', label: 'Intent Compiler', icon: FileText },
    { id: 'equivalence', label: 'Equivalence Graph', icon: Layers },
    { id: 'simulator', label: 'Counterfactual Sim', icon: Play },
    { id: 'diff', label: 'Semantic Diff', icon: RefreshCw },
    { id: 'reports', label: 'Audit Report', icon: FileText },
  ];

  return (
    <header className="relative z-50 w-full border-b border-white/[0.08] bg-black/40 backdrop-blur-xl sticky top-0 transition-all px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Identity */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              title="Return to Storytelling Landing Page"
              className="p-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Manifesto</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Argus Logo"
              className="h-9 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]"
            />
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span>OFFLINE CORE</span>
            </div>
          </div>
        </div>

        {/* Global Actions: Audit Selector + 1-Click Demo */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {audits.length > 0 && (
            <select
              value={activeAuditId || ''}
              onChange={(e) => onSelectAudit(Number(e.target.value))}
              className="minimal-input text-xs px-3 py-1.5 font-mono text-white/80 bg-black/60 border-white/[0.12]"
            >
              {audits.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#0e0e14] text-white">
                  Audit #{a.id} &mdash; {a.title} ({a.input_hash})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onLoadDemo}
            disabled={loadingDemo}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-emerald-400 hover:text-black shadow-[0_0_20px_rgba(52,211,153,0.2)] transition-all disabled:opacity-50"
          >
            {loadingDemo ? (
              <>
                <RefreshCw size={13} className="animate-spin text-emerald-600" />
                <span>Auditing Fleet...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-emerald-600" />
                <span>1-Click Multi-Vendor Demo</span>
              </>
            )}
          </button>

          {/* Logged In Organization Profile & Sign Out */}
          {currentUser && (
            <div className="flex items-center gap-2.5 pl-3 border-l border-white/[0.12]">
              {currentUser.photo_url ? (
                <img
                  src={currentUser.photo_url}
                  alt={currentUser.full_name}
                  className="w-7 h-7 rounded-full border border-emerald-400/60 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs">
                  {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-white truncate max-w-[130px] leading-tight">
                  {currentUser.full_name || 'Auditor'}
                </span>
                <span className="text-[9px] font-mono text-emerald-400/80 truncate max-w-[130px]">
                  {currentUser.org_name || 'Enterprise'}
                </span>
              </div>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  title="Sign Out / Switch Organization"
                  className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-rose-400 transition-colors"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs Segmented Rail */}
      <div className="max-w-7xl mx-auto mt-3 relative">
        {/* Subtle Right Edge Fade for small screens / horizontal overflow */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#06060a]/90 to-transparent pointer-events-none z-10 rounded-r-xl" />

        {/* Tab Rail Track */}
        <div className="bg-[#09090d]/90 border border-white/[0.08] rounded-xl p-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={(e) => {
                  setActiveTab(tab.id);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] font-medium'
                }`}
              >
                <Icon
                  size={13}
                  className={`transition-colors shrink-0 ${
                    isActive ? 'text-emerald-600' : 'text-zinc-500 group-hover:text-emerald-400'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Header;
