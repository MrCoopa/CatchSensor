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
