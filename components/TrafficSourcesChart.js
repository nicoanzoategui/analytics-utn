"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { CHART_COLORS } from "@/lib/chartColors";

export default function TrafficSourcesChart({ data, loading = false }) {
    if (loading) {
        return (
            <div className="bg-[#f5f5f5] p-6 rounded-xl border border-[#e0e0e0] h-[400px] flex items-center justify-center animate-pulse">
                <div className="h-full w-full bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#f5f5f5] p-6 rounded-xl border border-[#e0e0e0] h-[400px]">
            <h3 className="chart-title mb-6">Fuentes de tráfico</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="source"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 400 }}
                            width={120}
                        />
                        <Tooltip
                            cursor={{ fill: "transparent" }}
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e0e0e0",
                                borderRadius: "8px",
                                fontSize: "12px",
                            }}
                        />
                        <Bar dataKey="sessions" radius={[0, 4, 4, 0]} barSize={24}>
                            {data?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
