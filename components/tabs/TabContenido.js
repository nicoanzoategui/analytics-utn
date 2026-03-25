"use client";

import { useState, useEffect, useCallback } from "react";
import PagesReadingTable from "@/components/PagesReadingTable";
import PagesQualityScatter from "@/components/PagesQualityScatter";
import DetailedPagesScoreTable from "@/components/DetailedPagesScoreTable";
import { AlertCircle, FileText, Target } from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";
import LandingComparisonBlock from "@/components/LandingComparisonBlock";


export default function TabContenido({ days, segment, startDate: customStartDate, endDate: customEndDate }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [pagesBasic, setPagesBasic] = useState([]);
    const [pagesScatter, setPagesScatter] = useState([]);
    const [pagesDetailed, setPagesDetailed] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const dateParams = customStartDate && customEndDate 
                ? `startDate=${customStartDate}&endDate=${customEndDate}`
                : `days=${days}`;
            const params = `?${dateParams}&segment=${segment}`;

            const [resBasic, resScatter, resDetailed] = await Promise.all([
                fetch(`/api/analytics/paginas${params}`),
                fetch(`/api/analytics/paginas-calidad${params}`),
                fetch(`/api/analytics/paginas-detalle${params}`),
            ]);

            if (!resBasic.ok || !resScatter.ok || !resDetailed.ok) {
                throw new Error("Error al cargar datos de contenido");
            }

            const [dataBasic, dataScatter, dataDetailed] = await Promise.all([
                resBasic.json(),
                resScatter.json(),
                resDetailed.json(),
            ]);

            setPagesBasic(dataBasic);
            setPagesScatter(dataScatter);
            setPagesDetailed(dataDetailed);
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
                <h3 className="text-lg font-bold text-black mb-2">Error en Contenido</h3>
                <p className="text-gray-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Top Pages with Reading Category */}
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                <InfoTooltip 
                    title="Páginas más visitadas (tabla)"
                    measure="Qué páginas reciben más tráfico y nivel de consumo del contenido según tiempo en página."
                    calculation="GA4 → screenPageViews y averageSessionDuration agrupados por pagePath."
                    interpretation="CASE WHEN avgDuration: <60s = rebote rápido | 60-180s = visita corta | 180-600s = lectura normal | >600s = estudio profundo"
                />
                <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <FileText className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h3 className="chart-title">
                            {segment === "panel" ? "Secciones más usadas" : "Páginas más visitadas"}
                        </h3>
                        {segment === "panel" ? (
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-tight">Tiempo en cada sección del panel</p>
                        ) : (
                            <p className="text-gray-400 text-xs text-balance">Categorización de lectura según tiempo de permanencia</p>
                        )}
                    </div>
                </div>
                <PagesReadingTable data={pagesBasic} loading={loading} segment={segment} />
            </section>

            {/* Scatter Plot - Hidden for panel segment */}
            {segment !== "panel" && (
                <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                    <InfoTooltip 
                        title="Scatter plot caliente vs frío"
                        measure="Clasifica páginas según tráfico y tiempo de permanencia en 4 cuadrantes."
                        calculation="GA4 → screenPageViews (eje X) vs averageSessionDuration (eje Y) por pagePath."
                        interpretation="Cuadrantes: estrella / rebote / nicho / frío según posición relativa al promedio."
                    />
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Target className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h3 className="chart-title">Rendimiento de páginas</h3>
                            <p className="text-gray-400 text-xs">Vistas vs Duración: Detección de contenido estrella y de rebote</p>
                        </div>
                    </div>
                    <PagesQualityScatter data={pagesScatter} loading={loading} />
                </section>
            )}

            {/* Detailed Table with Score */}
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden whitespace-nowrap relative">
                <InfoTooltip 
                    title="Páginas detalle (tabla)"
                    measure="Vista completa del rendimiento de cada página y puntuación de calidad (Score)."
                    calculation="(views/maxViews × 50) + (duration/maxDuration × 50), normalizado a 100."
                    interpretation="≥70 = estrella | 40-70 = regular | <40 = frío."
                />
                <h3 className="text-xl font-bold text-black mb-2">Detalle con Score de Calidad</h3>
                <p className="text-gray-400 text-xs mb-8">Top 20 páginas con puntuación de rendimiento relativa</p>
                <DetailedPagesScoreTable data={pagesDetailed} loading={loading} />
            </section>

            {/* Landing Comparison Block (Conversiones) */}
            <LandingComparisonBlock segment={segment} />
        </div>
    );
}


