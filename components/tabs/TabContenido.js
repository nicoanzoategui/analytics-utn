"use client";

import { useState, useEffect, useCallback } from "react";
import CourseTypeChart from "@/components/CourseTypeChart";
import CategoryRankingChart from "@/components/CategoryRankingChart";
import PanelSectionsChart from "@/components/PanelSectionsChart";
import TopCursosTable from "@/components/TopCursosTable";
import { AlertCircle } from "lucide-react";
import LandingComparisonBlock from "@/components/LandingComparisonBlock";
import CursosConversionBlock from "@/components/CursosConversionBlock";


export default function TabContenido({ days, segment, startDate: customStartDate, endDate: customEndDate }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [pagesBasic, setPagesBasic] = useState([]);
    const [topCursos, setTopCursos] = useState([]);
    const [cursoConversion, setCursoConversion] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const dateParams = customStartDate && customEndDate 
                ? `startDate=${customStartDate}&endDate=${customEndDate}`
                : `days=${days}`;
            const params = `?${dateParams}&segment=${segment}`;

            const [resBasic, resTopCursos, resLandingCursos] =
                await Promise.all([
                    fetch(`/api/analytics/paginas${params}`),
                    fetch(`/api/analytics/top-cursos${params}`),
                    fetch(`/api/analytics/landing-cursos${params}`),
                ]);

            if (!resBasic.ok || !resTopCursos.ok || !resLandingCursos.ok) {
                throw new Error("Error al cargar datos de contenido");
            }

            const [dataBasic, dataTopCursos, dataLandingCursos] =
                await Promise.all([
                    resBasic.json(),
                    resTopCursos.json(),
                    resLandingCursos.json(),
                ]);

            setPagesBasic(dataBasic);
            setTopCursos(Array.isArray(dataTopCursos) ? dataTopCursos : []);
            setCursoConversion(
                dataLandingCursos && !dataLandingCursos.error
                    ? dataLandingCursos
                    : null,
            );
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
            {segment === "panel" ? (
                <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                    <PanelSectionsChart
                        data={pagesBasic}
                        loading={loading}
                    />
                </section>
            ) : (
                <>
                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                        <CourseTypeChart
                            data={pagesBasic}
                            loading={loading}
                        />
                    </section>
                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                        <CategoryRankingChart
                            data={pagesBasic}
                            loading={loading}
                            days={days}
                            segment={segment}
                            startDate={customStartDate}
                            endDate={customEndDate}
                        />
                    </section>
                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                        <TopCursosTable data={topCursos} loading={loading} />
                    </section>
                </>
            )}

            {/* Landing Comparison Block (Conversiones) */}
            <LandingComparisonBlock segment={segment} />
            <CursosConversionBlock
                data={cursoConversion}
                loading={loading}
                days={days}
                segment={segment}
            />
        </div>
    );
}

