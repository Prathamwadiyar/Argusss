import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import OverviewTab from '../components/OverviewTab';
import IngestionTab from '../components/IngestionTab';
import FindingsTab from '../components/FindingsTab';
import DialectEngineTab from '../components/DialectEngineTab';
import KnowledgeRegistryTab from '../components/KnowledgeRegistryTab';
import IntentCompilerTab from '../components/IntentCompilerTab';
import EquivalenceGraphTab from '../components/EquivalenceGraphTab';
import SimulatorTab from '../components/SimulatorTab';
import SemanticDiffTab from '../components/SemanticDiffTab';
import ReportTab from '../components/ReportTab';
import { auditService } from '../services/api';

const Dashboard = ({ onBack, currentUser, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [audits, setAudits] = useState([]);
  const [activeAuditId, setActiveAuditId] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [reAuditing, setReAuditing] = useState(false);

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
        // Auto-seed demo audit if database is fresh
        await handleLoadDemo();
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
    <div className="relative min-h-screen w-full bg-[#020204] text-[#f5f5f7] font-sans flex flex-col selection:bg-white selection:text-black overflow-x-hidden">
      {/* Background from Landing Page */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <img
          src="/Background.webp"
          alt="Cyber Topology Space"
          className="w-full h-full object-cover object-[center_38%] filter brightness-95 contrast-[105%] opacity-20"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,2,4,0)_40%,rgba(2,2,4,0.7)_100%)]" />
        <div className="absolute inset-0 bg-[#020204]/80" />
      </div>

      {/* Top Atmospheric Ambient Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-white/[0.04] via-white/[0.01] to-transparent blur-[120px] rounded-full" />
      </div>

      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        audits={audits}
        activeAuditId={activeAuditId}
        onSelectAudit={handleSelectAudit}
        onLoadDemo={handleLoadDemo}
        loadingDemo={loadingDemo}
        complianceScore={auditData?.summary?.compliance_score || 0}
        onBack={onBack}
        currentUser={currentUser}
        onSignOut={onSignOut}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {loading && !auditData ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-semibold text-zinc-400 font-mono">Initializing Local Compliance Engine...</div>
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

            {activeTab === 'dialect' && (
              <DialectEngineTab
                auditId={activeAuditId}
                onMappingApproved={() => loadAuditDetails(activeAuditId)}
              />
            )}

            {activeTab === 'knowledge' && (
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

            {activeTab === 'reports' && (
              <ReportTab
                auditId={activeAuditId}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] px-6 py-4 bg-[#020204] text-xs text-white/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div>
            Argus &middot; AI-Driven Multi-Vendor Network Security Compliance Auditor &middot; Production Ready
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-white/50">
            <span>Deterministic Verification Core</span>
            <span>&bull;</span>
            <span>Zero Paid API Dependency</span>
            <span>&bull;</span>
            <span>Offline Guaranteed</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
