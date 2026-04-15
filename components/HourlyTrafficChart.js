"use client";
import InfoTooltip from "./InfoTooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function HourlyTrafficChart({ data, peaks, loading }) {
    if (loading) {
        return <div className="h-80 bg-white p-8 rounded-3xl border border-gray-100 animate-pulse" />;
    }

    const maxVal = Math.max(...data.map((d) => d.users), 0);

    return (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
            <InfoTooltip
                title="Tráfico por hora"
                measure="Distribución de usuarios a lo largo del día y detección de momentos pico."
                calculation="Dato directo de GA4 (activeUsers por hour) + Ordenar desc para top 3 picos."
            />
            <h3 className="chart-title mb-1">Tráfico por hora</h3>
            <div className="flex items-center space-x-2 mb-6">
                <span className="text-[10px] text-gray-400 font-medium">
                    Pico: <span className="text-black">{peaks?.[0]}h</span>
                </span>
                <span className="text-gray-200">|</span>
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap overflow-hidden">
                    Secundarios: {peaks?.slice(1, 3).map(p => `${p}h`).join(", ")}
                </span>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="hour"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fontWeight: 300, fill: '#9CA3AF' }}
                            interval={3}
                            tickFormatter={(val) => `${val}h`}
                        />
                        <Tooltip
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => {
                                const val = entry.users ?? 0;
                                const opacity =
                                    maxVal > 0 ? 0.2 + (val / maxVal) * 0.8 : 0.2;
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill="#2563eb"
                                        fillOpacity={opacity}
                                        className="transition-all duration-300"
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
