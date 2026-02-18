import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EditCatchModal = ({ isOpen, onClose, onEdit, catchSensor }) => {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        alias: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (catchSensor) {
            setFormData({
                name: catchSensor.name || '',
                location: catchSensor.location || '',
                alias: catchSensor.alias || ''
            });
        }
    }, [catchSensor]);

    if (!isOpen || !catchSensor) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/catches/${catchSensor.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    alias: formData.name // Force alias to match name since UI only shows one field
                }),
            });
            if (response.ok) {
                const updatedCatch = await response.json();
                onEdit(updatedCatch);
                onClose();
            } else {
                const data = await response.json();
                setError(data.error || 'Fehler beim Aktualisieren');
            }
        } catch (error) {
            console.error('Fehler:', error);
            setError(`Verbindung zum Server fehlgeschlagen: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Melder bearbeiten</h2>
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
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Name / Beschreibung</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[#1b3a2e]/20 outline-none transition-all"
                            placeholder="z.B. Wiesenkante Süd"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Standort (optional)</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[#1b3a2e]/20 outline-none transition-all"
                            placeholder="z.B. Obere Dickung / Bachlauf"
                        />
                    </div>

                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mt-6">
                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">Hinweis</p>
                        <p className="text-xs text-amber-900 leading-relaxed">
                            Die Geräte-Kennung ({catchSensor.type === 'LORAWAN' ? 'Device ID' : 'IMEI'}) kann aus Sicherheitsgründen nicht geändert werden.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200"
                        >
                            Abbrechen
                        </button>
                        <button
                            disabled={loading}
                            type="submit"
                            className={`flex-1 px-6 py-4 bg-[#1b3a2e] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Speichern...' : 'Speichern'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCatchModal;
