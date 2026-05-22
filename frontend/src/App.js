import { useState } from 'react';
import AuthGate from './components/AuthGate';
import LearningDashboard from './components/LearningDashboard';
import { getUsername, isLoggedIn, logout } from './api/auth';
import './App.css';

function App() {
  const [authenticated, setAuthenticated] = useState(isLoggedIn());
  const [username, setUsername] = useState(getUsername() || '');

  function handleAuthenticated(user) {
    setUsername(user?.username || '');
    setAuthenticated(true);
  }

  function handleLogout() {
    logout();
    setUsername('');
    setAuthenticated(false);
  }

  if (!authenticated) {
    return <AuthGate onAuthenticated={handleAuthenticated} />;
  }

  return <LearningDashboard username={username} onLogout={handleLogout} />;
}

export default App;
