import React, { useState, useEffect } from 'react';
import { X, Battery, Signal } from 'lucide-react';
import BatteryIndicator from './BatteryIndicator';
import SignalIndicator from './SignalIndicator';

const TrapDetailsModal = ({ trap, isOpen, onClose }) => {
    const [readings, setReadings] = useState([]);

    useEffect(() => {
        if (isOpen && trap) {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
            const token = localStorage.getItem('token');
            fetch(`${baseUrl}/api/readings/${trap.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    if (Array.isArray(data)) {
                        setReadings(data);
                    } else {
                        console.error('Readings data is not an array:', data);
                        setReadings([]);
                    }
                })
                .catch(err => {
                    console.error('Error fetching readings:', err);
                    setReadings([]);
                });
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

                {trap.lastReading && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                                <BatteryIndicator percentage={trap.batteryPercent || 0} className="mr-2" /> Batterie
                            </div>
                            <div className="text-lg font-bold text-gray-900">{((trap.batteryVoltage || 0) / 1000).toFixed(1).replace('.', ',')} V</div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                                <SignalIndicator rssi={trap.rssi} className="mr-2" /> Signal
                            </div>
                            <div className="text-lg font-bold text-gray-900">-{trap.rssi || 0} dBm</div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Verlauf</h4>
                    <div className="space-y-4">
                        {readings.map((reading) => (
                            <div key={reading.id} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
                                <div className="flex justify-between items-center mb-4">
                                    <p className={`font-black text-xs tracking-widest uppercase ${reading.status === 'triggered' ? 'text-red-600' : 'text-green-600'}`}>
                                        {reading.status === 'triggered' ? '⚡ FANG!' : '✔️ AKTIV'}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-medium">
                                        {new Date(reading.timestamp).toLocaleString('de-DE')}
                                    </p>
                                </div>

                                <div className="flex items-center space-x-8">
                                    {/* Batterie */}
                                    <div className="flex items-center space-x-2">
                                        <BatteryIndicator percentage={reading.batteryPercent || 0} />
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-gray-700 leading-none">{reading.batteryPercent || 0}%</span>
                                            <span className="text-[9px] text-gray-400 font-medium">{((reading.value || 0) / 1000).toFixed(1).replace('.', ',')} V</span>
                                        </div>
                                    </div>

                                    {/* Signal */}
                                    <div className="flex items-center space-x-2 border-l border-gray-200 pl-6">
                                        <SignalIndicator rssi={reading.rssi} />
                                        <span className="text-[11px] font-black text-gray-500 leading-none">-{reading.rssi || 0} dBm</span>
                                    </div>
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
