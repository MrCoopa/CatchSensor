import React, { useState, useEffect } from 'react';
import TrapCard from './TrapCard';
import AddTrapModal from './AddTrapModal';
import TrapDetailsModal from './TrapDetailsModal';

const Dashboard = () => {
    const [traps, setTraps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTrap, setSelectedTrap] = useState(null);

    const fetchTraps = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/traps');
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

    const handleAddTrap = (newTrap) => {
        setTraps([...traps, newTrap]);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    Fallen-Monitor
                </h2>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
                >
                    Neue Falle hinzufügen
                </button>
            </div>

            {traps.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 text-lg">Noch keine Fallen überwacht. Fangen Sie an, indem Sie eine hinzufügen!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {traps.map((trap) => (
                        <TrapCard
                            key={trap.id}
                            trap={trap}
                            onViewHistory={(t) => setSelectedTrap(t)}
                        />
                    ))}
                </div>
            )}

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
