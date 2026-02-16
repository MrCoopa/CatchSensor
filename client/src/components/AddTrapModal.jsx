import React, { useState } from 'react';
import { X, Camera } from 'lucide-react';
import QRScanner from './QRScanner';

const AddTrapModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({ name: '', location: '', imei: '' });
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleScan = (imei) => {
        setFormData({ ...formData, imei });
        setIsScannerOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/api/traps`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                const newTrap = await response.json();
                onAdd(newTrap);
                setFormData({ name: '', location: '', imei: '' });
                onClose();
            } else {
                const data = await response.json();
                setError(data.error || 'Fehler beim Speichern');
            }
        } catch (error) {
            console.error('Fehler:', error);
            setError('Verbindung zum Server fehlgeschlagen');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Neue Falle anlernen</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-green-700 outline-none"
                            placeholder="z.B. Wiesenkante Süd"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">IMEI / ID</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.imei}
                                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-green-700 outline-none"
                                placeholder="Scan oder Code eingeben"
                            />
                            <button
                                type="button"
                                onClick={() => setIsScannerOpen(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                    </div>

                    {isScannerOpen && (
                        <QRScanner
                            onScan={handleScan}
                            onClose={() => setIsScannerOpen(false)}
                        />
                    )}

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-4 bg-[#1b3a2e] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
                        >
                            Speichern
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTrapModal;
