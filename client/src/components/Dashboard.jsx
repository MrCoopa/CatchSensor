import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import TrapCard from './TrapCard';
import AddTrapModal from './AddTrapModal';
import TrapDetailsModal from './TrapDetailsModal';
import { ArrowLeft } from 'lucide-react';

const Dashboard = ({ onLogout }) => {
    const [traps, setTraps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTrap, setSelectedTrap] = useState(null);

    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;

    const fetchTraps = async () => {
        try {
            const token = localStorage.getItem('token');
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
        const socket = io(baseUrl);
        socket.on('trap_update', (updatedTrap) => {
            setTraps(prevTraps =>
                prevTraps.map(trap => trap.id === updatedTrap.id ? updatedTrap : trap)
            );
        });
        const handleOpenModal = () => setIsAddModalOpen(true);
        window.addEventListener('open-add-trap', handleOpenModal);

        return () => {
            socket.disconnect();
            window.removeEventListener('open-add-trap', handleOpenModal);
        };
    }, []);

    const handleAddTrap = (newTrap) => {
        setTraps([...traps, newTrap]);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header matching template */}
            <header className="bg-[#1b3a2e] text-white pt-12 pb-4 px-6 sticky top-0 z-30 shadow-md">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center space-x-3">
                        <img
                            src="/icons/fox-logo.png"
                            alt="Logo"
                            className="w-8 h-8 rounded-lg shadow-md border border-white/20"
                        />
                        <h1 className="text-xl font-black tracking-tight">TrapSensor</h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="bg-green-600/90 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Online
                        </div>
                        <button
                            onClick={onLogout}
                            className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors border border-white/20 px-2 py-0.5 rounded-md"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 mb-24">
                {traps.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 shadow-sm">
                        <p className="text-gray-500 font-medium">Noch keine Fallen. Klicken Sie auf "+ Neu".</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {traps.map((trap) => (
                            <TrapCard
                                key={trap.id}
                                trap={trap}
                                onViewHistory={(t) => setSelectedTrap(t)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <AddTrapModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddTrap}
            />

            <TrapDetailsModal
                isOpen={!!selectedTrap}
                trap={selectedTrap}
                onClose={() => setSelectedTrap(null)}
            />
        </div>
    );
};

export default Dashboard;
