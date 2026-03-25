"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { CHART_COLORS } from "@/lib/chartColors";

export default function DeviceTypePie({ data, loading }) {
    if (loading) {
        return <div className="h-[300px] w-full bg-gray-50 animate-pulse rounded-2xl" />;
    }

    const total = data.reduce((acc, current) => acc + current.activeUsers, 0);
    const chartData = data.map(item => ({
        name: item.device,
        value: item.activeUsers,
        percent: total > 0 ? ((item.activeUsers / total) * 100).toFixed(1) : 0
    }));

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#fff",
                            borderRadius: "16px",
                            border: "1px solid #f3f4f6",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            padding: "8px 12px"
                        }}
                        itemStyle={{ color: "#000", fontWeight: "bold", fontSize: "12px" }}
                        formatter={(value) => [`${value.toLocaleString()} usuarios`, "Usuarios"]}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry) => (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                                {value} ({entry.payload.percent}%)
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
