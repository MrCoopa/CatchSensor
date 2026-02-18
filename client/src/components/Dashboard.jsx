import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import CatchCard from './CatchCard';
import AddCatchModal from './AddCatchModal';
import CatchDetailsModal from './CatchDetailsModal';
import { ArrowLeft } from 'lucide-react';

const Dashboard = ({ onLogout }) => {
    const [catches, setCatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCatch, setSelectedCatch] = useState(null);

    const baseUrl = ''; // kept for socket.io if needed, or remove if socket io also proxies

    const fetchCatches = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/catches', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                onLogout();
                return;
            }

            const data = await response.json();
            if (Array.isArray(data)) {
                setCatches(data);
            }
        } catch (error) {
            console.error('Fehler beim Abrufen der Melder:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get current user ID
    const getCurrentUserId = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id;
        } catch (e) {
            return null;
        }
    };

    const currentUserId = getCurrentUserId();

    useEffect(() => {
        fetchCatches();

        const token = localStorage.getItem('token');
        if (!token) return;

        // Socket.io should also use relative path if proxied, or window.location.origin
        const socket = io('/', {
            auth: {
                token: token
            }
        });

        socket.on('connect_error', (err) => {
            console.error('Socket Authentication Error:', err.message);
        });

        socket.on('catchSensorUpdate', (updatedCatch) => {
            console.log('Socket: Received update for detector:', updatedCatch.id);
            setCatches(prevCatches =>
                prevCatches.map(c => c.id === updatedCatch.id ? updatedCatch : c)
            );
        });

        const handleOpenModal = () => setIsAddModalOpen(true);
        window.addEventListener('open-add-catch-sensor', handleOpenModal);

        return () => {
            console.log('Dashboard: Cleaning up socket & listeners');
            socket.off('connect_error');
            socket.off('catchSensorUpdate');
            socket.disconnect();
            window.removeEventListener('open-add-catch-sensor', handleOpenModal);
        };
    }, []);

    const handleAddCatch = (newCatch) => {
        setCatches([...catches, newCatch]);
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
                            alt="CatchSensor Logo"
                            className="w-20 h-20 rounded-3xl shadow-xl border border-white/20 object-contain bg-white/5"
                        />
                        <h1 className="text-2xl font-black tracking-tight">CatchSensor</h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="bg-green-600/90 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Online
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 mb-24">
                {catches.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 shadow-sm">
                        <p className="text-gray-500 font-medium">Noch keine Melder. Klicken Sie auf "+ Neu".</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {catches.map((c) => (
                            <CatchCard
                                key={c.id}
                                catchSensor={c}
                                isShared={c.userId !== currentUserId}
                                onViewHistory={(t) => setSelectedCatch(t)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <AddCatchModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddCatch}
            />

            <CatchDetailsModal
                isOpen={!!selectedCatch}
                catchSensor={selectedCatch}
                onClose={() => setSelectedCatch(null)}
            />
        </div>
    );
};

export default Dashboard;
