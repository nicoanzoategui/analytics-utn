"use client";
import InfoTooltip from "./InfoTooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLOR_1 } from '@/lib/chartColors';

export default function DayOfWeekChart({ data, loading }) {
    if (loading) {
        return <div className="h-80 bg-white p-8 rounded-3xl border border-gray-100 animate-pulse" />;
    }

    return (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
            <InfoTooltip
                title="Usuarios por día de la semana"
                measure="Qué días de la semana tiene más actividad la plataforma."
                calculation="GA4 → sessions agrupadas por dimensión dayOfWeek"
            />
            <h3 className="chart-title mb-1">Sesiones por día</h3>
            <p className="text-gray-400 text-xs mb-8 overflow-hidden whitespace-nowrap">Actividad semanal del Centro de Elearning</p>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fontWeight: 300, fill: '#9CA3AF' }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar
                            dataKey="users"
                            fill={COLOR_1}
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
