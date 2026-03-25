"use client";

import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/MetricCard";
import UserTimelineChart from "@/components/UserTimelineChart";
import RealtimeCountriesTable from "@/components/RealtimeCountriesTable";
import { AlertCircle, Activity, Users, Target } from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";

export default function TabResumen({ days, segment, startDate: customStartDate, endDate: customEndDate }) {
    const [loading, setLoading] = useState(true);
    const [realtimeLoading, setRealtimeLoading] = useState(true);
    const [error, setError] = useState(null);

    const [resumen, setResumen] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [realtime, setRealtime] = useState(0);
    const [paises, setPaises] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const dateParams = customStartDate && customEndDate 
                ? `startDate=${customStartDate}&endDate=${customEndDate}`
                : `days=${days}`;
            const params = `?${dateParams}&segment=${segment}`;
            
            const [resResumen, resTimeline] = await Promise.all([
                fetch(`/api/analytics/resumen${params}`),
                fetch(`/api/analytics/timeline${params}`)
            ]);

            if (!resResumen.ok || !resTimeline.ok) {
                const errData = await resResumen.json().catch(() => ({}));
                throw new Error(errData.details || "Error al cargar datos del resumen");
            }

            const [dataResumen, dataTimeline] = await Promise.all([
                resResumen.json(),
                resTimeline.json()
            ]);

            setResumen(dataResumen);
            setTimeline(dataTimeline);

        } catch (err) {
            console.error("Fetch Data Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [days, segment, customStartDate, customEndDate]);

    const fetchRealtime = useCallback(async () => {
        setRealtimeLoading(true);
        try {
            const res = await fetch(`/api/analytics/realtime?segment=${segment}`);
            if (!res.ok) throw new Error("Error realtime");
            const data = await res.json();
            setRealtime(data.activeUsers);
            setPaises(data.countries || []);
        } catch (err) {
            console.error("Fetch Realtime Error:", err);
        } finally {
            setRealtimeLoading(false);
        }
    }, [segment]);

    useEffect(() => {
        fetchData();
        fetchRealtime();
        const interval = setInterval(fetchRealtime, 30000);
        return () => clearInterval(interval);
    }, [fetchData, fetchRealtime]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-red-100 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-black mb-2">Error en Resumen</h3>
                <p className="text-gray-500">{error}</p>
                <button 
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Usuarios activos"
                    value={resumen?.activeUsers?.value || 0}
                    prevValue={resumen?.activeUsers?.prevValue || 0}
                    loading={loading}
                    info={{
                        title: "Usuarios activos",
                        measure: "Usuarios que tuvieron al menos una sesión en el período.",
                        calculation: "Dato directo de GA4 → métrica activeUsers"
                    }}
                />
                <MetricCard
                    title="Usuarios nuevos"
                    value={resumen?.newUsers?.value || 0}
                    prevValue={resumen?.newUsers?.prevValue || 0}
                    loading={loading}
                    info={{
                        title: "Usuarios nuevos",
                        measure: "Usuarios que visitaron la plataforma por primera vez.",
                        calculation: "Dato directo de GA4"
                    }}
                />
                <MetricCard
                    title="Duración media"
                    value={resumen?.avgSessionDuration?.value || 0}
                    prevValue={resumen?.avgSessionDuration?.prevValue || 0}
                    type="duration"
                    loading={loading}
                    info={{
                        title: "Duración media",
                        measure: "Tiempo promedio que un usuario pasa en la plataforma.",
                        calculation: "GA4 → userEngagementDuration / activeUsers"
                    }}
                />
                <MetricCard
                    title="Eventos clave"
                    value={resumen?.keyEvents?.value || 0} // Fix field name to keyEvents (was conversions)
                    prevValue={resumen?.keyEvents?.prevValue || 0}
                    loading={loading}
                    info={{
                        title: "Eventos clave",
                        measure: "Acciones importantes registradas (clicks, descargas, etc).",
                        calculation: "GA4 → sumatoria de eventos marcados como conversiones"
                    }}
                />
            </div>

            {/* Calculated Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <InfoTooltip 
                        title="Tasa de nuevos usuarios"
                        measure="Relación entre usuarios que entran por primera vez y el total."
                        calculation="(newUsers / activeUsers) × 100"
                        interpretation=">80% = fuerte adquisición | <30% = base de usuarios consolidada"
                    />
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-gray-50 rounded-2xl">
                            <Users className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h3 className="chart-title">Tasa de nuevos usuarios</h3>
                            <p className="text-gray-400 text-xs">Composición de la audiencia</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <div className="text-4xl font-black text-black tracking-tighter mb-1">
                                {loading ? "..." : `${resumen?.newUsersRate?.value.toFixed(1)}%`}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${resumen?.newUsersRate?.value >= (resumen?.newUsersRate?.prevValue || 0) ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}>
                                    {resumen?.newUsersRate?.value >= (resumen?.newUsersRate?.prevValue || 0) ? "+" : ""}{(resumen?.newUsersRate?.value - (resumen?.newUsersRate?.prevValue || 0)).toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">vs prev.</span>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className={`text-xs font-black uppercase tracking-widest ${resumen?.newUsersRate?.value > 80 ? 'text-black' : 'text-gray-400'}`}>
                                {loading ? "" : (resumen?.newUsersRate?.value > 80 ? "Fuerte Adquisición" : "Base Consolidada")}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Status del crecimiento</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative group overflow-hidden">
                    <InfoTooltip 
                        title="Engagement score"
                        measure="Puntuación compuesta de la intensidad de uso de la plataforma."
                        calculation="Promedio ponderado: (views/user × 0.4) + (avgDuration × 0.6), normalizado."
                    />
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-gray-50 rounded-2xl">
                            <Target className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h3 className="chart-title">Engagement score</h3>
                            <p className="text-gray-400 text-xs">Intensidad de uso (0-100)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <div className="text-4xl font-black text-black tracking-tighter mb-1">
                                {loading ? "..." : `${resumen?.engagementScore?.value}`}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${resumen?.engagementScore?.value >= (resumen?.engagementScore?.prevValue || 0) ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}>
                                    {resumen?.engagementScore?.value >= (resumen?.engagementScore?.prevValue || 0) ? "+" : ""}{(resumen?.engagementScore?.value - (resumen?.engagementScore?.prevValue || 0)).toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">vs prev.</span>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center space-x-2 mb-1">
                                {loading ? null : (
                                    <>
                                        <div className={`h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden`}>
                                            <div className="h-full bg-black transition-all duration-1000" style={{ width: `${resumen?.engagementScore?.value}%` }} />
                                        </div>
                                        <span className="text-[10px] font-black text-black">{resumen?.engagementScore?.value}</span>
                                    </>
                                )}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">
                                {resumen?.engagementScore?.value >= 70 ? "Excelente" : resumen?.engagementScore?.value >= 40 ? "Promedio" : "Bajo"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                    <InfoTooltip 
                        title="Gráfico de usuarios por día"
                        measure="Evolución diaria de usuarios activos y nuevos en el período."
                        calculation="GA4 → activeUsers y newUsers agrupados por dimensión date"
                    />
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="chart-title">Actividad del período</h3>
                            <p className="text-gray-400 text-xs">Usuarios activos vs nuevos</p>
                        </div>
                    </div>
                    <UserTimelineChart data={timeline} loading={loading} />
                </div>
                <div className="space-y-8">
                    <div className="bg-black p-8 rounded-3xl border border-zinc-800 shadow-xl relative">
                        <InfoTooltip 
                            title="Tarjeta tiempo real"
                            measure="Usuarios navegando la plataforma en los últimos 30 minutos."
                            calculation="GA4 runRealtimeReport → métrica activeUsers. Se actualiza cada 30 segundos."
                        />
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white">Tiempo Real</h3>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">AHORA</p>
                            </div>
                            <div className="relative">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                            </div>
                        </div>

                        {realtimeLoading && realtime === 0 ? (
                            <div className="h-16 w-full bg-zinc-900 animate-pulse rounded-xl" />
                        ) : (
                            <div className="mb-10">
                                <div className="text-7xl font-black text-white tracking-tighter mb-2">
                                    {realtime}
                                </div>
                                <div className="flex items-center space-x-2 text-zinc-400">
                                    <Activity className="w-4 h-4" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">usuarios activos</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <InfoTooltip 
                            title="Países en tiempo real"
                            measure="De dónde vienen los usuarios activos en este momento."
                            calculation="Top países según el reporte de tiempo real de GA4."
                        />
                        <RealtimeCountriesTable data={paises} loading={realtimeLoading} />
                    </div>
                </div>
            </div>
        </div>
    );
}
