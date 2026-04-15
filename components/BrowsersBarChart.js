"use client";

import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function BrowsersBarChart({ data, loading }) {
    if (loading) {
        return <div className="h-[300px] w-full bg-gray-50 animate-pulse rounded-2xl" />;
    }

    const maxVal = Math.max(
        ...data.map((d) => d.users || d.value || d.activeUsers || 0),
        0
    );

    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="browser"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fontWeight: 300, fill: "#9CA3AF" }}
                        width={100}
                    />
                    <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{
                            backgroundColor: "#fff",
                            borderRadius: "16px",
                            border: "1px solid #f3f4f6",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            padding: "8px 12px"
                        }}
                        itemStyle={{ color: "#000", fontWeight: "bold", fontSize: "12px" }}
                        formatter={(value) => [value.toLocaleString(), "Usuarios"]}
                    />
                    <Bar
                        dataKey="activeUsers"
                        radius={[0, 10, 10, 0]}
                        barSize={20}
                        animationBegin={0}
                        animationDuration={1500}
                        label={{ position: 'right', fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF', formatter: (val) => val.toLocaleString() }}
                    >
                        {data.map((entry, index) => {
                            const val =
                                entry.users || entry.value || entry.activeUsers || 0;
                            const opacity =
                                maxVal > 0 ? 0.2 + (val / maxVal) * 0.8 : 0.2;
                            return (
                                <Cell
                                    key={`cell-${index}`}
                                    fill="#2563eb"
                                    fillOpacity={opacity}
                                />
                            );
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
