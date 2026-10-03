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
      // Security Check: Unverified or incomplete profiles cannot bypass auth
      if (parsed.profile_completed === false || (!parsed.org_name && !parsed.phone_number)) {
        localStorage.removeItem('argus_user');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const startTransition = (targetView, title, subtitle) => {
    if (title) setTransitionTitle(title);
    if (subtitle) setTransitionSubtitle(subtitle);
    setTransitioning(true);

    // Switch the underlying page at 550ms while the shutters are closed
    setTimeout(() => {
      setView(targetView);
    }, 550);
  };

  const handleLaunch = () => {
    const isAuthed = currentUser && currentUser.profile_completed !== false && currentUser.org_name;
    const target = isAuthed ? 'dashboard' : 'auth';
    startTransition(
      target,
      isAuthed ? "SYNCHRONIZING AUDITOR WORKSTATION" : "ESTABLISHING AIR-GAPPED AUTH GATEWAY",
      "Air-Gap Sovereign Verification &middot; CIS Benchmarks &bull; NIST SP 800-53"
    );
  };

  const handleLoginSuccess = (user) => {
    if (!user || user.profile_completed === false || !user.org_name) {
      console.warn("Security clearance incomplete. Access to dashboard withheld.");
      return;
    }
    setCurrentUser(user);
    startTransition(
      'dashboard',
      "AUTHORIZING OPERATIONAL CONSOLE",
      `Session Initialized for ${user.full_name || 'Auditor'} &middot; Deterministic Mode`
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