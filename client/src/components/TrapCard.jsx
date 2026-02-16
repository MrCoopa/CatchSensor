import { Battery, Signal } from 'lucide-react';
import BatteryIndicator from './BatteryIndicator';
import SignalIndicator from './SignalIndicator';

const formatTimeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000 / 60);
    if (diff < 1) return 'Gerade eben';
    if (diff < 60) return `Vor ${diff} Min`;
    if (diff < 1440) return `Vor ${Math.floor(diff / 60)} Std`;
    return 'Gestern';
};

const TrapCard = ({ trap, onViewHistory }) => {
    const statusConfig = {
        active: {
            border: 'border-l-[6px] border-l-green-600',
            bg: 'bg-green-50/50',
            text: 'text-green-600',
            label: 'BEREIT / SCHARF',
            timeColor: 'text-gray-400'
        },
        inactive: {
            border: 'border-l-[6px] border-l-gray-400',
            bg: 'bg-gray-100/50',
            text: 'text-gray-500',
            label: 'KEIN KONTAKT (>8H)',
            timeColor: 'text-gray-400'
        },
        triggered: {
            border: 'border-l-[6px] border-l-red-600',
            bg: 'bg-red-50/80',
            text: 'text-red-600',
            label: 'FANG GEMELDET!',
            timeColor: 'text-gray-400',
            animate: 'animate-pulse-red'
        },
    };

    const config = statusConfig[trap.status] || statusConfig.active;

    return (
        <div
            onClick={() => onViewHistory(trap)}
            className={`relative cursor-pointer bg-white rounded-2xl shadow-sm p-5 border-y border-r border-gray-100 transition-all active:scale-[0.98] ${config.border} ${config.bg} ${config.animate || ''}`}
        >
            <div className="flex justify-between items-start mb-0.5">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">{trap.name}</h3>
                <span className={`text-xs font-medium ${config.timeColor}`}>
                    {trap.lastReading ? formatTimeAgo(trap.lastReading) : 'Nie'}
                </span>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {trap.location || 'Kein Standort hinterlegt'}
            </p>

            <div className={`text-sm font-black tracking-wider mb-6 ${config.text}`}>
                {config.label}
            </div>

            {trap.lastReading && (
                <div className="flex items-center space-x-8 text-gray-500">
                    <div className="flex items-center space-x-2">
                        <BatteryIndicator percentage={trap.batteryPercent || 0} />
                        <div className="text-sm font-medium">
                            <p className="leading-none">{((trap.batteryVoltage || 0) / 1000).toFixed(1).replace('.', ',')} V</p>
                            <p className="text-[10px] text-gray-400 leading-none mt-0.5">{trap.batteryPercent || 0}%</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <SignalIndicator rssi={trap.rssi} barWidth="w-1" barHeight="h-4" className="mb-0.5" />
                        <div className="text-sm font-medium text-gray-500">
                            <p className="leading-none mt-1">-{trap.rssi || 0} dBm</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrapCard;
