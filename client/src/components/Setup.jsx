import React, { useState, useEffect } from 'react';
import { User, Shield, Info, Trash2, LogOut, ChevronRight, Settings } from 'lucide-react';

const Setup = ({ onLogout }) => {
    const [traps, setTraps] = useState([]);
    const [loading, setLoading] = useState(true);
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
            {/* Header matching template */}
            <header className="bg-[#1b3a2e] text-white pt-12 pb-4 px-6 sticky top-0 z-30 shadow-md">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center space-x-3">
                        <img
                            src="/icons/fox-logo.png"
                            alt="Logo"
                            className="w-8 h-8 rounded-lg shadow-md border border-white/20"
                        />
                        <h1 className="text-xl font-black tracking-tight">Setup</h1>
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
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
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
                                    <p className="text-[10px] text-gray-400 font-medium">v1.2.0 (Build 2026.02)</p>
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
