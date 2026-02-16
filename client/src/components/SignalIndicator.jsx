import React from 'react';

const SignalIndicator = ({ rssi, className = "", barWidth = "w-0.5", barHeight = "h-3" }) => {
    const absRSSI = Math.abs(rssi || 0);

    // Berechnung der Balken (0-4) basierend auf RSSI (dBm)
    const getBars = (r) => {
        if (r === 0) return 0;
        if (r <= 75) return 4;
        if (r <= 90) return 3;
        if (r <= 100) return 2;
        if (r <= 110) return 1;
        return 0;
    };

    const bars = getBars(absRSSI);

    return (
        <div className={`flex items-end space-x-0.5 ${barHeight} ${className}`}>
            {[1, 2, 3, 4].map((bar) => (
                <div
                    key={bar}
                    className={`${barWidth} rounded-t-sm transition-all duration-500 ${bar <= bars ? 'bg-green-600' : 'bg-gray-200'}`}
                    style={{ height: `${bar * 25}%` }}
                />
            ))}
        </div>
    );
};

export default SignalIndicator;
