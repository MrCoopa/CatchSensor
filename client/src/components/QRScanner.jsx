import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

const QRScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCodeRef.current = new Html5Qrcode("reader");

        const startScanner = async () => {
            try {
                // Prefer back camera
                await html5QrCodeRef.current.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        onScan(decodedText);
                        stopScanner();
                    },
                    (errorMessage) => {
                        // ignore error messages
                    }
                );
            } catch (err) {
                console.error("Unable to start scanner", err);
            }
        };

        startScanner();

        return () => {
            stopScanner();
        };
    }, []);

    const stopScanner = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (err) {
                console.error("Error stopping scanner", err);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-[60] p-6">
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center space-x-2 text-[#1b3a2e]">
                        <Camera size={20} />
                        <span className="font-bold uppercase tracking-widest text-xs">QR-Code scannen</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div id="reader" className="w-full aspect-square bg-gray-900"></div>

                <div className="p-6 text-center">
                    <p className="text-sm text-gray-400 font-medium">Halten Sie den QR-Code Ihrer Falle mittig vor die Kamera.</p>
                </div>
            </div>

            <button
                onClick={onClose}
                className="mt-8 px-8 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-colors"
            >
                Abbrechen
            </button>
        </div>
    );
};

export default QRScanner;
