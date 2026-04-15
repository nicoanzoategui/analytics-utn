"use client";

import { BookOpen, FileText } from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";

function formatTime(seconds) {
    const s = Number(seconds) || 0;
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function partialInscriptionConv(clicks, users) {
    const u = Number(users) || 0;
    if (u <= 0) return "0.0%";
    return `${(((Number(clicks) || 0) / u) * 100).toFixed(1)}%`;
}

export default function CursosConversionBlock({
    data = null,
    loading = false,
    days,
    segment,
}) {
    if (segment === "panel") return null;

    if (loading) {
        return (
            <div className="space-y-2 pt-4 border-t border-gray-100">
                <div className="h-6 w-48 bg-gray-50 animate-pulse rounded-lg" />
                <div className="h-32 bg-gray-50 animate-pulse rounded-2xl" />
            </div>
        );
    }

    const d = data || {};
    const users = Number(d.users) || 0;
    const clicks = Number(d.clicks) || 0;
    const conversion = Number(d.conversion) || 0;
    const duration = Number(d.duration) || 0;

    return (
        <div className="space-y-2 pt-4 border-t border-gray-100 relative">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black tracking-tight text-black flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-black" />
                    Landing de Cursos
                </h2>
                <InfoTooltip
                    title="Landing de Cursos"
                    measure="Tráfico y conversión a inscripción en la web pública de detalle de curso (e-learning)."
                    calculation="Usuarios únicos (activeUsers) y clicks al evento click_inscription en URLs que comienzan con /e-learning/detalle/curso/. Conversión = (clicks / usuarios) × 100."
                />
            </div>
            <p className="text-gray-400 text-xs mb-4">
                Métricas de conversión · /e-learning/detalle/curso/
                {days != null && typeof days === "number" ? (
                    <span className="text-gray-300"> · {days} días</span>
                ) : null}
            </p>

            <div className="bg-white p-3 rounded-2xl border border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                            Usuarios únicos
                        </p>
                        <p className="text-[20px] font-black leading-tight text-black">
                            {users.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="flex items-center justify-center gap-0.5 text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                            <FileText className="w-3 h-3 shrink-0" aria-hidden />
                            Inscripción
                        </p>
                        <p className="text-[20px] font-black leading-tight text-black">
                            {clicks.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-gray-400 leading-tight mt-0.5 px-0.5">
                            Conv. inscripción:{" "}
                            {partialInscriptionConv(clicks, users)}
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center justify-center gap-0.5 mb-0.5">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                                Conv
                            </p>
                            <InfoTooltip
                                title="Conversión"
                                measure="% de usuarios únicos que dispararon click_inscription en la landing de curso."
                                calculation="(eventos click_inscription / usuarios únicos en /e-learning/detalle/curso/) × 100"
                            />
                        </div>
                        <p className="text-[20px] font-black leading-tight text-black">
                            {conversion.toFixed(1)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                            Tiempo
                        </p>
                        <p className="text-[20px] font-black leading-tight text-black">
                            {formatTime(duration)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
