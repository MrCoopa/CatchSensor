import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Auto-update SW
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Neue Version verfügbar. Neu laden?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ist bereit für Offline-Nutzung.')
  },
  onRegisterError(error) {
    console.error('SW Error:', error);
    window.swError = error;
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Extra aggressive manual registration for mobile (Dev Mode Fix)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
    navigator.serviceWorker.register(swPath, { scope: '/', type: 'module' })
      .then(reg => console.log('SW manual register success:', reg))
      .catch(err => {
        console.error('SW manual register fail:', err);
        window.swError = err;
      });
  });
}
