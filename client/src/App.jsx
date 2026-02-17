import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Setup from './components/Setup';
import Login from './components/Login';
import Register from './components/Register';
import { Home, Plus, Settings } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login', 'register', 'dashboard', 'setup'

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    if (token && email) {
      setUser({ token, email });
      setView('dashboard');
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setUser(null);
    setView('login');
  };

  if (view === 'login') return <Login onLogin={handleLogin} onSwitchToRegister={() => setView('register')} />;
  if (view === 'register') return <Register onRegister={handleRegister} onSwitchToLogin={() => setView('login')} />;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <main className="flex-1 overflow-y-auto">
        {view === 'dashboard' ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <Setup onLogout={handleLogout} />
        )}
      </main>

      {/* Bottom Navigation matching template */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-40">
        <div className="max-w-2xl mx-auto flex justify-between items-center text-gray-400">
          <button
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center space-y-1 transition-colors ${view === 'dashboard' ? 'text-green-700' : 'hover:text-green-700'}`}
          >
            <Home size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Fallen</span>
          </button>

          <button
            onClick={() => {
              if (view !== 'dashboard') setView('dashboard');
              setTimeout(() => window.dispatchEvent(new CustomEvent('open-add-trap')), 100);
            }}
            className="flex flex-col items-center space-y-1 hover:text-green-700 transition-colors"
          >
            <Plus size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Neu</span>
          </button>

          <button
            onClick={() => setView('setup')}
            className={`flex flex-col items-center space-y-1 transition-colors ${view === 'setup' ? 'text-green-700' : 'hover:text-green-700'}`}
          >
            <Settings size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Setup</span>
          </button>
        </div>
        );
}

        export default App;
