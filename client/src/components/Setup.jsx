import React, { useState, useEffect } from 'react';
import { User, Shield, Info, Trash2, LogOut, ChevronRight, Settings } from 'lucide-react';

const Setup = ({ onLogout }) => {
    const [traps, setTraps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
    const userEmail = localStorage.getItem('userEmail');

    const fetchTraps = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
            const response = await fetch(`${baseUrl}/api/traps`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setTraps(data);
        } catch (error) {
            console.error('Fehler beim Abrufen der Fallen:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTraps();
    }, []);

    const handleDeleteTrap = async (id, name) => {
        if (window.confirm(`Möchten Sie die Falle "${name}" wirklich löschen?`)) {
            try {
                const token = localStorage.getItem('token');
                const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
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
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
            const response = await fetch(`${baseUrl}/api/auth/change-password`, {
                method: 'PUT',
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
            setStatusMessage({ text: 'Verbindungsfehler zum Server.', type: 'error' });
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
                                    <p className="text-sm font-bold text-gray-900">{userEmail}</p>
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
            </main>
        </div>
    );
};

export default Setup;
