"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { COLOR_1, COLOR_2 } from "@/lib/chartColors";

export default function RetentionAcquisitionChart({ data, ratio, loading }) {
    if (loading) {
        return <div className="h-80 bg-gray-50 animate-pulse rounded-2xl" />;
    }

    const formatDate = (dateStr) => {
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(6, 8);
        return `${day}/${month}`;
    };

    const isLowRetention = ratio < 1.1;

    return (
        <div className="space-y-6">
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fontWeight: 300, fill: '#9CA3AF' }}
                            tickFormatter={formatDate}
                            interval={Math.ceil(data.length / 7)}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 300, fill: '#9CA3AF' }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={formatDate}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 600, paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="activeUsers" name="Activos" stroke={COLOR_1} strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="newUsers" name="Nuevos" stroke={COLOR_2} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className={`flex items-center space-x-4 p-4 rounded-2xl transition-all ${isLowRetention ? 'bg-red-50/50' : 'bg-green-50/50'}`}>
                <div className={`p-2 rounded-lg ${isLowRetention ? 'bg-red-500' : 'bg-green-500'}`}>
                    {isLowRetention ? <AlertCircle className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-black tracking-tight">Índice de Retención: {ratio}</span>
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isLowRetention ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {ratio > 1.5 ? "Muy buena retención" : ratio >= 1.1 ? "Retención moderada" : "Baja retención"}
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 max-w-[500px]">
                        {isLowRetention
                            ? "La plataforma depende críticamente de usuarios nuevos — el crecimiento orgánico recurrente es débil."
                            : "Buen balance entre adquisición y recurrencia — la comunidad está volviendo a la plataforma."}
                    </p>
                </div>
            </div>
        </div>
    );
}
