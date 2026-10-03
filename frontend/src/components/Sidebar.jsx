import React from 'react';
import {
  BarChart3,
  CheckCircle,
  FileText,
  Database,
  Sparkles,
  BookOpen,
  Layers,
  GitBranch,
  Play,
  RefreshCw,
  History,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  LogOut,
  Shield,
  Lock,
  X
} from 'lucide-react';

const Sidebar = ({
  activeTab,
  setActiveTab,
  complianceScore = 0,
  findingsCount = 0,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
  currentUser,
  onSignOut,
  onBack,
  onSwitchRole
}) => {
  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdmin = !currentUser || roleStr === 'admin' || roleStr.includes('admin') || roleStr.includes('ciso') || roleStr.includes('lead');

  const navGroups = [
    {
      title: 'Executive & Audit',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: BarChart3,
          badge: complianceScore ? `${complianceScore}%` : null,
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        },
        {
          id: 'findings',
          label: 'Findings & Evidence',
          icon: CheckCircle,
          badge: findingsCount > 0 ? `${findingsCount}` : null,
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
        },
        {
          id: 'reports',
          label: 'Audit Dossier',
          icon: FileText
        },
      ]
    },
    {
      title: 'Fleet & Dialects',
      items: [
        {
          id: 'ingestion',
          label: 'Fleet Ingestion',
          icon: Database
        },
        {
          id: 'dialect',
          label: 'Dialect Engine',
          icon: Sparkles,
          adminOnly: true
        },
        {
          id: 'knowledge',
          label: 'Knowledge Registry',
          icon: BookOpen,
          adminOnly: true
        },
      ]
    },
    {
      title: 'Verification Lab',
      items: [
        {
          id: 'intent',
          label: 'Intent Compiler',
          icon: Layers
        },
        {
          id: 'equivalence',
          label: 'Equivalence Graph',
          icon: GitBranch
        },
        {
          id: 'simulator',
          label: 'Counterfactual Sim',
          icon: Play
        },
        {
          id: 'diff',
          label: 'Semantic Diff',
          icon: RefreshCw
        },
        {
          id: 'drift',
          label: 'Temporal Drift',
          icon: History
        },
      ]
    }
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out select-none
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          shadow-[2px_0_12px_rgba(0,0,0,0.03)]
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="/logo-light.png"
              alt="Argus Logo"
              className={`object-contain transition-all duration-300 ${isCollapsed ? 'h-7 w-auto' : 'h-8 w-auto'}`}
            />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-[10px] font-mono tracking-widest text-emerald-600 font-bold uppercase">
                  AUDIT CONSOLE
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 no-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  {group.title}
                </div>
              ) : (
                <div className="w-full h-px bg-slate-100 my-2" />
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isRestricted = item.adminOnly && !isAdmin;

                if (isRestricted) {
                  return (
                    <div
                      key={item.id}
                      title="Restricted: Security Administrator role required for ML Active Learning & Knowledge Reversal"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 cursor-not-allowed select-none group relative"
                    >
                      <Icon size={16} className="text-slate-300 shrink-0" />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <span className="truncate text-left text-slate-400 font-medium">{item.label}</span>
                          <span className="ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                            <Lock size={9} /> ADMIN
                          </span>
                        </div>
                      )}
                      {isCollapsed && (
                        <div className="fixed left-20 ml-2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md flex items-center gap-1.5">
                          <Lock size={10} className="text-amber-400" />
                          <span>{item.label} (Admin Only)</span>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all group relative ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 font-semibold shadow-xs border border-emerald-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium border border-transparent'
                    }`}
                  >
                    {/* Active Indicator Bar on Left */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-emerald-600" />
                    )}

                    <Icon
                      size={16}
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'
                      }`}
                    />

                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate text-left">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Collapsed Pill Tooltip */}
                    {isCollapsed && (
                      <div className="fixed left-20 ml-2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                        {item.label}
                        {item.badge && <span className="ml-1.5 text-emerald-300 font-mono">({item.badge})</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom User & Footer Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2 shrink-0">
          {/* Back to Landing Page / Storytelling */}
          {onBack && (
            <button
              onClick={onBack}
              title="Return to Storytelling Landing Page"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60 transition-all font-mono ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <ArrowLeft size={14} className="shrink-0 text-slate-500" />
              {!isCollapsed && <span>Landing Manifesto</span>}
            </button>
          )}

          {/* User Profile Card with Role Badge & Role Switcher */}
          {currentUser && (
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div
                className={`flex items-center gap-2.5 ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {currentUser.photo_url ? (
                    <img
                      src={currentUser.photo_url}
                      alt={currentUser.full_name}
                      className="w-7 h-7 rounded-full border border-emerald-400 object-cover shrink-0"
                    />
                  ) : (
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                      isAdmin 
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                        : 'bg-amber-100 border-amber-300 text-amber-800'
                    }`}>
                      {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : (isAdmin ? 'A' : 'O')}
                    </div>
                  )}
                  {!isCollapsed && (
                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {currentUser.full_name || (isAdmin ? 'Col. R. Sharma' : 'Dr. A. Verma')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 truncate">
                        {currentUser.org_name || 'Enterprise'}
                      </span>
                    </div>
                  )}
                </div>

                {!isCollapsed && onSignOut && (
                  <button
                    onClick={onSignOut}
                    title="Sign Out / Switch Organization"
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                  >
                    <LogOut size={13} />
                  </button>
                )}
              </div>

              {/* Role Indicator & 1-Click Role Switcher */}
              {!isCollapsed && (
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Role:</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isAdmin 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {isAdmin ? 'Admin' : 'Auditor'}
                    </span>
                  </div>
                  {onSwitchRole && (
                    <button
                      onClick={() => onSwitchRole(isAdmin ? 'auditor' : 'admin')}
                      title={`Switch to ${isAdmin ? 'Auditor' : 'Admin'} view for evaluation`}
                      className="px-2 py-0.5 rounded text-[10px] text-slate-600 hover:text-emerald-700 hover:bg-slate-100 border border-slate-200 transition-colors font-medium cursor-pointer"
                    >
                      &rarr; Test as {isAdmin ? 'Auditor' : 'Admin'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
