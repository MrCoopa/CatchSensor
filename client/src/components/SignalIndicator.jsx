import React from 'react';

const SignalIndicator = ({ rssi, type = 'NB-IOT', className = "", barWidth = "w-0.5", barHeight = "h-3" }) => {

    const getBars = (r, t) => {
        if (!r || r === 0) return 0;

        if (t === 'LORAWAN') {
            // LoRaWAN ranges (dBm)
            if (r > -80) return 4;   // Excellent / Very strong
            if (r > -100) return 3;  // Good to moderate
            if (r > -115) return 2;  // Weak
            if (r > -120) return 1;  // Very weak
            return 0;                // Too weak
        } else {
            // NB-IoT ranges (absolute values logic)
            const absR = Math.abs(r);
            if (absR <= 75) return 4;
            if (absR <= 90) return 3;
            if (absR <= 100) return 2;
            if (absR <= 110) return 1;
            return 0;
        }
    };

    const getColorClass = (b, r, t) => {
        if (b === 0 || !r) return 'bg-gray-200';

        if (t === 'LORAWAN') {
            if (r > -80) return 'bg-green-600';
            if (r > -100) return 'bg-lime-500';
            if (r > -115) return 'bg-yellow-500';
            if (r > -120) return 'bg-orange-500';
            return 'bg-red-500';
        } else {
            const absR = Math.abs(r);
            if (absR <= 75) return 'bg-green-600';
            if (absR <= 90) return 'bg-lime-500';
            if (absR <= 105) return 'bg-yellow-500';
            return 'bg-red-500';
        }
    };

    const bars = getBars(rssi, type);
    const colorClass = getColorClass(bars, rssi, type);

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
