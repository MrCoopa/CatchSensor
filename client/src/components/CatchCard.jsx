import { Battery, Signal, Users } from 'lucide-react';
import BatteryIndicator from './BatteryIndicator';
import SignalIndicator from './SignalIndicator';

const formatTimeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000 / 60);
    if (diff < 1) return 'Gerade eben';
    if (diff < 60) return `Vor ${diff} Min`;
    if (diff < 1440) return `Vor ${Math.floor(diff / 60)} Std`;
    return 'Gestern';
};

const CatchCard = ({ catchSensor, onViewHistory, isShared }) => {
    const isLoRa = catchSensor.type === 'LORAWAN';
    const status = catchSensor.status;
    const voltage = catchSensor.batteryVoltage; // mV
    const lastUpdate = catchSensor.lastSeen;

    const statusConfig = {
        active: {
            border: 'border-l-[6px] border-l-green-600',
            bg: 'bg-green-50/50',
            text: 'text-green-600',
            label: 'ONLINE',
            timeColor: 'text-gray-400'
        },
        inactive: {
            border: 'border-l-[6px] border-l-gray-400',
            bg: 'bg-gray-100/50',
            text: 'text-gray-500',
            label: 'OFFLINE',
            timeColor: 'text-gray-400'
        },
        triggered: {
            border: 'border-l-[6px] border-l-red-600',
            bg: 'bg-red-50/80',
            text: 'text-red-600',
            label: 'FANG GEMELDET!',
            timeColor: 'text-gray-400',
        },
    };

    const config = statusConfig[status] || statusConfig.active;

    return (
        <div
            onClick={() => onViewHistory(catchSensor)}
            className={`relative cursor-pointer bg-white rounded-2xl shadow-sm p-5 border-y border-r border-gray-100 transition-all active:scale-[0.98] ${config.border} ${config.bg} ${config.animate || ''}`}
        >
            <div className="flex justify-between items-start mb-0.5">
                <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {catchSensor.alias || catchSensor.name}
                        {isShared && (
                            <Users size={16} className="text-blue-500" />
                        )}
                    </h3>
                </div>
                <span className={`text-xs font-medium ${config.timeColor}`}>
                    {lastUpdate ? formatTimeAgo(lastUpdate) : 'Nie'}
                </span>
            </div>
            {catchSensor.location && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide my-2">
                    {catchSensor.location}
                </p>
            )}

            <div className={`text-sm font-black tracking-wider mb-4 ${config.text}`}>
                {config.label}
            </div>

            {lastUpdate && (
                <div className="flex items-center space-x-8 text-gray-500">
                    <div className="flex items-center space-x-2">
                        <BatteryIndicator percentage={catchSensor.batteryPercent || 0} />
                        <div className="text-sm font-medium">
                            <p className="leading-none">{((voltage || 0) / 1000).toFixed(1).replace('.', ',')} V</p>
                            <p className="text-[10px] text-gray-400 leading-none mt-0.5">{catchSensor.batteryPercent || 0}%</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-500">
                        <div className="flex items-center space-x-2">
                            <SignalIndicator rssi={isLoRa ? catchSensor.lorawanCatchSensor?.loraRssi : catchSensor.rssi} barWidth="w-1" barHeight="h-4" className="mb-0.5" />
                            <div className="text-sm font-medium text-gray-500 leading-none mt-0.5">
                                {(isLoRa ? (catchSensor.lorawanCatchSensor?.loraRssi || 0) : (catchSensor.rssi || 0))} dBm
                            </div>
                        </div>
                        {isLoRa && catchSensor.lorawanCatchSensor && (
                            <div className="flex items-center gap-1.5 ml-1">
                                <span className="text-[9px] font-extrabold text-[#1b3a2e]/60 bg-white/50 px-1.5 py-0.5 rounded border border-[#1b3a2e]/10 shadow-sm uppercase leading-none">SNR {Number(catchSensor.lorawanCatchSensor.snr).toFixed(1)}</span>
                                <span className="text-[9px] font-extrabold text-[#1b3a2e]/60 bg-white/50 px-1.5 py-0.5 rounded border border-[#1b3a2e]/10 shadow-sm uppercase leading-none">SF {catchSensor.lorawanCatchSensor.spreadingFactor}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatchCard;
