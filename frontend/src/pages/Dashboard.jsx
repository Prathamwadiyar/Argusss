import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import OverviewTab from '../components/OverviewTab';
import IngestionTab from '../components/IngestionTab';
import FindingsTab from '../components/FindingsTab';
import DialectEngineTab from '../components/DialectEngineTab';
import KnowledgeRegistryTab from '../components/KnowledgeRegistryTab';
import IntentCompilerTab from '../components/IntentCompilerTab';
import EquivalenceGraphTab from '../components/EquivalenceGraphTab';
import SimulatorTab from '../components/SimulatorTab';
import SemanticDiffTab from '../components/SemanticDiffTab';
import DriftDetectionTab from '../components/DriftDetectionTab';
import ReportTab from '../components/ReportTab';
import { Lock } from 'lucide-react';
import { auditService } from '../services/api';

const Dashboard = ({ onBack, currentUser, onSignOut, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [audits, setAudits] = useState([]);
  const [activeAuditId, setActiveAuditId] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [reAuditing, setReAuditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Role calculation: admin has full governance, auditor has operational read/audit access
  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdmin = !currentUser || roleStr === 'admin' || roleStr.includes('admin') || roleStr.includes('ciso') || roleStr.includes('lead');

  const handleSwitchRole = (targetRole) => {
    const updated = {
      ...(currentUser || {
        id: targetRole === 'admin' ? 1 : 2,
        email: targetRole === 'admin' ? 'auditor@enterprise-defense.org' : 'field.auditor@enterprise-defense.org',
        org_name: 'National Defense Telecom Core'
      }),
      role: targetRole,
      full_name: targetRole === 'admin' ? 'Col. R. Sharma (CISO)' : 'Dr. A. Verma (Field Auditor)'
    };
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    if (targetRole === 'auditor' && (activeTab === 'dialect' || activeTab === 'knowledge')) {
      setActiveTab('overview');
    }
  };

  // Initial load
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const allAudits = await auditService.listAudits();
      setAudits(allAudits);

      if (allAudits.length > 0) {
        const latestId = allAudits[0].id;
        setActiveAuditId(latestId);
        await loadAuditDetails(latestId);
      } else {
        setActiveAuditId(null);
        setAuditData(null);
        setFindings([]);
      }
    } catch (err) {
      console.error('Failed to load audits', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditDetails = async (auditId) => {
    try {
      const [details, findingsList] = await Promise.all([
        auditService.getAudit(auditId),
        auditService.getAuditFindings(auditId)
      ]);
      setAuditData(details);
      setFindings(findingsList);
    } catch (err) {
      console.error('Failed to load audit details', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectAudit = async (auditId) => {
    setActiveAuditId(auditId);
    await loadAuditDetails(auditId);
  };

  const handleClearAudits = async () => {
    try {
      await auditService.clearAudits();
      setAudits([]);
      setActiveAuditId(null);
      setAuditData(null);
      setFindings([]);
      setActiveTab('overview');
    } catch (err) {
      console.error('Failed to clear audits', err);
    }
  };

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const demoRes = await auditService.loadDemoAudit();
      const allAudits = await auditService.listAudits();
      setAudits(allAudits);
      setActiveAuditId(demoRes.audit_id);
      await loadAuditDetails(demoRes.audit_id);
      setActiveTab('overview');
    } catch (err) {
      console.error('Failed to load demo audit', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleReAudit = async () => {
    if (!activeAuditId) return;
    setReAuditing(true);
    try {
      await auditService.reAudit(activeAuditId);
      await loadAuditDetails(activeAuditId);
      const allAudits = await auditService.listAudits();
      setAudits(allAudits);
    } catch (err) {
      console.error('Re-audit failed', err);
    } finally {
      setReAuditing(false);
    }
  };

  const handleAuditCreated = async (newAuditId) => {
    const allAudits = await auditService.listAudits();
    setAudits(allAudits);
    setActiveAuditId(newAuditId);
    await loadAuditDetails(newAuditId);
    setActiveTab('overview');
  };

  return (
    <div className="console-theme relative min-h-screen w-full bg-[#f8fafc] text-slate-800 font-sans flex selection:bg-emerald-600 selection:text-white">
      {/* Clean Administrative Executive Light Canvas */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#f8fafc]">
        {/* Subtle grid pattern for precision audit feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
      </div>

      {/* Collapsible Enterprise Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        complianceScore={auditData?.summary?.compliance_score || 0}
        findingsCount={findings?.length || 0}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        currentUser={currentUser}
        onSignOut={onSignOut}
        onBack={onBack}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Content Area: Responsive offset for fixed sidebar */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        
        {/* Clean Executive Status & Action Topbar */}
        <Header
          activeTab={activeTab}
          audits={audits}
          activeAuditId={activeAuditId}
          onSelectAudit={handleSelectAudit}
          onLoadDemo={handleLoadDemo}
          loadingDemo={loadingDemo}
          onClearAudits={handleClearAudits}
          complianceScore={auditData?.summary?.compliance_score || 0}
          setMobileOpen={setMobileOpen}
          isAdmin={isAdmin}
        />

        {/* Tab Canvas Content */}
        <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {loading && audits.length > 0 && !auditData ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-semibold text-slate-600 font-mono">Initializing Deterministic Compliance Engine...</div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab
                  auditData={auditData}
                  findings={findings}
                  setActiveTab={setActiveTab}
                  onReAudit={handleReAudit}
                  reAuditing={reAuditing}
                  onLoadDemo={handleLoadDemo}
                  loadingDemo={loadingDemo}
                />
              )}

              {activeTab === 'ingestion' && (
                <IngestionTab
                  auditData={auditData}
                  onAuditCreated={handleAuditCreated}
                  onLoadDemo={handleLoadDemo}
                  loadingDemo={loadingDemo}
                />
              )}

              {activeTab === 'findings' && (
                <FindingsTab
                  findings={findings}
                  devices={auditData?.devices || []}
                />
              )}

              {/* RBAC Restricted Guard for Non-Admin / Auditor */}
              {!isAdmin && (activeTab === 'dialect' || activeTab === 'knowledge') && (
                <div className="p-8 sm:p-12 rounded-2xl bg-white border border-amber-200/80 shadow-sm text-center max-w-xl mx-auto my-8 space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                    <Lock size={22} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900">
                      Security Administrator Role Required
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      The <strong className="text-slate-800">{activeTab === 'dialect' ? 'Dialect Engine' : 'Knowledge Registry'}</strong> controls sensitive ML active learning retrains and rule governance. As a <strong className="text-amber-700 font-mono">Network Auditor</strong>, your role is scoped to operational audits, telemetry, and evidence verification.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                    >
                      Return to Audit Overview
                    </button>
                    <button
                      onClick={() => handleSwitchRole('admin')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <span>Switch to Admin Mode</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'dialect' && isAdmin && (
                <DialectEngineTab
                  auditId={activeAuditId}
                  onMappingApproved={() => loadAuditDetails(activeAuditId)}
                />
              )}

              {activeTab === 'knowledge' && isAdmin && (
                <KnowledgeRegistryTab
                  onAuditFlaggedForReAudit={() => loadAuditDetails(activeAuditId)}
                />
              )}

              {activeTab === 'intent' && (
                <IntentCompilerTab
                  auditId={activeAuditId}
                />
              )}

              {activeTab === 'equivalence' && (
                <EquivalenceGraphTab
                  auditId={activeAuditId}
                />
              )}

              {activeTab === 'simulator' && (
                <SimulatorTab
                  devices={auditData?.devices || []}
                />
              )}

              {activeTab === 'diff' && (
                <SemanticDiffTab
                  devices={auditData?.devices || []}
                />
              )}

              {activeTab === 'drift' && (
                <DriftDetectionTab
                  devices={auditData?.devices || []}
                />
              )}

              {activeTab === 'reports' && (
                <ReportTab
                  auditId={activeAuditId}
                />
              )}
            </>
          )}
        </main>

        {/* Console Footer */}
        <footer className="border-t border-slate-200 px-6 py-4 bg-white/80 text-xs text-slate-500 relative z-10 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="text-slate-700 font-medium">
              Argus &middot; Multi-Vendor Network Compliance Verification Console &middot; Official Audit Workstation
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Deterministic Core</span>
              <span>&bull;</span>
              <span>Zero Cloud Leakage</span>
              <span>&bull;</span>
              <span>Offline Guaranteed</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
