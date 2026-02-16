import React, { useState, useEffect } from 'react';
import { X, Battery, Signal } from 'lucide-react';

const TrapDetailsModal = ({ trap, isOpen, onClose }) => {
    const [readings, setReadings] = useState([]);

    useEffect(() => {
        if (isOpen && trap) {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
            const token = localStorage.getItem('token');
            fetch(`${baseUrl}/api/readings/${trap.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setReadings(data))
                .catch(err => console.error(err));
        }
    }, [isOpen, trap]);

    if (!isOpen || !trap) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-xl w-full p-8 max-h-[90vh] flex flex-col relative">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{trap.name}</h2>
                        <p className="text-gray-400 text-sm font-medium">{trap.location || 'Kein Standort hinterlegt'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                            <Battery size={14} className="mr-1" /> Spannung
                        </div>
                        <div className="text-lg font-bold text-gray-900">{trap.batteryVoltage || 3650} mV</div>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                            <Signal size={14} className="mr-1" /> Signal
                        </div>
                        <div className="text-lg font-bold text-gray-900">-{trap.signalStrength || 88} dBm</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Verlauf</h4>
                    <div className="space-y-3">
                        {readings.map((reading) => (
                            <div key={reading.id} className="flex items-center justify-between py-3 border-b border-gray-50">
                                <div>
                                    <p className="text-gray-900 font-bold text-sm">{reading.type === 'vibration' ? 'Ereignis' : reading.type}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">
                                        {new Date(reading.timestamp).toLocaleString('de-DE')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">{reading.value} mV</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-8 w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                >
                    Schließen
                </button>
            </div>
        </div>
    );
};

export default TrapDetailsModal;
