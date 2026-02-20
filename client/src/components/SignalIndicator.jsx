import React from 'react';

const SignalIndicator = ({ rssi, className = "", barWidth = "w-0.5", barHeight = "h-3" }) => {

    // Updated bars based on user-provided LoRaWAN ranges
    const getBars = (r) => {
        if (!r || r === 0) return 0;
        if (r > -50) return 4;   // Excellent
        if (r > -80) return 4;   // Very strong
        if (r > -100) return 3;  // Good to moderate
        if (r > -115) return 2;  // Weak
        if (r > -120) return 1;  // Very weak
        return 0;                // Too weak / Range limit
    };

    const getColorClass = (b, r) => {
        if (b === 0 || !r) return 'bg-gray-200';
        if (r > -80) return 'bg-green-600';
        if (r > -100) return 'bg-lime-500';
        if (r > -115) return 'bg-yellow-500';
        if (r > -120) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const bars = getBars(rssi);
    const colorClass = getColorClass(bars, rssi);

    return (
        <div
            className={`flex items-end space-x-0.5 ${barHeight} ${className}`}
            title={`Signalstärke: ${rssi || 'N/A'} dBm`}
        >
            {[1, 2, 3, 4].map((bar) => (
                <div
                    key={bar}
                    className={`${barWidth} rounded-t-sm transition-all duration-500 ${bar <= bars ? colorClass : 'bg-gray-200'}`}
                    style={{ height: `${bar * 25}%` }}
                />
            ))}
        </div>
    );
};

export default SignalIndicator;
