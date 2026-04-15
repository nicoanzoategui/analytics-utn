"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, Repeat, Share2, BarChart3 } from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";

const SOURCE_LABELS = {
    "(direct)": "Directo",
    "(not set)": "Sin fuente",
    sfmc: "Email Marketing (Salesforce)",
    "frch.utn.edu.ar": "Portal UTN",
    "l.instagram.com": "Instagram",
    "ar.search.yahoo.com": "Yahoo",
    "chatgpt.com": "ChatGPT",
};

function cleanSourceName(name) {
    if (!name || typeof name !== "string") return "Sin fuente";
    const key = name.trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(SOURCE_LABELS, key)) {
        return SOURCE_LABELS[key];
    }
    return name.trim();
}

function formatDuration(seconds) {
    const s = Number(seconds) || 0;
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function engagementPct(rate) {
    const r = Number(rate) || 0;
    return r <= 1 ? r * 100 : r;
}

function engagementBadge(rate) {
    const pct = engagementPct(rate);
    if (pct >= 70) {
        return { label: "Alto", className: "bg-green-50 text-green-700" };
    }
    if (pct >= 50) {
        return { label: "Medio", className: "bg-yellow-50 text-yellow-700" };
    }
    return { label: "Bajo", className: "bg-red-50 text-red-700" };
}

export default function TabRetencion({
    days,
    segment,
    startDate: customStartDate,
    endDate: customEndDate,
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [retentionData, setRetentionData] = useState([]);
    const [engagementData, setEngagementData] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = `/api/analytics`;
            const dateParams =
                customStartDate && customEndDate
                    ? `startDate=${customStartDate}&endDate=${customEndDate}`
                    : `days=${days}`;
            const params = `?${dateParams}&segment=${segment}`;

            const [resRet, resFuentes, resEng] = await Promise.all([
                fetch(`${baseUrl}/retencion${params}`),
                fetch(`${baseUrl}/fuentes${params}`),
                fetch(`${baseUrl}/fuentes-engagement${params}`),
            ]);

            if (!resRet.ok || !resFuentes.ok || !resEng.ok) {
                throw new Error("Error al cargar datos de retención");
            }

            const [dataRet, , dataEng] = await Promise.all([
                resRet.json(),
                resFuentes.json(),
                resEng.json(),
            ]);

            const timeline = Array.isArray(dataRet)
                ? dataRet
                : dataRet?.timeline && Array.isArray(dataRet.timeline)
                  ? dataRet.timeline
                  : [];

            setRetentionData(timeline);
            setEngagementData(Array.isArray(dataEng) ? dataEng : []);
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

    const retentionStats = useMemo(() => {
        const timeline = retentionData || [];
        const totalActive = timeline.reduce(
            (s, d) => s + (Number(d.activeUsers) || 0),
            0,
        );
        const totalNew = timeline.reduce(
            (s, d) => s + (Number(d.newUsers) || 0),
            0,
        );
        const totalReturning = totalActive - totalNew;
        const retentionRate =
            totalActive > 0
                ? Math.round((totalReturning / totalActive) * 100)
                : 0;
        const newPct =
            totalActive > 0
                ? ((totalNew / totalActive) * 100).toFixed(1)
                : "0.0";
        return {
            totalActive,
            totalNew,
            totalReturning,
            retentionRate,
            newPct,
        };
    }, [retentionData]);

    const trafficByUsers = useMemo(() => {
        const list = (engagementData || []).map((row) => ({
            ...row,
            label: cleanSourceName(row.source),
            users: Number(row.users) || 0,
        }));
        return [...list].sort((a, b) => b.users - a.users).slice(0, 10);
    }, [engagementData]);

    const maxTrafficUsers = Math.max(
        ...trafficByUsers.map((r) => r.users),
        1,
    );

    const engagementSorted = useMemo(() => {
        return [...(engagementData || [])]
            .map((row) => ({
                ...row,
                label: cleanSourceName(row.source),
            }))
            .sort(
                (a, b) =>
                    engagementPct(b.engagementRate) -
                    engagementPct(a.engagementRate),
            );
    }, [engagementData]);

    const interpretRetention = () => {
        const r = retentionStats.retentionRate;
        if (r > 40) {
            return "Base consolidada — más del 40% de usuarios vuelve";
        }
        if (r > 20) {
            return "Retención moderada — hay oportunidad de mejorar";
        }
        return "Mayoría de tráfico nuevo — foco en adquisición";
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-red-100 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-black mb-2">
                    Error en Retención
                </h3>
                <p className="text-gray-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* SECCIÓN 1 — Nuevos vs Recurrentes */}
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                <InfoTooltip
                    title="Nuevos vs recurrentes"
                    measure="Suma diaria de usuarios activos y nuevos en el período (no son usuarios únicos globales del período)."
                    calculation="Recurrentes = Σ activeUsers − Σ newUsers. Tasa de retorno = recurrentes / activos × 100."
                />
                <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Repeat className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h3 className="chart-title">Nuevos vs Recurrentes</h3>
                        <p className="text-gray-400 text-xs text-balance">
                            Distribución del tráfico entre primera visita y
                            usuarios que vuelven
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-36 bg-gray-50 animate-pulse rounded-2xl" />
                        <div className="h-36 bg-gray-50 animate-pulse rounded-2xl" />
                    </div>
                ) : retentionStats.totalActive === 0 ? (
                    <p className="text-sm text-gray-400">
                        Sin datos de retención para este período
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                    Usuarios nuevos
                                </p>
                                <p className="text-4xl font-black tabular-nums text-black leading-none mb-2">
                                    {retentionStats.totalNew.toLocaleString()}
                                </p>
                                <p className="text-sm font-bold text-gray-600 mb-1">
                                    {retentionStats.newPct}%
                                </p>
                                <p className="text-xs text-gray-400 font-medium">
                                    Primer visita
                                </p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                    Usuarios recurrentes
                                </p>
                                <p className="text-4xl font-black tabular-nums text-black leading-none mb-2">
                                    {retentionStats.totalReturning.toLocaleString()}
                                </p>
                                <p className="text-sm font-bold text-gray-600 mb-1">
                                    {retentionStats.retentionRate}%
                                </p>
                                <p className="text-xs text-gray-400 font-medium">
                                    Volvieron a la plataforma
                                </p>
                            </div>
                        </div>
                        <p className="mt-6 text-sm text-gray-600 font-medium leading-relaxed">
                            {interpretRetention()}
                        </p>
                    </>
                )}
            </section>

            {/* SECCIÓN 2 — Fuentes de tráfico (barras) */}
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                <InfoTooltip
                    title="Fuentes de tráfico"
                    measure="Canales de adquisición con más usuarios activos."
                    calculation="GA4: activeUsers por sessionSource (top 10)."
                />
                <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Share2 className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h3 className="chart-title mb-1">
                            De dónde viene el tráfico
                        </h3>
                        <p className="text-gray-400 text-xs mb-6">
                            Top 10 fuentes por usuarios activos
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="h-40 bg-gray-50 animate-pulse rounded-xl" />
                ) : trafficByUsers.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        Sin datos de fuentes para este período
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {trafficByUsers.map((item, idx) => {
                            const opacity =
                                maxTrafficUsers > 0
                                    ? 0.2 +
                                      (item.users / maxTrafficUsers) * 0.8
                                    : 0.2;
                            return (
                                <li
                                    key={`src-${item.source}-${idx}`}
                                    className="flex flex-col gap-2"
                                >
                                    <span className="text-sm font-medium text-black break-words">
                                        {item.label}
                                    </span>
                                    <div className="flex items-center gap-3 w-full min-w-0">
                                        <div className="flex-1 min-w-0 h-8 rounded-md bg-[#f1f5f9] overflow-hidden">
                                            <div
                                                className="h-full rounded-md transition-all duration-300"
                                                style={{
                                                    width: `${(item.users / maxTrafficUsers) * 100}%`,
                                                    backgroundColor: "#2563eb",
                                                    opacity,
                                                }}
                                            />
                                        </div>
                                        <span className="shrink-0 text-right text-sm font-bold tabular-nums text-black whitespace-nowrap">
                                            {item.users.toLocaleString()}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {segment !== "panel" && (
                <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                    {/* SECCIÓN 3 — Engagement por fuente */}
                    <InfoTooltip
                        title="Calidad del tráfico"
                        measure="Engagement y tiempo de sesión por fuente de tráfico."
                        calculation="GA4: engagementRate y averageSessionDuration por sessionSource."
                    />
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h3 className="chart-title mb-1">
                                Calidad del tráfico por fuente
                            </h3>
                            <p className="text-gray-400 text-xs mb-6">
                                Engagement rate y duración promedio
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-48 bg-gray-50 animate-pulse rounded-2xl" />
                    ) : engagementSorted.length === 0 ? (
                        <p className="text-sm text-gray-400">
                            Sin datos de engagement para este período
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full text-left min-w-[480px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/80">
                                        <th className="py-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            Fuente
                                        </th>
                                        <th className="py-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                                            Engagement
                                        </th>
                                        <th className="py-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                                            Duración prom
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {engagementSorted.map((row, i) => {
                                        const pct = engagementPct(
                                            row.engagementRate,
                                        );
                                        const badge = engagementBadge(
                                            row.engagementRate,
                                        );
                                        return (
                                            <tr
                                                key={`eng-${row.source}-${i}`}
                                                className="hover:bg-gray-50/50"
                                            >
                                                <td className="py-3 px-3 text-sm font-medium text-black break-words max-w-[200px]">
                                                    {row.label}
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-2 flex-wrap">
                                                        <span className="text-sm font-bold tabular-nums text-black">
                                                            {pct.toFixed(1)}%
                                                        </span>
                                                        <span
                                                            className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${badge.className}`}
                                                        >
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-sm font-semibold text-black text-right tabular-nums whitespace-nowrap">
                                                    {formatDuration(
                                                        row.avgDuration,
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
