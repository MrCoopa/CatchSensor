import React, { useState, useEffect } from 'react';
import { User, Shield, Info, Trash2, LogOut, ChevronRight, Settings } from 'lucide-react';

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

    useEffect(() => {
        const checkSW = async () => {
            if ('serviceWorker' in navigator) {
                // detailed logging
                const regs = await navigator.serviceWorker.getRegistrations();
                let debugText = `Regs: ${regs.length}`;

                if (window.swError) {
                    setSwStatus(`Fehler: ${window.swError.message}`);
                    return;
                }

                if (navigator.serviceWorker.controller) {
                    setSwStatus('Aktiv ✅ (Ready)');
                } else {
                    setSwStatus(`Inaktiv ⚠️ (${debugText})`);
                    // Try to register manually if missing?
                }
            } else {
                setSwStatus('Nicht unterstützt ❌');
            }
        };

        // Little delay to ensure main.jsx ran
        const timer = setTimeout(checkSW, 500);
        return () => clearTimeout(timer);
    }, []);

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

    const handleDeleteTrap = async (id, name) => {
        if (window.confirm(`Möchten Sie die Falle "${name}" wirklich löschen?`)) {
            try {
                const token = localStorage.getItem('token');
                const baseUrl = '';
                const response = await fetch(`${baseUrl}/api/traps/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    setTraps(traps.filter(t => t.id !== id));
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
            // Timeout race for service worker ready
            const swReadyPromise = navigator.serviceWorker.ready;
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Service Worker antwortet nicht (SSL/Timeout).')), 5000)
            );

            const registration = await Promise.race([swReadyPromise, timeoutPromise]);

            if (pushEnabled) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) await subscription.unsubscribe();
                setPushEnabled(false);
                setStatusMessage({ text: 'Push deaktiviert.', type: 'success' });
                return;
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

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
                setPushEnabled(true);
                setStatusMessage({ text: 'Push aktiviert! Teste...', type: 'success' });
                await fetch('/api/notifications/test', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setStatusMessage({ text: 'Aktiviert & Test gesendet! 🚀', type: 'success' });
            } else {
                throw new Error('Server-Fehler beim Speichern.');
            }
        } catch (err) {
            console.error('Push Error:', err);
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
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Fallen Verwalten</label>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">Lade Fallen...</div>
                        ) : traps.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">Keine Fallen gefunden.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {traps.map(trap => (
                                    <div key={trap.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-gray-50 p-2.5 rounded-2xl text-gray-400">
                                                <div className={`w-3 h-3 rounded-full ${trap.status === 'triggered' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : trap.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{trap.name}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{trap.location || 'Kein Standort'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTrap(trap.id, trap.name)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

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
                        <div className="p-4 flex items-center justify-between border-t border-gray-50 bg-gray-50/50">
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
                    </div>
                </section>

            </main>
        </div>
    );
};

export default Setup;
