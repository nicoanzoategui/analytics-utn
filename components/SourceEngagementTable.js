"use client";

import { TrendingUp, Clock, MousePointer2, FileText } from "lucide-react";

export default function SourceEngagementTable({ data, loading }) {
    if (loading) {
        return <div className="h-48 bg-gray-50 animate-pulse rounded-2xl" />;
    }

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fuente de Tráfico</th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap overflow-hidden">Sesiones</th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap overflow-hidden">Duración Prom.</th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap overflow-hidden">Engagement</th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap overflow-hidden">Págs/Sesión</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, idx) => (
                        <tr key={idx} className="group border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-2">
                                <span className="text-sm font-bold text-black uppercase tracking-tight">{item.source}</span>
                            </td>
                            <td className="py-4 px-2 text-right">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-mono text-black font-medium">{(item.sessions || 0).toLocaleString()}</span>
                                </div>
                            </td>
                            <td className="py-4 px-2 text-right">
                                <div className="flex items-center justify-end space-x-1 text-sm font-medium text-black">
                                    <Clock className="w-3 h-3 text-gray-300" />
                                    <span>{formatDuration(item.averageSessionDuration || 0)}</span>
                                </div>
                            </td>
                            <td className="py-4 px-2 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                    <TrendingUp className="w-3 h-3 text-black" />
                                    <span className="text-sm font-bold text-black">{((item.engagementRate || 0) * 100).toFixed(1)}%</span>
                                </div>
                            </td>
                            <td className="py-4 px-2 text-right">
                                <div className="flex items-center justify-end space-x-1 text-sm font-medium text-gray-500">
                                    <FileText className="w-3 h-3 text-gray-300" />
                                    <span>{(item.screenPageViewsPerSession || 0).toFixed(1)}</span>
                                </div>
                            </td>
                        </tr>
                    ))}

                </tbody>
            </table>
        </div>
    );
}
