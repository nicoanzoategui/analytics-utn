"use client";

import { Smartphone, Monitor, Tablet } from "lucide-react";

export default function OperatingSystemsTable({ data, loading }) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-gray-50 animate-pulse rounded-lg" />
                <div className="h-32 bg-gray-50 animate-pulse rounded-xl" />
            </div>
        );
    }

    const totalUsers = data.reduce((acc, current) => acc + current.activeUsers, 0);

    const getDeviceIcon = (type) => {
        const t = type.toLowerCase();
        if (t.includes("mobile")) return <Smartphone className="w-3 h-3 text-gray-400" />;
        if (t.includes("tablet")) return <Tablet className="w-3 h-3 text-gray-400" />;
        return <Monitor className="w-3 h-3 text-gray-400" />;
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="pb-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sistema Operativo</th>
                        <th className="pb-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tipo</th>
                        <th className="pb-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Usuarios</th>
                        <th className="pb-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">% Total</th>
                    </tr>
                </thead>
                <tbody className="space-y-2">
                    {data.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 rounded-xl">
                            <td className="py-4 px-2">
                                <span className="text-sm font-bold text-black">{item.os}</span>
                            </td>
                            <td className="py-4 px-2">
                                <div className="flex items-center justify-center">
                                    <div className="p-1 px-2 border border-gray-100 rounded-lg group-hover:border-gray-200 transition-all flex items-center space-x-1">
                                        {getDeviceIcon(item.type)}
                                        <span className="text-[10px] uppercase font-bold text-gray-500">{item.type}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 px-2 text-right font-mono text-sm text-black">
                                {item.activeUsers.toLocaleString()}
                            </td>
                            <td className="py-4 px-2 text-right">
                                <span className="text-sm font-bold text-black opacity-40">
                                    {((item.activeUsers / totalUsers) * 100).toFixed(1)}%
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
