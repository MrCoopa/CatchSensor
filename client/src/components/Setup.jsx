import React, { useState, useEffect } from 'react';
import { User, Shield, Info, Trash2, LogOut, ChevronRight, Settings, X } from 'lucide-react';

const Setup = ({ onLogout }) => {
    const [traps, setTraps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
    const [swStatus, setSwStatus] = useState('Prüfe...');
    const [notifPermission, setNotifPermission] = useState('default');
    const [swLogs, setSwLogs] = useState([]);
    const [showDebug, setShowDebug] = useState(false);
    const [selectedTrap, setSelectedTrap] = useState(null);
    const [shareEmail, setShareEmail] = useState('');
    const [trapShares, setTrapShares] = useState([]);
    const [loadingShares, setLoadingShares] = useState(false);



    useEffect(() => {
        const checkSW = async () => {
            if ('Notification' in window) {
                setNotifPermission(Notification.permission);
            }
            if ('serviceWorker' in navigator) {
                try {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    let statusParts = [`Regs: ${regs.length}`];

                    if (regs.length > 0) {
                        const reg = regs[0];
                        if (reg.installing) statusParts.push('⏳ Installiere...');
                        if (reg.waiting) statusParts.push('💤 Wartet...');
                        if (reg.active) statusParts.push('✅ Aktiv');
                    }

                    if (window.swError) {
                        setSwStatus(`Fehler: ${window.swError.message}`);
                    } else if (navigator.serviceWorker.controller) {
                        setSwStatus(`Bereit ✅ (${statusParts.join(', ')})`);
                    } else {
                        setSwStatus(`Inaktiv ⚠️ (${statusParts.join(', ')})`);
                    }
                } catch (err) {
                    setSwStatus(`System-Fehler: ${err.message}`);
                }
            } else {
                setSwStatus('Nicht unterstützt ❌');
            }
        };


        const timer = setTimeout(checkSW, 1000);
        const interval = setInterval(checkSW, 3000); // Keep polling status

        // Listen for SW debug logs
        // Listen for SW debug logs
        const handleSWMessage = (event) => {
            if (event.data && event.data.type === 'SW_DEBUG_LOG') {
                setSwLogs(prev => [`[${new Date().toLocaleTimeString()}] ${event.data.message}`, ...prev].slice(0, 10));
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleSWMessage);
        }

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleSWMessage);
            }
        };
    }, []);


    const handleManualRegister = async () => {
        if (!('serviceWorker' in navigator)) {
            setStatusMessage({ text: 'Browser unterstützt keine Service Worker.', type: 'error' });
            return;
        }

        // Use dev-sw.js with the query param for Vite PWA dev mode
        const swPath = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';

        setStatusMessage({ text: `Starte SW (${swPath})...`, type: '' });
        try {
            const reg = await navigator.serviceWorker.register(swPath, { scope: '/', type: 'module' });
            setStatusMessage({ text: 'Registrierung gesendet! Bitte Seite neu laden.', type: 'success' });
            console.log('Manual SW Registration successful:', reg);
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            console.error('Manual SW Reg Error:', err);
            setStatusMessage({ text: `Fehler: ${err.message}`, type: 'error' });
        }
    };

    const handleLocalTest = async () => {
        if (!navigator.serviceWorker.controller) {
            setStatusMessage({ text: 'Service Worker nicht aktiv oder Seite nicht "controlled".', type: 'error' });
            return;
        }
        if (Notification.permission !== 'granted') {
            setStatusMessage({ text: `Hinweis: Berechtigung ist "${Notification.permission}". Bitte erlauben.`, type: 'error' });
        }
        setStatusMessage({ text: 'Sende lokalen Test-Befehl...', type: '' });
        navigator.serviceWorker.controller.postMessage({ type: 'LOCAL_TEST' });
        setTimeout(() => setStatusMessage({ text: 'Befehl gesendet. Prüfung am Handy!', type: 'success' }), 1000);
    };

    const handleMainThreadTest = async () => {
        if (!('serviceWorker' in navigator)) {
            setStatusMessage({ text: 'Service Worker nicht unterstützt.', type: 'error' });
            return;
        }
        if (Notification.permission !== 'granted') {
            setStatusMessage({ text: 'Keine Berechtigung! Bitte erst anfordern.', type: 'error' });
            return;
        }
        setStatusMessage({ text: 'Sende System-Test...', type: '' });
        try {
            const reg = await navigator.serviceWorker.ready;
            console.log('Main thread testing with registration:', reg);

            await reg.showNotification('System-Test Erfolg! 🦊', {
                body: 'Diese Nachricht kommt direkt über den Service Worker Registrierung.',
                icon: '/icons/fox-logo.png',
                vibrate: [100, 50, 100],
                badge: '/icons/fox-logo.png',
                tag: 'test-notif-' + Date.now()
            });

            setStatusMessage({ text: 'Test-Befehl an System gesendet! ✅', type: 'success' });
            console.log('reg.showNotification called successfully');
        } catch (err) {
            console.error('Main thread showNotification error:', err);
            setStatusMessage({ text: `Fehler: ${err.message}`, type: 'error' });
        }
    };


    const handleRequestPermission = async () => {
        if (!('Notification' in window)) {
            setStatusMessage({ text: 'Browser unterstützt keine Benachrichtigungen.', type: 'error' });
            return;
        }
        setStatusMessage({ text: 'Fordere Berechtigung an...', type: '' });
        try {
            const permission = await Notification.requestPermission();
            setNotifPermission(permission);
            if (permission === 'granted') {
                setStatusMessage({ text: 'Berechtigung erteilt! 🎉', type: 'success' });
            } else {
                setStatusMessage({ text: `Abgelehnt (${permission}). Bitte in Browsereinstellungen ändern.`, type: 'error' });
            }
        } catch (err) {
            setStatusMessage({ text: `Fehler: ${err.message}`, type: 'error' });
        }
    };

    const handleForceCleanup = async () => {
        if (!confirm('Dies löscht alle Service Worker und setzt die Push-Verbindung zurück. Fortfahren?')) return;
        setStatusMessage({ text: 'Bereinige Service Worker...', type: '' });
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (let reg of regs) {
                await reg.unregister();
            }
            setStatusMessage({ text: 'Bereinigt! Bitte Seite mit Strg+F5 neu laden.', type: 'success' });
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            setStatusMessage({ text: `Fehler: ${err.message}`, type: 'error' });
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const baseUrl = '';

            // Parallel fetch for user profile and traps list
            const [userRes, trapsRes] = await Promise.all([
                fetch(`${baseUrl}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${baseUrl}/api/traps`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (userRes.status === 401 || trapsRes.status === 401) {
                onLogout();
                return;
            }

            if (userRes.ok) setCurrentUser(await userRes.json());
            if (trapsRes.ok) setTraps(await trapsRes.json());

        } catch (error) {
            console.error('Fehler beim Abrufen der Daten:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteTrap = async (id, name, event) => {
        event.stopPropagation(); // Prevent opening detail modal
        if (window.confirm(`Möchten Sie den TrapSensor "${name}" wirklich löschen?`)) {
            try {
                const token = localStorage.getItem('token');
                const baseUrl = '';
                const response = await fetch(`${baseUrl}/api/traps/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    setTraps(traps.filter(t => t.id !== id));
                    if (selectedTrap && selectedTrap.id === id) setSelectedTrap(null);
                } else {
                    const errorData = await response.json();
                    console.error('Löschen fehlgeschlagen:', response.status, errorData);
                    alert(`Fehler beim Löschen: ${errorData.error || 'Serverfehler'}`);
                }
            } catch (error) {
                console.error('Fehler beim Löschen:', error);
            }
        }
    };

    const handleShareTrap = async (e) => {
        e.preventDefault();
        if (!shareEmail) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/traps/${selectedTrap.id}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: shareEmail })
            });

            const data = await response.json();

            if (response.ok) {
                setShareEmail('');
                alert('TrapSensor erfolgreich geteilt!');
                fetchShares(selectedTrap.id);
            } else {
                alert(`Fehler: ${data.error}`);
            }
        } catch (error) {
            console.error('Share error:', error);
            alert('Verbindungsfehler beim Teilen.');
        }
    };

    const handleUnshareTrap = async (userId) => {
        if (!confirm('Zugriff für diesen Nutzer wirklich entfernen?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/traps/${selectedTrap.id}/share/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchShares(selectedTrap.id);
            } else {
                alert('Fehler beim Entfernen der Freigabe.');
            }
        } catch (error) {
            console.error('Unshare error:', error);
        }
    };

    const fetchShares = async (trapId) => {
        setLoadingShares(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/traps/${trapId}/shares`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setTrapShares(await response.json());
            } else {
                // If 403, maybe not owner, but that's handled by backend.
                // If just shared with me permission, I cannot see other shares usually, or depends on logic.
                // If I am just a viewer, backend returns 403 for /shares.
                setTrapShares([]);
            }
        } catch (error) {
            console.error('Fetch shares error:', error);
            setTrapShares([]);
        } finally {
            setLoadingShares(false);
        }
    };

    const openTrapDetail = (trap) => {
        setSelectedTrap(trap);
        // Only fetch shares if I am the owner (userId matches). Determine simple check or try fetch.
        // If query fails (403), we know we are not owner.
        // We can check currentUser.id === trap.userId if available.
        if (currentUser && trap.userId === currentUser.id) {
            fetchShares(trap.id);
        } else {
            setTrapShares([]);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setStatusMessage({ text: '', type: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setStatusMessage({ text: 'Passwörter stimmen nicht überein.', type: 'error' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setStatusMessage({ text: 'Das Passwort muss mindestens 6 Zeichen lang sein.', type: 'error' });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const baseUrl = '';
            const response = await fetch(`${baseUrl}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatusMessage({ text: 'Passwort erfolgreich geändert!', type: 'success' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => {
                    setIsChangingPassword(false);
                    setStatusMessage({ text: '', type: '' });
                }, 2000);
            } else {
                setStatusMessage({ text: data.message || 'Fehler beim Ändern des Passworts.', type: 'error' });
            }
        } catch (error) {
            console.error('Password change error:', error);
            setStatusMessage({ text: 'Verbindungsfehler zum Server. Prüfen Sie die Internetverbindung.', type: 'error' });
        }
    };

    const [pushEnabled, setPushEnabled] = useState(false);

    // URLBase64 to Uint8Array converter for VAPID
    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const checkPushSubscription = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                setPushEnabled(true);
            }
        }
    };

    const togglePush = async () => {
        if (!('serviceWorker' in navigator)) {
            setStatusMessage({ text: 'Service Worker nicht vom Browser unterstützt.', type: 'error' });
            return;
        }

        // Check VAPID Key presence
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
            setStatusMessage({ text: 'Fehler: VAPID Key fehlt (Neustart erforderlich?).', type: 'error' });
            return;
        }

        setStatusMessage({ text: 'Aktiviere Push...', type: '' });

        try {
            console.log('Push: Starting togglePush...');
            // Check current registration first to avoid hanging on .ready
            let registration = await navigator.serviceWorker.getRegistration();
            console.log('Push: Current registration:', registration);

            if (!registration || !registration.active) {
                setStatusMessage({ text: 'Warte auf Service Worker Aktivierung...', type: '' });
                console.log('Push: Waiting for .ready...');
                const swReadyPromise = navigator.serviceWorker.ready;
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Service Worker wird nicht aktiv (Timeout). Bitte Seite neu laden.')), 10000)
                );
                registration = await Promise.race([swReadyPromise, timeoutPromise]);
                console.log('Push: .ready resolved:', registration);
            }

            if (pushEnabled) {
                console.log('Push: Disabling...');
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) await subscription.unsubscribe();
                setPushEnabled(false);
                setStatusMessage({ text: 'Push deaktiviert.', type: 'success' });
                return;
            }

            console.log('Push: Subscribing with VAPID key...');
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });
            console.log('Push: Subscription object created:', sub.endpoint);

            setStatusMessage({ text: 'Speichere am Server...', type: '' });
            const token = localStorage.getItem('token');
            const res = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(sub)
            });

            if (res.ok) {
                console.log('Push: Server acknowledged subscription.');
                setPushEnabled(true);
                setStatusMessage({ text: 'Push aktiviert! Teste...', type: 'success' });
                const testRes = await fetch('/api/notifications/test', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log('Push: Test request sent. Status:', testRes.status);
                setStatusMessage({ text: 'Aktiviert & Test gesendet! 🚀', type: 'success' });
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error('Push: Server error:', res.status, errData);
                throw new Error(`Server-Fehler (${res.status}): ${errData.error || 'Unbekannt'}`);
            }
        } catch (err) {
            console.error('Push Error Detail:', err);
            setStatusMessage({ text: `Push-Fehler: ${err.message}`, type: 'error' });
        }
    };

    useEffect(() => {
        checkPushSubscription();
    }, []);

    const testConnection = async () => {
        setStatusMessage({ text: 'Teste Verbindung...', type: '' });
        try {
            const baseUrl = '';
            const response = await fetch(`${baseUrl}/api/status`);
            if (response.ok) {
                setStatusMessage({ text: 'Verbindung zum Server erfolgreich! ✅', type: 'success' });
            } else {
                setStatusMessage({ text: `Server antwortet mit Fehler ${response.status}`, type: 'error' });
            }
        } catch (error) {
            setStatusMessage({ text: 'Server nicht erreichbar! ❌ Prüfen Sie die IP-Adresse.', type: 'error' });
        }
    };

    if (isChangingPassword) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="bg-[#1b3a2e] text-white pt-12 pb-4 px-6 sticky top-0 z-30 shadow-md">
                    <div className="flex items-center space-x-3 max-w-2xl mx-auto">
                        <button onClick={() => setIsChangingPassword(false)} className="bg-white/10 p-2 rounded-xl">
                            <ChevronRight size={20} className="rotate-180" />
                        </button>
                        <h1 className="text-xl font-bold">Passwort ändern</h1>
                    </div>
                </header>

                <main className="max-w-2xl mx-auto w-full px-6 pt-8">
                    <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-gray-100">
                        {statusMessage.text && (
                            <div className={`p-4 rounded-2xl mb-6 text-sm font-bold ${statusMessage.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                {statusMessage.text}
                            </div>
                        )}

                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aktuelles Passwort</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-[#1b3a2e]/20 outline-none transition-all"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Neues Passwort</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-[#1b3a2e]/20 outline-none transition-all"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Passwort bestätigen</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-[#1b3a2e]/20 outline-none transition-all"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#1b3a2e] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#1b3a2e]/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                            >
                                Passwort jetzt aktualisieren
                            </button>


                        </form>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
            {/* Header matching template */}
            <header className="bg-[#1b3a2e] text-white pt-12 pb-4 px-6 sticky top-0 z-30 shadow-md">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center space-x-3">
                        <img
                            src="/icons/fox-logo.png"
                            alt="TrapSensor Logo"
                            className="w-20 h-20 rounded-3xl shadow-xl border border-white/20 object-contain bg-white/5"
                        />
                        <h1 className="text-2xl font-black tracking-tight">TrapSensor Setup</h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Settings size={20} className="text-white/60" />
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto w-full px-6 pt-6 space-y-8">
                {/* Push Notifications Section */}
                <section>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Benachrichtigungen</label>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div onClick={togglePush} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex items-center space-x-4">
                                <div className={`p-2.5 rounded-2xl ${pushEnabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Push-Alarm</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Bei Fang & Batterie-Warnung</p>
                                </div>
                            </div>
                            <div className={`w-12 h-7 rounded-full p-1 transition-colors ${pushEnabled ? 'bg-[#1b3a2e]' : 'bg-gray-200'}`}>
                                <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform ${pushEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>
                </section>



                {/* Account Section */}
                <section>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Konto & Profil</label>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className="bg-green-50 p-2.5 rounded-2xl text-green-700">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{currentUser?.email || 'Lädt...'}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Aktiver Benutzer</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300" />
                        </div>
                        <div
                            onClick={() => setIsChangingPassword(true)}
                            className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-700">
                                    <Shield size={20} />
                                </div>
                                <div className="text-sm font-bold text-gray-900">Passwort ändern</div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300" />
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full text-left p-4 flex items-center justify-between hover:bg-red-50 transition-colors group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="bg-red-50 p-2.5 rounded-2xl text-red-600 group-hover:bg-red-100">
                                    <LogOut size={20} />
                                </div>
                                <div className="text-sm font-bold text-red-600">Abmelden</div>
                            </div>
                            <ChevronRight size={18} className="text-red-300" />
                        </button>
                    </div>
                </section>

                {/* Trap Management Section */}
                <section>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">TrapSensor Verwalten</label>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden text-center">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">Lade TrapSensor...</div>
                        ) : traps.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">Keine TrapSensor gefunden.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {traps.map(trap => (
                                    <div
                                        key={trap.id}
                                        onClick={() => openTrapDetail(trap)}
                                        className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-gray-50 p-2 rounded-xl text-gray-400">
                                                <div className={`w-3 h-3 rounded-full ${trap.status === 'triggered' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : trap.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-gray-900">{trap.name}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{trap.location || 'Kein Standort'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openTrapDetail(trap);
                                                }}
                                                className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Freigeben"
                                            >
                                                <User size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteTrap(trap.id, trap.name, e)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Löschen"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>



                {/* Trap Details & Share Modal */}
                {selectedTrap && (
                    <div
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-md p-4"
                        onClick={() => setSelectedTrap(null)}
                    >
                        <div
                            className="bg-white w-full max-w-lg rounded-[2rem] p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">{selectedTrap.name}</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{selectedTrap.location || 'Kein Standort'}</p>
                                </div>
                                <button onClick={() => setSelectedTrap(null)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="text-[10px] uppercase font-black text-gray-400 mb-1">Status</div>
                                        <div className={`font-bold ${selectedTrap.status === 'active' ? 'text-green-600' : 'text-gray-900'}`}>
                                            {selectedTrap.status === 'active' ? 'Aktiv' : selectedTrap.status === 'triggered' ? 'Ausgelöst' : 'Inaktiv'}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="text-[10px] uppercase font-black text-gray-400 mb-1">IMEI</div>
                                        <div className="font-mono text-sm font-bold text-gray-900 truncate" title={selectedTrap.imei}>{selectedTrap.imei}</div>
                                    </div>
                                </div>

                                {/* Sharing Section */}
                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                                        <User size={18} className="text-gray-400" />
                                        <span>TrapSensor teilen</span>
                                    </h4>

                                    {currentUser && selectedTrap.userId === currentUser.id ? (
                                        <>
                                            <p className="text-xs text-gray-500 mb-4">
                                                Geben Sie eine E-Mail-Adresse ein, um diesen TrapSensor mit einem anderen Benutzer zu teilen.
                                            </p>

                                            <form onSubmit={handleShareTrap} className="flex space-x-2 mb-6">
                                                <input
                                                    type="email"
                                                    placeholder="E-Mail Adresse"
                                                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
                                                    value={shareEmail}
                                                    onChange={(e) => setShareEmail(e.target.value)}
                                                    required
                                                />
                                                <button type="submit" className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">
                                                    Teilen
                                                </button>
                                            </form>

                                            <div className="space-y-3">
                                                <div className="text-[10px] uppercase font-black text-gray-400">Bereits geteilt mit:</div>
                                                {loadingShares ? (
                                                    <div className="text-sm text-gray-400 italic">Lade Freigaben...</div>
                                                ) : trapShares.length === 0 ? (
                                                    <div className="text-sm text-gray-400 italic">Noch mit niemandem geteilt.</div>
                                                ) : (
                                                    trapShares.map(share => (
                                                        <div key={share.userId} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 text-xs font-bold border border-gray-100">
                                                                    {share.email.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-bold text-gray-900">{share.email}</div>
                                                                    <div className="text-[10px] text-gray-400">Lesezugriff</div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleUnshareTrap(share.userId)}
                                                                className="text-red-400 hover:text-red-600 p-2"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-xs font-medium">
                                            ⚠️ Sie können diesen TrapSensor nicht teilen, da Sie nicht der Besitzer sind.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* App Installation Section */}
                <section>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Installation</label>
                    <div className="bg-gradient-to-br from-[#1b3a2e] to-[#2a5a48] rounded-3xl shadow-lg p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-2">Als App nutzen</h3>
                            <p className="text-sm text-gray-200 mb-4 leading-relaxed">
                                Für das beste Erlebnis ohne Browser-Leiste:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="font-bold text-xs uppercase tracking-widest text-green-300 mb-1">iOS (iPhone)</div>
                                    <p className="text-xs space-y-1">
                                        <span className="block">1. Tippen Sie auf <span className="font-bold">Teilen</span> (Viereck mit Pfeil)</span>
                                        <span className="block">2. Wählen Sie <span className="font-bold">"Zum Home-Bildschirm"</span></span>
                                    </p>
                                </div>
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="font-bold text-xs uppercase tracking-widest text-green-300 mb-1">Android</div>
                                    <p className="text-xs space-y-1">
                                        <span className="block">1. Tippen Sie auf <span className="font-bold">⋮ (Menü)</span></span>
                                        <span className="block">2. Wählen Sie <span className="font-bold">"App installieren"</span></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Status Message Container */}
                {statusMessage.text && !isChangingPassword && (
                    <div className={`mx-6 p-4 rounded-2xl text-sm font-bold ${statusMessage.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {statusMessage.text}
                    </div>
                )}

                {/* Info Section */}
                <section>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Informationen</label>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="bg-gray-50 p-2.5 rounded-2xl text-gray-400">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">App Version</p>
                                    <p className="text-[10px] text-gray-400 font-medium">TrapSensor v1.2.0 (Build 2026.02)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div
                            onClick={() => setShowDebug(!showDebug)}
                            className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 cursor-pointer">
                                Entwickleroptionen & Debug
                            </label>
                            <ChevronRight size={18} className={`text-gray-300 transition-transform ${showDebug ? 'rotate-90' : ''}`} />
                        </div>

                        {showDebug && (
                            <div className="border-t border-gray-50">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-gray-100 p-2.5 rounded-2xl text-gray-400">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">PWA Status</p>
                                            <p className={`text-[10px] font-bold ${swStatus.includes('Aktiv') ? 'text-green-600' : 'text-red-500'}`}>{swStatus}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center justify-between border-t border-gray-50">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2.5 rounded-2xl ${notifPermission === 'granted' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            <Info size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Berechtigung</p>
                                            <p className="text-[10px] font-bold uppercase tracking-tight">
                                                {notifPermission === 'granted' ? '✅ Erteilt' : notifPermission === 'denied' ? '❌ Blockiert' : '❓ Ungeklärt'}
                                            </p>
                                        </div>
                                    </div>
                                    {notifPermission !== 'granted' && (
                                        <button
                                            onClick={handleRequestPermission}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100 active:scale-95 transition-all"
                                        >
                                            Anfordern
                                        </button>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col space-y-2 border-t border-gray-50 bg-amber-50/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-amber-800 uppercase italic">Debug-Kontext:</span>
                                        <span className="text-[10px] font-mono text-amber-600">{window.location.origin}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500">Controller:</span>
                                        <span className={`text-[10px] font-bold ${navigator.serviceWorker?.controller ? 'text-green-600' : 'text-red-500'}`}>
                                            {navigator.serviceWorker?.controller ? 'Aktiv / Verbunden' : 'Gezielt (Neu laden!)'}
                                        </span>
                                    </div>
                                    {swLogs.length > 0 && (
                                        <div className="mt-2 p-2 bg-black/5 rounded-lg font-mono text-[9px] text-gray-600 space-y-1">
                                            <div className="font-bold border-b border-black/5 pb-1 mb-1">Live SW-Logs:</div>
                                            {swLogs.map((log, i) => (
                                                <div key={i} className={log.includes('FEHLER') ? 'text-red-600' : log.includes('Erfolg') ? 'text-green-600' : ''}>
                                                    {log}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>


                                <div
                                    onClick={() => {
                                        const token = localStorage.getItem('token');
                                        navigator.clipboard.writeText(token);
                                        setStatusMessage({ text: 'Token in Zwischenablage kopiert! ✅', type: 'success' });
                                        setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
                                    }}
                                    className="p-4 flex items-center justify-between border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-amber-50 p-2.5 rounded-2xl text-amber-600">
                                            <Settings size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">API-Token kopieren</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Für MQTT-Simulator & Debugging</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300" />
                                </div>

                                <div
                                    onClick={testConnection}
                                    className="p-4 flex items-center justify-between border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600">

                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Server-Verbindung</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Klicken zum Testen</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300" />
                                </div>
                                <div
                                    onClick={handleLocalTest}
                                    className="p-4 flex items-center justify-between border-t border-gray-50 hover:bg-amber-50 group transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-amber-50 p-2.5 rounded-2xl text-amber-600 group-hover:bg-amber-100">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">SW Test-Notiz</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Testet via Service Worker</p>
                                        </div>

                                    </div>
                                    <ChevronRight size={18} className="text-gray-300" />
                                </div>
                                <div
                                    onClick={handleMainThreadTest}
                                    className="p-4 flex items-center justify-between border-t border-gray-50 hover:bg-purple-50 group transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-purple-50 p-2.5 rounded-2xl text-purple-600 group-hover:bg-purple-100">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Direct Test-Notiz</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Testet via System-Interface</p>
                                        </div>

                                    </div>
                                    <ChevronRight size={18} className="text-gray-300" />
                                </div>
                                <div
                                    onClick={handleManualRegister}
                                    className="p-4 flex items-center justify-between border-t border-gray-50 hover:bg-green-50 group transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-green-50 p-2.5 rounded-2xl text-green-600 group-hover:bg-green-100">
                                            <Settings size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">SW manuell starten</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Erzwingt Registrierung (Mobile Fix)</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300" />
                                </div>
                                <div
                                    onClick={handleForceCleanup}
                                    className="p-4 flex items-center justify-between border-t border-gray-50 hover:bg-red-50 group transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-red-50 p-2.5 rounded-2xl text-red-600 group-hover:bg-red-100">
                                            <Trash2 size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">SW Fehler beheben</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Bereinigt & Repariert App-Cache</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300" />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div >
    );
};

export default Setup;
