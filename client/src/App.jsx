import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Setup from './components/Setup';
import Login from './components/Login';
import Register from './components/Register';
import { Home, Plus, Settings } from 'lucide-react';

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import API_BASE from './apiConfig';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login', 'register', 'dashboard', 'setup'

  // ── Global Push Notification Logic ──────────────────────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // 1. Initial permission check & registration
    const initPush = async () => {
      const result = await PushNotifications.checkPermissions();
      if (result.receive === 'granted') {
        PushNotifications.register();
      } else if (result.receive === 'prompt' || result.receive === 'default') {
        // Automatically request if not yet decided
        const requestResult = await PushNotifications.requestPermissions();
        if (requestResult.receive === 'granted') {
          PushNotifications.register();
        }
      }
    };
    initPush();

    // 2. Listeners
    const registrationListener = PushNotifications.addListener('registration', async (token) => {
      console.log('App: Push registration success, token: ' + token.value);
      const authToken = localStorage.getItem('token');
      if (authToken) {
        try {
          await fetch(`${API_BASE}/api/notifications/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ endpoint: token.value, keys: null })
          });
          console.log('App: Push token synced with backend.');
        } catch (e) {
          console.error('App: Failed to sync push token', e);
        }
      }
    });

    const errorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('App: Push registration error: ' + JSON.stringify(error));
    });

    const notificationListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('App: Push received: ' + JSON.stringify(notification));
      // You could trigger a global toast or alert here if desired
    });

    return () => {
      registrationListener.remove();
      errorListener.remove();
      notificationListener.remove();
    };
  }, []);

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
            <span className="text-[10px] font-bold uppercase tracking-widest">Melder</span>
          </button>

          <button
            onClick={() => {
              if (view !== 'dashboard') setView('dashboard');
              setTimeout(() => window.dispatchEvent(new CustomEvent('open-add-catch-sensor')), 100);
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
      </nav>
    </div>
  );
}

export default App;
