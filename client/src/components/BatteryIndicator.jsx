import React from 'react';

const BatteryIndicator = ({ percentage, className = "" }) => {
    const fillLevel = Math.min(100, Math.max(0, percentage));

    // Farbwahl basierend auf Ladestand (Rot ab 25% und darunter)
    const colorClass = fillLevel <= 25 ? 'bg-red-500' : 'bg-green-600';

    return (
        <div className={`flex items-center ${className}`}>
            <div className="relative w-5 h-2.5 border border-gray-400 rounded-[2px] p-[0.5px] flex items-center">
                <div
                    className={`h-full rounded-[0.5px] transition-all duration-500 ${colorClass}`}
                    style={{ width: `${fillLevel}%` }}
                />
                {/* Batterie-Nöppel */}
                <div className="absolute -right-[2.5px] top-1/2 -translate-y-1/2 w-[1.5px] h-1.2 bg-gray-400 rounded-r-[0.5px]" />
            </div>
        </div>
    );
};

export default BatteryIndicator;
