"use client";

import { AlertTriangle, Clock, Smartphone, Monitor as MonitorIcon, Tablet } from "lucide-react";

export default function DeviceQualityTable({ data, loading }) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-gray-50 animate-pulse rounded-lg" />
                <div className="h-32 bg-gray-50 animate-pulse rounded-xl" />
            </div>
        );
    }

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    const getDeviceIcon = (device) => {
        const d = device.toLowerCase();
        if (d.includes("mobile")) return <Smartphone className="w-4 h-4" />;
        if (d.includes("tablet")) return <Tablet className="w-4 h-4" />;
        return <MonitorIcon className="w-4 h-4" />;
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dispositivo</th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Usuarios</th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Duración Prom.</th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Páginas/Sesión</th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Engagement</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, idx) => {
                        const lowEngagement = item.engagementRate < 0.4;
                        const lowDuration = item.averageSessionDuration < 60;

                        return (
                            <tr key={idx} className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                <td className="py-5 px-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-white border border-gray-100 rounded-lg group-hover:border-gray-200 shadow-sm transition-all">
                                            {getDeviceIcon(item.device)}
                                        </div>
                                        <span className="font-bold text-black capitalize">{item.device}</span>
                                    </div>
                                </td>
                                <td className="py-5 px-2 text-right font-medium text-black">
                                    {item.activeUsers.toLocaleString()}
                                </td>
                                <td className="py-5 px-2 text-right font-medium">
                                    <div className={`flex items-center justify-end space-x-1 ${lowDuration ? 'text-red-500' : 'text-black'}`}>
                                        <Clock className="w-3 h-3" />
                                        <span>{formatDuration(item.averageSessionDuration)}</span>
                                    </div>
                                </td>
                                <td className="py-5 px-2 text-right font-medium text-black">
                                    {item.screenPageViewsPerSession.toFixed(1)}
                                </td>
                                <td className="py-5 px-2 text-right font-medium">
                                    <div className="flex flex-col items-end">
                                        <div className={`flex items-center space-x-1 ${(lowEngagement || lowDuration) ? 'text-red-500' : 'text-black'}`}>
                                            {(lowEngagement || lowDuration) && <AlertTriangle className="w-3 h-3" />}
                                            <span>{(item.engagementRate * 100).toFixed(1)}%</span>
                                        </div>
                                        {(lowEngagement || lowDuration) && (
                                            <span className="text-[8px] uppercase font-black tracking-tighter text-red-400 mt-1">Check UX</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
