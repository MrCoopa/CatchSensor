import React, { useState } from 'react';

const AddTrapModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({ name: '', location: '' });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/traps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                const newTrap = await response.json();
                onAdd(newTrap);
                setFormData({ name: '', location: '' });
                onClose();
            }
        } catch (error) {
            console.error('Fehler beim Hinzufügen der Falle:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Neue Falle hinzufügen</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name der Falle</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="z.B. Nordtor"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Standort</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="z.B. Scheune Sektor 4"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg"
                        >
                            Falle registrieren
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTrapModal;
