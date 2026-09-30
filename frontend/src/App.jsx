import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'auth' | 'dashboard'
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('argus_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLaunch = () => {
    if (currentUser) {
      setView('dashboard');
    } else {
      setView('auth');
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setView('dashboard');
  };

  const handleSignOut = () => {
    localStorage.removeItem('argus_user');
    setCurrentUser(null);
    setView('auth');
  };

  return (
    <div className="App">
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
          onBack={() => setView('landing')}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}

export default App;
