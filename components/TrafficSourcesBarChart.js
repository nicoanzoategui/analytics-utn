"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { COLOR_1 } from '@/lib/chartColors';

export default function TrafficSourcesBarChart({ data, loading }) {
    if (loading) {
        return <div className="h-64 bg-gray-50 animate-pulse rounded-2xl" />;
    }

    const sortedData = [...data].sort((a, b) => b.sessions - a.sessions);

    return (
        <div className="h-64 h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    layout="vertical"
                    data={sortedData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="source"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fontWeight: 300, fill: '#6B7280' }}
                        width={100}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f9fafb' }}
                    />
                    <Bar dataKey="sessions" fill={COLOR_1} radius={[0, 4, 4, 0]} barSize={20}>
                        <LabelList dataKey="sessions" position="right" style={{ fontSize: '10px', fill: '#9CA3AF', fontWeight: 400 }} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
