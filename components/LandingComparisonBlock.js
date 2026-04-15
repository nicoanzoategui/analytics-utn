"use client";

import { useState, useEffect, useCallback } from "react";
import {
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Target,
    FileText,
    MessageCircle,
} from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";

export default function LandingComparisonBlock({ segment }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Controls state
    const [cutoffDate, setCutoffDate] = useState("");
    
    useEffect(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        setCutoffDate(d.toISOString().split('T')[0]);
    }, []);

    const [periodOption, setPeriodOption] = useState("28");
    const [customRanges, setCustomRanges] = useState({
        startOld: "", endOld: "",
        startNew: "", endNew: ""
    });

    const [comparisonData, setComparisonData] = useState(null);

    const fetchData = useCallback(async () => {
        if (segment === "panel" || !cutoffDate) return;

        setLoading(true);
        setError(null);
        try {
            let params = `?cutoffDate=${cutoffDate}`;
            if (periodOption === "custom") {
                if (!customRanges.startOld || !customRanges.endOld || !customRanges.startNew || !customRanges.endNew) {
                    setLoading(false);
                    return;
                }
                params = `?startOld=${customRanges.startOld}&endOld=${customRanges.endOld}&startNew=${customRanges.startNew}&endNew=${customRanges.endNew}`;
            } else {
                params += `&daysBefore=${periodOption}&daysAfter=${periodOption}`;
            }

            const resComp = await fetch(
                `/api/analytics/landing-comparacion${params}`,
            );

            if (!resComp.ok) {
                throw new Error("Error al cargar datos de conversión");
            }

            const dataComp = await resComp.json();

            setComparisonData(dataComp);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [segment, cutoffDate, periodOption, customRanges]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (segment === "panel") return null;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-6 bg-white rounded-xl border border-red-100 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <h3 className="text-sm font-bold text-black">Error en Landing de Carreras</h3>
                <p className="text-[10px] text-gray-500">{error}</p>
            </div>
        );
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDateRange = (range) => {
        if (!range) return "...";
        const start = new Date(range.startDate);
        const end = new Date(range.endDate);
        return `${start.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`;
    };

    const diffPoints = comparisonData ? (comparisonData.new?.conversion - comparisonData.old?.conversion).toFixed(2) : 0;
    const diffPercent = (comparisonData && (comparisonData.old?.conversion || 0) > 0) 
        ? Math.round(((comparisonData.new?.conversion / (comparisonData.old?.conversion || 1)) - 1) * 100)
        : 0;

    const isNewWinner = comparisonData && (comparisonData.new?.conversion > (comparisonData.old?.conversion || 0));

    const partialConversionPct = (clicks, users) => {
        const u = Number(users) || 0;
        if (u <= 0) return "0.0%";
        return `${(((Number(clicks) || 0) / u) * 100).toFixed(1)}%`;
    };

    return (
        <div className="space-y-2 pt-4 border-t border-gray-100 relative">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black tracking-tight text-black flex items-center gap-2">
                    <Target className="w-5 h-5 text-black" />
                    Landing de Carreras
                </h2>
                <InfoTooltip 
                    title="Análisis: Landing Anterior vs Nueva"
                    measure="Compara el rendimiento de la landing anterior vs la nueva en tráfico y conversión a inscripción, separadas por una fecha de corte definida manualmente."
                    calculation="page_view → llegada a carrera | click_inscription + chatbot_open_whatsapp | Cálculo: ((inscripción + WhatsApp) / usuarios únicos activos) × 100. Filtro URL: /e-learning/detalle/carrera/"
                />
            </div>

            {/* Compact Controls */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 whitespace-nowrap">Fecha corte</label>
                        <input 
                            type="date" 
                            value={cutoffDate} 
                            onChange={(e) => setCutoffDate(e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-medium focus:outline-none h-[32px] w-[130px]"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 whitespace-nowrap">Período</label>
                        <select 
                            value={periodOption} 
                            onChange={(e) => setPeriodOption(e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-medium focus:outline-none h-[32px] appearance-none cursor-pointer pr-6 min-w-[150px]"
                        >
                            <option value="7">Últimos 7 días c/lado</option>
                            <option value="14">Últimas 2 semanas c/lado</option>
                            <option value="28">Últimas 4 semanas c/lado</option>
                            <option value="90">Últimos 90 días c/lado</option>
                            <option value="custom">Rango personalizado...</option>
                        </select>
                    </div>
                    {periodOption === "custom" && (
                        <div className="flex flex-wrap items-center gap-3 text-[10px]">
                            <div className="flex items-center gap-1">
                                <span className="text-gray-400 uppercase font-bold">V:</span>
                                <input type="date" value={customRanges.startOld} onChange={e => setCustomRanges({...customRanges, startOld: e.target.value})} className="bg-white border border-gray-100 rounded p-1 h-[28px]" />
                                <input type="date" value={customRanges.endOld} onChange={e => setCustomRanges({...customRanges, endOld: e.target.value})} className="bg-white border border-gray-100 rounded p-1 h-[28px]" />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-gray-400 uppercase font-bold">N:</span>
                                <input type="date" value={customRanges.startNew} onChange={e => setCustomRanges({...customRanges, startNew: e.target.value})} className="bg-white border border-gray-100 rounded p-1 h-[28px]" />
                                <input type="date" value={customRanges.endNew} onChange={e => setCustomRanges({...customRanges, endNew: e.target.value})} className="bg-white border border-gray-100 rounded p-1 h-[28px]" />
                            </div>
                        </div>
                    )}
                </div>
                <p className="text-[11px] text-gray-400 mt-2 italic font-medium">
                    Comparando: <span className="text-gray-600 font-bold">{formatDateRange(comparisonData?.old?.range)}</span> (anterior) vs <span className="text-gray-600 font-bold">{formatDateRange(comparisonData?.new?.range)}</span> (nueva)
                </p>
            </div>

            {/* Compact Comparative Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`bg-white p-3 rounded-2xl border ${isNewWinner ? 'border-l-4 border-l-green-500 shadow-sm' : 'border-gray-100'} relative`}>
                    {isNewWinner && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest py-0.5 px-2 rounded-full">
                            Convierte más
                        </div>
                    )}
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-2">Landing Nueva</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-center">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                                Usuarios únicos
                            </p>
                            <p className="text-[20px] font-black leading-tight text-black">
                                {(comparisonData?.new?.users ?? 0).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="flex items-center justify-center gap-0.5 text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                                <FileText className="w-3 h-3 shrink-0" aria-hidden />
                                Inscripción
                            </p>
                            <p className="text-[20px] font-black leading-tight text-black">
                                {(
                                    comparisonData?.new?.clicks_inscription ?? 0
                                ).toLocaleString()}
                            </p>
                            <p className="text-[9px] text-gray-400 leading-tight mt-0.5 px-0.5">
                                Conv. inscripción:{" "}
                                {partialConversionPct(
                                    comparisonData?.new?.clicks_inscription,
                                    comparisonData?.new?.users,
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="flex items-center justify-center gap-0.5 text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                                <MessageCircle
                                    className="w-3 h-3 shrink-0"
                                    aria-hidden
                                />
                                WhatsApp
                            </p>
                            <p className="text-[20px] font-black leading-tight text-black">
                                {(
                                    comparisonData?.new?.clicks_whatsapp ?? 0
                                ).toLocaleString()}
                            </p>
                            <p className="text-[9px] text-gray-400 leading-tight mt-0.5 px-0.5">
                                Conv. WhatsApp:{" "}
                                {partialConversionPct(
                                    comparisonData?.new?.clicks_whatsapp,
                                    comparisonData?.new?.users,
                                )}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                                    Conv
                                </p>
                                <InfoTooltip
                                    title="Conversión"
                                    measure="% de usuarios únicos con click en Inscribirse o en WhatsApp (chatbot)"
                                    calculation="((click_inscription + chatbot_open_whatsapp) / usuarios únicos en la landing) × 100"
                                />
                            </div>
                            <p className={`text-[20px] font-black leading-tight ${isNewWinner ? 'text-green-600' : 'text-black'}`}>{comparisonData?.new?.conversion.toFixed(1) || "0.0"}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">Tiempo</p>
                            <p className={`text-[20px] font-black leading-tight ${(comparisonData?.new?.duration > (comparisonData?.old?.duration || 0)) ? 'text-green-600' : 'text-black'}`}>{formatTime(comparisonData?.new?.duration || 0)}</p>
                        </div>
                    </div>
                </div>

                <div className={`bg-white p-3 rounded-2xl border ${!isNewWinner && comparisonData ? 'border-l-4 border-l-green-500 shadow-sm' : 'border-gray-100'} relative`}>
                    {(!isNewWinner && comparisonData && (comparisonData.old?.conversion || 0) > 0) && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest py-0.5 px-2 rounded-full">
                            Convierte más
                        </div>
                    )}
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-2">Landing Anterior</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-center">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                                Usuarios únicos
                            </p>
                            <p className="text-[20px] font-black leading-tight text-black">
                                {(comparisonData?.old?.users ?? 0).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="flex items-center justify-center gap-0.5 text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                                <FileText className="w-3 h-3 shrink-0" aria-hidden />
                                Inscripción
                            </p>
                            <p className="text-[20px] font-black leading-tight text-black">
                                {(
                                    comparisonData?.old?.clicks_inscription ?? 0
                                ).toLocaleString()}
                            </p>
                            <p className="text-[9px] text-gray-400 leading-tight mt-0.5 px-0.5">
                                Conv. inscripción:{" "}
                                {partialConversionPct(
                                    comparisonData?.old?.clicks_inscription,
                                    comparisonData?.old?.users,
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="flex items-center justify-center gap-0.5 text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                                <MessageCircle
                                    className="w-3 h-3 shrink-0"
                                    aria-hidden
                                />
                                WhatsApp
                            </p>
                            <p className="text-[20px] font-black leading-tight text-black">
                                {(
                                    comparisonData?.old?.clicks_whatsapp ?? 0
                                ).toLocaleString()}
                            </p>
                            <p className="text-[9px] text-gray-400 leading-tight mt-0.5 px-0.5">
                                Conv. WhatsApp:{" "}
                                {partialConversionPct(
                                    comparisonData?.old?.clicks_whatsapp,
                                    comparisonData?.old?.users,
                                )}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                                    Conv
                                </p>
                                <InfoTooltip
                                    title="Conversión"
                                    measure="% de usuarios únicos con click en Inscribirse o en WhatsApp (chatbot)"
                                    calculation="((click_inscription + chatbot_open_whatsapp) / usuarios únicos en la landing) × 100"
                                />
                            </div>
                            <p className={`text-[20px] font-black leading-tight ${!isNewWinner && (comparisonData?.old?.conversion || 0) > 0 ? 'text-green-600' : 'text-black'}`}>{comparisonData?.old?.conversion.toFixed(1) || "0.0"}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">Tiempo</p>
                            <p className={`text-[20px] font-black leading-tight ${(comparisonData?.old?.duration > (comparisonData?.new?.duration || 0)) ? 'text-green-600' : 'text-black'}`}>{formatTime(comparisonData?.old?.duration || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Summary Result */}
            <div className={`p-4 rounded-2xl border ${isNewWinner ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} flex items-center justify-between transition-all duration-300`}>
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isNewWinner ? 'bg-green-500 shadow-sm' : 'bg-red-500 shadow-sm'}`}>
                        {isNewWinner ? <TrendingUp className="w-5 h-5 text-white" /> : <TrendingDown className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                        <p className={`text-[16px] font-black ${isNewWinner ? 'text-green-900' : 'text-red-900'}`}>
                            {isNewWinner ? '+' : ''}{diffPoints} ptos porcentuales
                        </p>
                        <p className={`text-[11px] ${isNewWinner ? 'text-green-700' : 'text-red-700'} font-bold opacity-80 uppercase tracking-tight`}>
                            {isNewWinner ? `LA LANDING NUEVA CONVIERTE UN ${diffPercent}% MÁS` : `LA LANDING ANTERIOR CONVIERTE UN ${Math.abs(diffPercent)}% MÁS`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
