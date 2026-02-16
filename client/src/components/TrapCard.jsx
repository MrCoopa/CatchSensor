import React from 'react';

const TrapCard = ({ trap, onViewHistory }) => {
    const statusColors = {
        active: 'text-green-600 bg-green-100',
        inactive: 'text-gray-600 bg-gray-100',
        triggered: 'text-red-600 bg-red-100 animate-pulse',
    };

    const statusLabels = {
        active: 'Aktiv',
        inactive: 'Inaktiv',
        triggered: 'Ausgelöst',
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">{trap.name}</h3>
                    <p className="text-sm text-gray-500">{trap.location || 'Kein Standort festgelegt'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${statusColors[trap.status] || 'bg-gray-100'}`}>
                    {statusLabels[trap.status] || trap.status}
                </span>
            </div>

            <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-400">
                    Letzter Check: {trap.lastReading ? new Date(trap.lastReading).toLocaleString('de-DE') : 'Nie'}
                </div>
                <button
                    onClick={() => onViewHistory(trap)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                    Verlauf anzeigen
                </button>
            </div>
        </div>
    );
};

export default TrapCard;
