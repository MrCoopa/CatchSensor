import React, { useState, useEffect } from 'react';

const TrapDetailsModal = ({ trap, isOpen, onClose }) => {
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && trap) {
            setLoading(true);
            fetch(`http://localhost:5000/api/readings/${trap.id}`)
                .then(res => res.json())
                .then(data => {
                    setReadings(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [isOpen, trap]);

    if (!isOpen || !trap) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[80vh] flex flex-col border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{trap.name}</h2>
                        <p className="text-gray-500">{trap.location}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Aktuelle Messwerte</h3>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : readings.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">Noch keine Messwerte aufgezeichnet.</p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeitpunkt</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wert</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {readings.map((reading) => (
                                    <tr key={reading.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(reading.timestamp).toLocaleString('de-DE')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                            {reading.type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {reading.value.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                    >
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrapDetailsModal;
