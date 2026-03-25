"use client";

import { useState, useEffect, useCallback } from "react";
import BehaviorHeatmap from "@/components/BehaviorHeatmap";
import HourlyTrafficChart from "@/components/HourlyTrafficChart";
import DayOfWeekChart from "@/components/DayOfWeekChart";
import DeviceQualityTable from "@/components/DeviceQualityTable";
import DeviceTypePie from "@/components/DeviceTypePie";
import OperatingSystemsTable from "@/components/OperatingSystemsTable";
import BrowsersBarChart from "@/components/BrowsersBarChart";
import ScreenResolutionsTable from "@/components/ScreenResolutionsTable";
import { AlertCircle, Clock, Monitor, Smartphone, Layout, MousePointer2 } from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";

export default function TabComportamiento({ days, segment, startDate: customStartDate, endDate: customEndDate }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [heatmapData, setHeatmapData] = useState([]);
    const [hourlyData, setHourlyData] = useState(null);
    const [dowData, setDowData] = useState([]);
    const [deviceQuality, setDeviceQuality] = useState([]);

    // New analysis states
    const [devicesData, setDevicesData] = useState([]);
    const [osData, setOsData] = useState([]);
    const [browsersData, setBrowsersData] = useState([]);
    const [resolutionsData, setResolutionsData] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const dateParams = customStartDate && customEndDate 
                ? `startDate=${customStartDate}&endDate=${customEndDate}`
                : `days=${days}`;
            const params = `?${dateParams}&segment=${segment}`;
            
            const endpoints = [
                `/api/analytics/patron-estudio${params}`,
                `/api/analytics/horas${params}`,
                `/api/analytics/diasemana${params}`,
                `/api/analytics/dispositivos-calidad${params}`,
                `/api/analytics/dispositivos${params}`,
                `/api/analytics/sistemas-operativos${params}`,
                `/api/analytics/navegadores${params}`,
                `/api/analytics/resoluciones${params}`,
            ];

            const responses = await Promise.all(endpoints.map(ep => fetch(ep)));

            if (responses.some(res => !res.ok)) {
                throw new Error("Error al cargar datos de comportamiento Expandido");
            }

            const [
                dataHeatmap, dataHoras, dataDow, dataQuality,
                dataDevices, dataOS, dataBrowsers, dataResolutions
            ] = await Promise.all(responses.map(res => res.json()));

            setHeatmapData(dataHeatmap);
            setHourlyData(dataHoras);
            setDowData(dataDow);
            setDeviceQuality(dataQuality);

            setDevicesData(dataDevices);
            setOsData(dataOS);
            setBrowsersData(dataBrowsers);
            setResolutionsData(dataResolutions);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [days, segment, customStartDate, customEndDate]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-red-100 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-black mb-2">Error en Comportamiento</h3>
                <p className="text-gray-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Heatmap Section */}
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                <InfoTooltip 
                    title="Heatmap hora × día"
                    measure="En qué momento de la semana hay más actividad."
                    calculation="GA4 → activeUsers agrupado por dimensiones hour y dayOfWeek"
                />
                <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Clock className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h3 className="chart-title">Patrón de actividad</h3>
                        <p className="text-gray-400 text-xs">Intensidad de usuarios por hora y día</p>
                    </div>
                </div>
                <BehaviorHeatmap data={heatmapData} loading={loading} />
            </section>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="relative">
                    {/* HourlyTrafficChart handles its own card wrapper and tooltip */}
                    <HourlyTrafficChart
                        data={hourlyData?.stats || []}
                        peaks={hourlyData?.peaks}
                        loading={loading}
                    />
                </div>
                <div className="relative">
                    {/* DayOfWeekChart handles its own card wrapper and tooltip */}
                    <DayOfWeekChart data={dowData} loading={loading} />
                </div>
            </div>

            {/* Device Analysis Header - New Block */}
            <div className="pt-6 border-t border-gray-100 mt-12">
                <div className="mb-0">
                    <h2 className="chart-title mb-2">Análisis de dispositivos</h2>
                    <p className="text-gray-400 text-sm">Configuración técnica y hardware de los usuarios</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Device Type Pie */}
                <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                    <InfoTooltip 
                        title="Dispositivos (torta)"
                        measure="Desde qué tipo de dispositivo acceden los usuarios."
                        calculation="GA4 → activeUsers agrupado por dimensión deviceCategory"
                    />
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Smartphone className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h3 className="chart-title">Distribución</h3>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Tipos de hardware</p>
                        </div>
                    </div>
                    <DeviceTypePie data={devicesData} loading={loading} />
                </section>

                {/* Operating Systems */}
                <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                    <InfoTooltip 
                        title="Sistema operativo (tabla)"
                        measure="Qué sistemas operativos usan los visitantes."
                        calculation="GA4 → activeUsers agrupado por deviceCategory + operatingSystem"
                    />
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Monitor className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h3 className="chart-title">Sistemas Operativos</h3>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Top 10 por usuarios</p>
                        </div>
                    </div>
                    <OperatingSystemsTable data={osData} loading={loading} />
                </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Browsers Chart */}
                <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                    <InfoTooltip 
                        title="Navegadores (barras)"
                        measure="Qué navegadores usan los visitantes."
                        calculation="GA4 → activeUsers agrupado por dimensión browser"
                    />
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <MousePointer2 className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h3 className="chart-title">Navegadores</h3>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Cuota de uso (Top 6)</p>
                        </div>
                    </div>
                    <BrowsersBarChart data={browsersData} loading={loading} />
                </section>

                {/* Screen Resolutions */}
                <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                    <InfoTooltip 
                        title="Resoluciones de pantalla (tabla)"
                        measure="Con qué resolución de pantalla acceden los usuarios."
                        calculation="GA4 → activeUsers agrupado por dimensión screenResolution"
                        interpretation="≥1920px = Full HD/4K | ≥1280px = HD | ≥768px = Tablet | <768px = Mobile"
                    />
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Layout className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h3 className="chart-title">Resoluciones</h3>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Clasificación de pantalla</p>
                        </div>
                    </div>
                    <ScreenResolutionsTable data={resolutionsData} loading={loading} />
                </section>
            </div>

            {/* Existing Quality Table */}
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                <InfoTooltip 
                    title="Calidad por dispositivo (tabla)"
                    measure="Si la experiencia varía según el dispositivo usado."
                    calculation="GA4 → activeUsers, averageSessionDuration, screenPageViewsPerSession, engagementRate agrupados por deviceCategory"
                    interpretation="Alerta: engagementRate <40% o avgDuration <60s indica mala experiencia en ese dispositivo"
                />
                <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Monitor className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h3 className="chart-title">Calidad por dispositivo</h3>
                        <p className="text-gray-400 text-xs">Métricas de interacción comparativas</p>
                    </div>
                </div>
                <DeviceQualityTable data={deviceQuality} loading={loading} />
            </section>
        </div>
    );
}


