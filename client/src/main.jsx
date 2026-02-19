import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Auto-update SW
import { Capacitor } from '@capacitor/core';

// Only register Service Worker for Web (if needed for caching), but NOT for Native App
// User requested to focus on Native App stability
if (!Capacitor.isNativePlatform()) {
  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm('Neue Version verfügbar. Neu laden?')) {
        updateSW(true)
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline')
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Extra aggressive manual registration removed to prevent conflicts with virtual:pwa-register
// if ('serviceWorker' in navigator) { ... }
