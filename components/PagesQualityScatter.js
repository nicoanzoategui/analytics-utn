"use client";

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { COLOR_1 } from '@/lib/chartColors';

export default function PagesQualityScatter({ data, loading }) {
    if (loading) {
        return <div className="h-80 bg-gray-50 animate-pulse rounded-2xl" />;
    }

    // Calculate medians for quadrants
    const views = data.map(d => d.views);
    const durations = data.map(d => d.duration);

    const medianViews = views.sort((a, b) => a - b)[Math.floor(views.length / 2)] || 0;
    const medianDuration = durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)] || 0;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 max-w-[240px]">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Página</p>
                    <p className="text-sm font-bold text-black mb-3 break-words">{item.name}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-gray-400">Vistas</p>
                            <p className="text-sm font-mono font-bold text-black">{item.views.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400">Tiempo</p>
                            <p className="text-sm font-mono font-bold text-black">{Math.round(item.duration)}s</p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[400px] w-full relative">
            {/* Quadrant Labels */}
            <div className="absolute top-0 right-0 p-2 text-[10px] font-black uppercase text-gray-300 pointer-events-none">Contenido Estrella</div>
            <div className="absolute top-0 left-0 p-2 text-[10px] font-black uppercase text-gray-200 pointer-events-none">Contenido Nicho</div>
            <div className="absolute bottom-12 right-0 p-2 text-[10px] font-black uppercase text-gray-200 pointer-events-none">Página de Rebote</div>
            <div className="absolute bottom-12 left-0 p-2 text-[10px] font-black uppercase text-gray-100 pointer-events-none opacity-50">Contenido Frío</div>

            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis
                        type="number"
                        dataKey="views"
                        name="Vistas"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fontWeight: 300, fill: '#9CA3AF' }}
                    >
                        <Label value="Volumen de Tráfico (Vistas)" position="bottom" offset={0} style={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 400 }} />
                    </XAxis>
                    <YAxis
                        type="number"
                        dataKey="duration"
                        name="Duración"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fontWeight: 300, fill: '#9CA3AF' }}
                    >
                        <Label value="Tiempo de Permanencia (seg)" angle={-90} position="insideLeft" style={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 400 }} />
                    </YAxis>
                    <ZAxis range={[50, 400]} />
                    <Tooltip content={<CustomTooltip />} />

                    <ReferenceLine x={medianViews} stroke="#f3f4f6" strokeDasharray="3 3" />
                    <ReferenceLine y={medianDuration} stroke="#f3f4f6" strokeDasharray="3 3" />

                    <Scatter name="Páginas" data={data} fill={COLOR_1} fillOpacity={0.6} stroke="#ffffff" strokeWidth={2} />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
