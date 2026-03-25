"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { COLOR_1, COLOR_2 } from "@/lib/chartColors";

export default function UserTimelineChart({ data, loading = false }) {
    if (loading) {
        return (
            <div className="h-[400px] w-full bg-gray-50 flex items-center justify-center animate-pulse rounded-3xl" />
        );
    }

    const formatData = data?.map((item) => {
        const year = item.date.substring(0, 4);
        const month = item.date.substring(4, 6);
        const day = item.date.substring(6, 8);
        return {
            ...item,
            formattedDate: `${day}/${month}`,
        };
    });

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formatData}>
                    <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLOR_1} stopOpacity={0.12}/>
                            <stop offset="95%" stopColor={COLOR_1} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLOR_2} stopOpacity={0.12}/>
                            <stop offset="95%" stopColor={COLOR_2} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                        dataKey="formattedDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 300 }}
                        dy={10}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 300 }}
                        dx={-10}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#fff",
                            border: "none",
                            borderRadius: "16px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            fontSize: "12px",
                            padding: "12px"
                        }}
                    />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        formatter={(value) => (
                            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 ml-1">
                                {value === 'activeUsers' ? 'Activos' : 'Nuevos'}
                            </span>
                        )}
                    />
                    <Area
                        type="monotone"
                        dataKey="activeUsers"
                        stroke={COLOR_1}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorUsers)"
                        animationDuration={1500}
                    />
                    <Area
                        type="monotone"
                        dataKey="newUsers"
                        stroke={COLOR_2}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fillOpacity={1}
                        fill="url(#colorNew)"
                        animationDuration={2000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
