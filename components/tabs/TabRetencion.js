"use client";

import { useState, useEffect, useCallback } from "react";
import RetentionAcquisitionChart from "@/components/RetentionAcquisitionChart";
import TrafficSourcesBarChart from "@/components/TrafficSourcesBarChart";
import SourceEngagementTable from "@/components/SourceEngagementTable";
import CountryDistributionTable from "@/components/CountryDistributionTable";
import { AlertCircle, Repeat, Share2, Globe, ArrowRight } from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";


export default function TabRetencion({ days, segment, startDate: customStartDate, endDate: customEndDate }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [retentionData, setRetentionData] = useState(null);
    const [sourcesData, setSourcesData] = useState([]);
    const [engagementData, setEngagementData] = useState([]);
    const [countriesData, setCountriesData] = useState([]);
    const [conversionData, setConversionData] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = `/api/analytics`;
            const dateParams = customStartDate && customEndDate 
                ? `startDate=${customStartDate}&endDate=${customEndDate}`
                : `days=${days}`;
            const params = `?${dateParams}&segment=${segment}`;

            const requests = [
                fetch(`${baseUrl}/retencion${params}`),
                fetch(`${baseUrl}/fuentes${params}`),
                fetch(`${baseUrl}/fuentes-engagement${params}`),
                fetch(`${baseUrl}/paises${params}`),
            ];

            if (segment === "all") {
                requests.push(fetch(`${baseUrl}/conversion?${dateParams}`));
            }

            const responses = await Promise.all(requests);

            if (responses.some(res => !res.ok)) {
                throw new Error("Error al cargar datos de retención");
            }

            const jsonData = await Promise.all(responses.map(res => res.json()));

            setRetentionData(jsonData[0]);
            setSourcesData(jsonData[1]);
            setEngagementData(jsonData[2]);
            setCountriesData(jsonData[3]);
            if (segment === "all") {
                setConversionData(jsonData[4]);
            }
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
                <h3 className="text-lg font-bold text-black mb-2">Error en Retención</h3>
                <p className="text-gray-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Conversion Card (Only for All segment) */}
            {segment === "all" && conversionData && (
                <section className="bg-black text-white p-8 rounded-3xl border border-gray-800 shadow-xl overflow-hidden relative group">
                    <InfoTooltip 
                        title="Conversión web → panel"
                        measure="Qué % de visitantes de la web pública terminan entrando al panel."
                        calculation="(usuarios con segment=panel / usuarios con segment=public) × 100"
                    />
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowRight className="w-32 h-32 -rotate-45" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Conversión Cross-Segment</p>
                        <div className="flex flex-col md:flex-row md:items-end gap-6">
                            <div>
                                <h3 className="text-5xl font-bold tracking-tighter mb-2">
                                    {conversionData.conversionRate}%
                                </h3>
                                <p className="text-gray-400 text-sm max-w-md">
                                    de visitantes de la <span className="text-white font-medium">web pública</span> terminaron entrando al <span className="text-white font-medium">panel del alumno</span> en este período.
                                </p>
                            </div>
                            <div className="flex gap-8 border-l border-gray-800 pl-8 h-fit self-center md:self-end">
                                <div>
                                    <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Web Pública</p>
                                    <p className="text-xl font-bold">{new Intl.NumberFormat().format(conversionData.publicUsers)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Panel</p>
                                    <p className="text-xl font-bold">{new Intl.NumberFormat().format(conversionData.panelUsers)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Retention vs Acquisition Section */}
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                <InfoTooltip 
                    title="Retención vs adquisición (gráfico)"
                    measure="Si la plataforma crece por retención o por nuevos usuarios constantemente. Incluye el Índice de Retención."
                    calculation="GA4 → activeUsers vs newUsers por fecha. Índice = activeUsers / newUsers (acumulado)."
                    interpretation=">1.5 = muy buena | 1.1-1.5 = moderada | <1.1 = baja retención"
                />
                <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Repeat className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h3 className="chart-title">Retención vs Adquisición</h3>
                        <p className="text-gray-400 text-xs text-balance">Comparativa de usuarios nuevos vs recurrentes</p>
                    </div>
                </div>
                <RetentionAcquisitionChart
                    data={retentionData?.timeline || []}
                    ratio={retentionData?.retentionIndex}
                    loading={loading}
                />
            </section>

            {/* Sources Logic */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                    <InfoTooltip 
                        title="Fuentes de tráfico (barras)"
                        measure="Por qué canal llegan los usuarios a la plataforma."
                        calculation="GA4 → sessions agrupadas por sessionDefaultChannelGroup"
                    />
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Share2 className="w-5 h-5 text-black" />
                        </div>
                        <h3 className="chart-title">Fuentes de tráfico</h3>
                    </div>
                    <TrafficSourcesBarChart data={sourcesData} loading={loading} />
                </section>

                <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                    <InfoTooltip 
                        title="Usuarios por país (tabla)"
                        measure="Distribución geográfica de los usuarios."
                        calculation="GA4 → activeUsers agrupado por dimensión country"
                    />
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Globe className="w-5 h-5 text-black" />
                        </div>
                        <h3 className="chart-title">Usuarios por país</h3>
                    </div>
                    <CountryDistributionTable data={countriesData} loading={loading} />
                </section>
            </div>

            {/* Engagement Table */}
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                <InfoTooltip 
                    title="Fuentes vs engagement (tabla)"
                    measure="Qué fuente de tráfico trae usuarios más comprometidos."
                    calculation="GA4 → sessions, averageSessionDuration, engagementRate agrupados por channel"
                />
                <h3 className="text-xl font-bold text-black mb-1">Fuente vs Engagement</h3>
                <p className="text-gray-400 text-xs mb-8">Rendimiento detallado por canal de adquisición</p>
                <SourceEngagementTable data={engagementData} loading={loading} />
            </section>
        </div>
    );
}


