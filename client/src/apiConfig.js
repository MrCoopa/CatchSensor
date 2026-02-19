import { Capacitor } from '@capacitor/core';

// Use the user's local IP for native Android development
// For PWA/Web, leave empty to use relative paths (handled by proxy or same-origin)
const API_BASE = Capacitor.isNativePlatform()
    ? (import.meta.env.VITE_API_URL || 'https://catchsensor.home')
    : '';

export default API_BASE;
