import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SplitReveal from './components/animata/SplitReveal';
import './index.css';

function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'auth' | 'dashboard'
  const [transitioning, setTransitioning] = useState(false);
  const [transitionTitle, setTransitionTitle] = useState("INITIALIZING DETERMINISTIC AUDIT CORE");
  const [transitionSubtitle, setTransitionSubtitle] = useState("Zero-Cloud Air-Gapped Network Verification Engine &middot; SIH26155");

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('argus_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed || parsed.profile_completed === false) {
        return null;
      }
      return {
        ...parsed,
        org_name: parsed.org_name || parsed.orgName || 'National Defense Telecom Core',
        role: parsed.role || 'admin',
        full_name: parsed.full_name || parsed.fullName || 'Authorized Auditor'
      };
    } catch {
      return null;
    }
  });

  const startTransition = (targetView, title, subtitle) => {
    if (title) setTransitionTitle(title);
    if (subtitle) setTransitionSubtitle(subtitle);
    setTransitioning(true);

    // Switch the underlying page at 450ms while shutters are comfortably closed
    setTimeout(() => {
      setView(targetView);
    }, 450);

    // Absolute safety watchdog: ensure full-screen overlay is never stuck on any device
    setTimeout(() => {
      setTransitioning(false);
    }, 1500);
  };

  const handleLaunch = () => {
    const isAuthed = Boolean(currentUser && currentUser.profile_completed !== false);
    const target = isAuthed ? 'dashboard' : 'auth';
    startTransition(
      target,
      isAuthed ? "SYNCHRONIZING AUDITOR WORKSTATION" : "ESTABLISHING AIR-GAPPED AUTH GATEWAY",
      "Air-Gap Sovereign Verification &middot; CIS Benchmarks &bull; NIST SP 800-53"
    );
  };

  const handleLoginSuccess = (user) => {
    if (!user) {
      console.warn("No user identity received. Access withheld.");
      return;
    }
    const safeUser = {
      ...user,
      profile_completed: true,
      org_name: user.org_name || user.orgName || 'National Defense Telecom Core',
      full_name: user.full_name || user.fullName || 'Authorized Auditor',
      phone_number: user.phone_number || user.phone || '+91 98765 43210',
      role: user.role || 'admin',
      org_type: user.org_type || 'Defense & Critical Infrastructure',
      department: user.department || 'Directorate of Cyber Security'
    };
    try {
      localStorage.setItem('argus_user', JSON.stringify(safeUser));
    } catch (e) {}
    setCurrentUser(safeUser);
    startTransition(
      'dashboard',
      "AUTHORIZING OPERATIONAL CONSOLE",
      `Session Initialized for ${safeUser.full_name} &middot; Deterministic Mode`
    );
  };

  const handleUpdateUser = (updatedUser) => {
    localStorage.setItem('argus_user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const handleSignOut = () => {
    localStorage.removeItem('argus_user');
    setCurrentUser(null);
    setView('auth');
  };

  return (
    <div className="App">
      {/* Animata Split Reveal Full-Screen Shutter Transition */}
      <SplitReveal
        active={transitioning}
        title={transitionTitle}
        subtitle={transitionSubtitle}
        onComplete={() => setTransitioning(false)}
      />

      {view === 'landing' && (
        <LandingPage onLaunch={handleLaunch} />
      )}

      {view === 'auth' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={() => setView('landing')}
        />
      )}

      {view === 'dashboard' && (
        <Dashboard
          currentUser={currentUser}
          onUpdateUser={handleUpdateUser}
          onBack={() => setView('landing')}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
export default App;