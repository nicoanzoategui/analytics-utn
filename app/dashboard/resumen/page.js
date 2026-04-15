"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Loader2,
    AlertCircle,
    Globe,
    Users,
} from "lucide-react";

const DAY_ABBR_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatDurationSeconds(sec) {
    const s = Number(sec) || 0;
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}m ${r.toString().padStart(2, "0")}s`;
}

function formatDurationShort(sec) {
    const s = Number(sec) || 0;
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
}

function pctChange(cur, prev) {
    const c = Number(cur) || 0;
    const p = Number(prev) || 0;
    if (p === 0) return c > 0 ? 100 : 0;
    return Math.round(((c - p) / p) * 100);
}

function cleanSourceName(name) {
    if (!name || typeof name !== "string") return "Sin fuente";
    const t = name.trim();
    if (t === "(direct)") return "Directo";
    if (t === "(not set)") return "Sin fuente";
    return t;
}

function tipoFromDetallePage(page) {
    if (!page || !page.includes("/detalle/")) return "Curso";
    const parts = page.split("/").filter(Boolean);
    const i = parts.indexOf("detalle");
    const raw = (i >= 0 ? parts[i + 1] : "") || "";
    const map = {
        curso: "Curso",
        carrera: "Carrera",
        diplomatura: "Diplomatura",
        "experto-universitario": "Experto",
        experto: "Experto",
        posgrado: "Posgrado",
    };
    return map[raw.toLowerCase()] || raw.replace(/-/g, " ") || "Curso";
}

function nombreFromDetallePage(page) {
    if (!page) return "";
    const parts = page.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return last
        .replace(/-/g, " ")
        .replace(/^\d+\s*/, "")
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

/** Misma lógica que PanelSectionsChart (rutas exactas + /e-learning). */
const PANEL_SECTIONS_RESUMEN = {
    "/panel/course": "Mis cursos",
    "/panel/home": "Inicio",
    "/panel/cart": "Carrito",
    "/panel/payment/recurrent": "Pago recurrente",
    "/panel/payment/unique": "Pago único",
    "/panel/profile": "Perfil",
    "/panel/document": "Documentos",
    "/panel/notifications": "Notificaciones",
};

function aggregatePanelSections(data) {
    const list = Array.isArray(data) ? data : [];
    return Object.entries(PANEL_SECTIONS_RESUMEN)
        .map(([path, label]) => ({
            label,
            views: list
                .filter((d) => {
                    if (!d.page) return false;
                    const p = d.page.split("?")[0];
                    return (
                        p === `/e-learning${path}` ||
                        p === `/e-learning${path}/` ||
                        p === path ||
                        p === `${path}/`
                    );
                })
                .reduce((sum, d) => sum + (Number(d.views) || 0), 0),
        }))
        .filter((s) => s.views > 0)
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
}

/** Divide [startStr, endStr] en dos mitades para landing-comparacion. */
function splitRangeForLanding(startStr, endStr) {
    const start = new Date(`${startStr}T12:00:00`);
    const end = new Date(`${endStr}T12:00:00`);
    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start > end
    ) {
        return null;
    }
    const msDay = 86400000;
    const inclusiveDays =
        Math.floor((end.getTime() - start.getTime()) / msDay) + 1;
    if (inclusiveDays < 2) {
        return {
            startOld: startStr,
            endOld: startStr,
            startNew: endStr,
            endNew: endStr,
        };
    }
    const oldLen = Math.floor(inclusiveDays / 2);
    const endOld = new Date(start.getTime() + (oldLen - 1) * msDay);
    const startNew = new Date(endOld.getTime() + msDay);
    return {
        startOld: startStr,
        endOld: endOld.toISOString().split("T")[0],
        startNew: startNew.toISOString().split("T")[0],
        endNew: endStr,
    };
}

function buildSlackSummary({
    rangeLabel,
    resumenPublic,
    resumenPanel,
    topPanelSections,
    peakHour,
    peakDaysLabel,
    topSources,
    topCats,
    topFormaciones,
    landingComp,
    landingCursos,
}) {
    const dateStr = new Date().toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    const pub = resumenPublic || {};
    const pan = resumenPanel || {};
    const auP = pub.activeUsers || {};
    const auPan = pan.activeUsers || {};
    const vPub = pctChange(auP.value, auP.prevValue);
    const vPan = pctChange(auPan.value, auPan.prevValue);
    const eng = pub.engagementRate?.value ?? 0;
    const dur = pub.avgSessionDuration?.value ?? 0;
    const recurrentPanel =
        pan.newUsersRate != null
            ? Math.max(0, 100 - (Number(pan.newUsersRate.value) || 0))
            : 0;

    const mainSrc = topSources[0];
    const lcNew = landingComp?.new || {};
    const lcOld = landingComp?.old || {};
    const lcur = landingCursos || {};

    const lines = [
        `*Resumen Ejecutivo UTN · ${dateStr}*`,
        "",
        "*WEB PÚBLICA*",
        `- Usuarios activos: ${Number(auP.value || 0).toLocaleString()} (${vPub >= 0 ? "+" : ""}${vPub}% vs prev)`,
        `- Engagement: ${eng}%`,
        `- Duración media: ${formatDurationSeconds(dur)}`,
        "",
        "*PANEL DEL ALUMNO*",
        `- Usuarios activos: ${Number(auPan.value || 0).toLocaleString()} (${vPan >= 0 ? "+" : ""}${vPan}% vs prev)`,
        `- % recurrentes: ${recurrentPanel.toFixed(1)}%`,
        `- Eventos clave: ${Number(pan.keyEvents?.value || 0).toLocaleString()}`,
        "",
        "*PANEL DEL ALUMNO - SECCIONES MÁS USADAS*",
    ];
    const panelSecs = topPanelSections || [];
    if (panelSecs.length === 0) {
        lines.push("- (sin datos de secciones)");
    } else {
        panelSecs.forEach((s, i) => {
            lines.push(
                `- #${i + 1} ${s.label}: ${s.views.toLocaleString()} vistas`,
            );
        });
    }
    lines.push(
        "",
        "*TRÁFICO*",
        `- Pico horario: ${peakHour != null ? `${peakHour}h` : "—"}`,
        `- Principal fuente: ${mainSrc ? `${mainSrc.label} (${mainSrc.value.toLocaleString()} sesiones)` : "—"}`,
        "",
        "*CONTENIDO MÁS BUSCADO*",
    );
    topCats.slice(0, 3).forEach((c, i) => {
        lines.push(`- #${i + 1} ${c.label}: ${c.views.toLocaleString()} vistas`);
    });
    if (topCats.length === 0) {
        lines.push("- (sin categorías)");
    }
    const topF = topFormaciones[0];
    lines.push(
        `Top formación: ${topF ? `${topF.nombre} (${topF.views.toLocaleString()} vistas)` : "—"}`,
    );
    lines.push(
        "",
        "*CONVERSIÓN CARRERAS*",
        `- Usuarios: ${Number(lcNew.users || 0).toLocaleString()}`,
        `- Clicks inscripción: ${Number(lcNew.clicks_inscription || 0).toLocaleString()} · WhatsApp: ${Number(lcNew.clicks_whatsapp || 0).toLocaleString()}`,
        `- Conversión: ${(Number(lcNew.conversion) || 0).toFixed(1)}%`,
    );
    if (lcOld?.users > 0) {
        lines.push(
            `  (vs landing anterior: ${(Number(lcOld.conversion) || 0).toFixed(1)}%)`,
        );
    }
    lines.push(
        "",
        "*CONVERSIÓN CURSOS*",
        `- Usuarios: ${Number(lcur.users || 0).toLocaleString()}`,
        `- Clicks: ${Number(lcur.clicks || 0).toLocaleString()}`,
        `- Conversión: ${(Number(lcur.conversion) || 0).toFixed(1)}%`,
    );
    lines.push("", `_Período: ${rangeLabel}_`);
    return lines.join("\n");
}

export default function ResumenEjecutivoPage() {
    const router = useRouter();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [activePreset, setActivePreset] = useState("7");
    const [loading, setLoading] = useState(false);
    const [hasReport, setHasReport] = useState(false);
    const [error, setError] = useState(null);

    const [resumenPublic, setResumenPublic] = useState(null);
    const [resumenPanel, setResumenPanel] = useState(null);
    const [landingComp, setLandingComp] = useState(null);
    const [landingCursos, setLandingCursos] = useState(null);
    const [pagesBasic, setPagesBasic] = useState([]);
    const [panelPages, setPanelPages] = useState([]);
    const [patronData, setPatronData] = useState([]);
    const [fuentesData, setFuentesData] = useState([]);

    useEffect(() => {
        const end = new Date();
        end.setDate(end.getDate() - 1);
        const start = new Date();
        start.setDate(start.getDate() - 7);
        setEndDate(end.toISOString().split("T")[0]);
        setStartDate(start.toISOString().split("T")[0]);
    }, []);

    function applyPreset(preset) {
        const n = preset === "7" ? 7 : preset === "28" ? 28 : 90;
        const end = new Date();
        end.setDate(end.getDate() - 1);
        const start = new Date(end);
        start.setDate(start.getDate() - (n - 1));
        setEndDate(end.toISOString().split("T")[0]);
        setStartDate(start.toISOString().split("T")[0]);
        setActivePreset(preset);
    }

    const generateReport = useCallback(async () => {
        if (!startDate || !endDate) {
            window.alert("Seleccioná fecha desde y hasta.");
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            window.alert("La fecha desde no puede ser posterior a hasta.");
            return;
        }

        setLoading(true);
        setError(null);

        const q = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        const paramsPub = `?${q}&segment=public`;
        const paramsPanel = `?${q}&segment=panel`;

        const land = splitRangeForLanding(startDate, endDate);
        const paramsLanding = land
            ? `?startOld=${encodeURIComponent(land.startOld)}&endOld=${encodeURIComponent(land.endOld)}&startNew=${encodeURIComponent(land.startNew)}&endNew=${encodeURIComponent(land.endNew)}`
            : null;

        const paramsPages = `?${q}&segment=public&limit=100`;
        const paramsPanelPages = `?${q}&segment=panel&limit=100`;
        const paramsPatron = `?${q}&segment=public`;
        const paramsFuentes = `?${q}&segment=public`;

        try {
            setPanelPages([]);
            const results = await Promise.all([
                fetch(`/api/analytics/resumen${paramsPub}`),
                fetch(`/api/analytics/resumen${paramsPanel}`),
                fetch(`/api/analytics/landing-cursos${paramsPub}`),
                fetch(`/api/analytics/paginas${paramsPages}`),
                fetch(`/api/analytics/paginas${paramsPanelPages}`),
                fetch(`/api/analytics/patron-estudio${paramsPatron}`),
                fetch(`/api/analytics/fuentes${paramsFuentes}`),
            ]);

            const failed = results.find((r) => !r.ok);
            if (failed) {
                throw new Error("Error al cargar datos del resumen");
            }

            const [
                jPub,
                jPanel,
                jCursos,
                jPages,
                jPanelPages,
                jPatron,
                jFuentes,
            ] = await Promise.all(results.map((r) => r.json()));

            if (jPub?.error || jPanel?.error) {
                throw new Error(jPub?.error || jPanel?.error || "Error API");
            }

            let jLandRes = null;
            if (paramsLanding) {
                const lr = await fetch(
                    `/api/analytics/landing-comparacion${paramsLanding}`,
                );
                if (lr.ok) {
                    jLandRes = await lr.json();
                }
            }

            setResumenPublic(jPub);
            setResumenPanel(jPanel);
            setLandingComp(jLandRes && !jLandRes.error ? jLandRes : null);
            setLandingCursos(
                jCursos && !jCursos.error ? jCursos : null,
            );
            setPagesBasic(Array.isArray(jPages) ? jPages : []);
            setPanelPages(Array.isArray(jPanelPages) ? jPanelPages : []);
            setPatronData(Array.isArray(jPatron) ? jPatron : []);
            setFuentesData(Array.isArray(jFuentes) ? jFuentes : []);
            setHasReport(true);
        } catch (e) {
            console.error(e);
            setPanelPages([]);
            setError(e.message || "Error");
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    const trafficInsight = useMemo(() => {
        const rows = patronData || [];
        if (!rows.length) {
            return { peakHour: null, peakDaysLabel: "—" };
        }
        let maxU = -1;
        let maxH = 0;
        const byDay = {};
        for (const r of rows) {
            const u = Number(r.users) || 0;
            const day = Number(r.day);
            const hour = Number(r.hour);
            if (u > maxU) {
                maxU = u;
                maxH = hour;
            }
            byDay[day] = (byDay[day] || 0) + u;
        }
        const sortedDays = Object.entries(byDay)
            .map(([k, v]) => ({ day: Number(k), users: v }))
            .sort((a, b) => b.users - a.users)
            .slice(0, 2);
        const peakDaysLabel = sortedDays.length
            ? sortedDays.map((x) => DAY_ABBR_ES[x.day % 7]).join(", ")
            : "—";
        return { peakHour: maxU >= 0 ? maxH : null, peakDaysLabel };
    }, [patronData]);

    const topSources = useMemo(() => {
        return [...(fuentesData || [])]
            .sort((a, b) => (b.sessions || 0) - (a.sessions || 0))
            .slice(0, 3)
            .map((r) => ({
                label: cleanSourceName(r.source),
                value: Number(r.sessions) || 0,
            }));
    }, [fuentesData]);

    const maxSourceVal = Math.max(...topSources.map((s) => s.value), 1);

    const topCats = useMemo(() => {
        const list = pagesBasic || [];
        const rows = list
            .filter((d) => d.page?.includes("/listado/Categorias["))
            .map((d) => {
                const m = d.page.match(/Categorias\[([^\]]+)\]/);
                const raw = m?.[1] || "";
                const slug = raw.toLowerCase();
                const label = raw
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase());
                return { slug, label, views: Number(d.views) || 0 };
            })
            .reduce((acc, item) => {
                const ex = acc.find((c) => c.slug === item.slug);
                if (ex) ex.views += item.views;
                else acc.push({ ...item });
                return acc;
            }, [])
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
        return rows;
    }, [pagesBasic]);

    const maxCatViews = Math.max(...topCats.map((c) => c.views), 1);

    const topFormaciones = useMemo(() => {
        const list = pagesBasic || [];
        return list
            .filter((d) => d.page?.includes("/detalle/"))
            .map((d) => ({
                page: d.page,
                nombre: nombreFromDetallePage(d.page),
                tipo: tipoFromDetallePage(d.page),
                views: Number(d.views) || 0,
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
    }, [pagesBasic]);

    const maxFormViews = Math.max(...topFormaciones.map((f) => f.views), 1);

    const topPanelSections = useMemo(
        () => aggregatePanelSections(panelPages),
        [panelPages],
    );
    const maxPanelSectionViews = Math.max(
        ...topPanelSections.map((s) => s.views),
        1,
    );

    const recurrentPanelPct = useMemo(() => {
        const n = Number(resumenPanel?.newUsersRate?.value) || 0;
        return Math.max(0, Math.min(100, 100 - n));
    }, [resumenPanel]);

    async function handleCopySlack() {
        if (!hasReport) return;
        const text = buildSlackSummary({
            rangeLabel: `${startDate} → ${endDate}`,
            resumenPublic,
            resumenPanel,
            topPanelSections,
            peakHour: trafficInsight.peakHour,
            peakDaysLabel: trafficInsight.peakDaysLabel,
            topSources,
            topCats,
            topFormaciones,
            landingComp,
            landingCursos,
        });
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            window.alert("No se pudo copiar al portapapeles");
        }
    }

    function Variation({ cur, prev }) {
        const v = pctChange(cur, prev);
        const pos = v >= 0;
        return (
            <span
                className={`inline-flex items-center gap-0.5 text-sm font-bold ${pos ? "text-green-600" : "text-red-500"}`}
            >
                {pos ? (
                    <TrendingUp className="w-4 h-4" />
                ) : (
                    <TrendingDown className="w-4 h-4" />
                )}
                {pos ? "+" : ""}
                {v}%
            </span>
        );
    }

    const printCss = `
@media print {
    button,
    nav,
    header,
    .no-print {
        display: none !important;
    }
    body {
        background: white !important;
        color: black !important;
    }
    .rounded-2xl,
    .rounded-xl {
        border: 1px solid #e5e7eb !important;
        box-shadow: none !important;
        break-inside: avoid;
    }
    section {
        break-before: auto;
    }
    h1 {
        font-size: 18px !important;
    }
    @page {
        margin: 20mm;
        size: A4;
    }
    .print-only-meta {
        display: block !important;
        color: #6b7280 !important;
    }
}
@media screen {
    .print-only-meta {
        display: none !important;
    }
}
`;

    return (
        <div className="bg-white px-6 py-8 max-w-4xl mx-auto">
            <style dangerouslySetInnerHTML={{ __html: printCss }} />

            <div className="flex flex-wrap items-center gap-4 mb-8 no-print">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                </button>
            </div>

            <div className="mb-10">
                <div className="print-only-meta text-xs text-gray-400 mb-4">
                    Generado el {new Date().toLocaleDateString("es-AR")} ·
                    Centro de eLearning UTN
                </div>
                <h1 className="text-2xl font-black tracking-tight text-black mb-2">
                    Resumen Ejecutivo
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                    Rango personalizado · Web pública + Panel del alumno
                </p>

                <div className="no-print flex flex-wrap items-center gap-2 mb-4">
                    {[
                        { id: "7", label: "7d" },
                        { id: "28", label: "28d" },
                        { id: "90", label: "90d" },
                    ].map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => applyPreset(p.id)}
                            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                                activePreset === p.id
                                    ? "bg-black text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="no-print flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                            Desde
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setActivePreset("custom");
                            }}
                            className="w-full max-w-[200px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                            Hasta
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setActivePreset("custom");
                            }}
                            className="w-full max-w-[200px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => void generateReport()}
                        disabled={loading || !startDate || !endDate}
                        className="rounded-xl bg-black px-6 py-2 text-sm font-bold text-white hover:bg-gray-900 disabled:opacity-50 disabled:pointer-events-none transition-colors shrink-0"
                    >
                        Generar reporte
                    </button>
                </div>
            </div>

            {error && (
                <div className="no-print mb-8 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            {loading && (
                <div className="no-print flex items-center justify-center py-12 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            )}

            {!hasReport && !loading && (
                <p className="no-print text-sm text-gray-400 mb-8">
                    Elegí el rango de fechas o un preset y pulsá{" "}
                    <strong className="text-gray-600">Generar reporte</strong>.
                </p>
            )}

            {hasReport && (
                <>
                    {/* SECCIÓN 1 */}
                    <section className="mb-12">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3 mb-6">
                            Audiencia
                        </h2>
                        <div className="flex flex-col gap-6">
                            <div className="rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="bg-gray-900 px-6 py-3 flex items-center gap-2 flex-wrap">
                                    <Globe className="w-4 h-4 text-white shrink-0" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-white">
                                        Web Pública
                                    </span>
                                    <span className="text-xs text-gray-400 ml-auto">
                                        /e-learning/ (sin panel)
                                    </span>
                                </div>
                                <div className="p-6">
                                    <p className="text-3xl font-black text-black tracking-tight tabular-nums mb-1">
                                        {(
                                            resumenPublic?.activeUsers
                                                ?.value ?? 0
                                        ).toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-xs uppercase tracking-widest text-gray-400">
                                            vs período prev.
                                        </span>
                                        <Variation
                                            cur={
                                                resumenPublic?.activeUsers
                                                    ?.value
                                            }
                                            prev={
                                                resumenPublic?.activeUsers
                                                    ?.prevValue
                                            }
                                        />
                                    </div>
                                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                                        Tasa engagement
                                    </p>
                                    <p className="text-lg font-black text-black">
                                        {resumenPublic?.engagementRate?.value ??
                                            0}
                                        %
                                    </p>
                                    <p className="text-xs uppercase tracking-widest text-gray-400 mt-3 mb-1">
                                        Duración media
                                    </p>
                                    <p className="text-lg font-bold text-black">
                                        {formatDurationShort(
                                            resumenPublic?.avgSessionDuration
                                                ?.value ?? 0,
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-blue-100 overflow-hidden">
                                <div className="bg-blue-600 px-6 py-3 flex items-center gap-2 flex-wrap">
                                    <Users className="w-4 h-4 text-white shrink-0" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-white">
                                        Panel del Alumno
                                    </span>
                                    <span className="text-xs text-blue-200 ml-auto">
                                        /e-learning/panel/
                                    </span>
                                </div>
                                <div className="p-6">
                                    <p className="text-3xl font-black text-black tracking-tight tabular-nums mb-1">
                                        {(
                                            resumenPanel?.activeUsers
                                                ?.value ?? 0
                                        ).toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-xs uppercase tracking-widest text-gray-400">
                                            vs período prev.
                                        </span>
                                        <Variation
                                            cur={
                                                resumenPanel?.activeUsers
                                                    ?.value
                                            }
                                            prev={
                                                resumenPanel?.activeUsers
                                                    ?.prevValue
                                            }
                                        />
                                    </div>
                                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                                        % recurrentes
                                    </p>
                                    <p className="text-lg font-black text-black">
                                        {recurrentPanelPct.toFixed(1)}%
                                    </p>
                                    <p className="text-xs uppercase tracking-widest text-gray-400 mt-3 mb-1">
                                        Eventos clave
                                    </p>
                                    <p className="text-lg font-bold text-black">
                                        {(
                                            resumenPanel?.keyEvents?.value ?? 0
                                        ).toLocaleString()}
                                    </p>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-6 mb-3">
                                        Secciones más visitadas
                                    </h3>
                                    {topPanelSections.length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            Sin datos en el período.
                                        </p>
                                    ) : (
                                        <ul className="space-y-4">
                                            {topPanelSections.map((s, i) => (
                                                <li key={s.label}>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-xs text-gray-400 w-4 shrink-0">
                                                            #{i + 1}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-900 flex-1 min-w-0">
                                                            {s.label}
                                                        </span>
                                                        <span className="text-sm font-mono text-gray-500 shrink-0">
                                                            {s.views.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className="mt-1.5 w-full rounded-full bg-blue-100 overflow-hidden"
                                                        style={{ height: 2 }}
                                                    >
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{
                                                                width: `${(s.views / maxPanelSectionViews) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 2 */}
                    <section className="mb-12">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3 mb-6">
                            Tráfico
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-gray-100 rounded-2xl p-6">
                                <p className="text-sm font-bold text-black mb-3">
                                    Pico de tráfico por hora
                                </p>
                                <p className="text-sm text-gray-600 mb-3">
                                    Pico:{" "}
                                    {trafficInsight.peakHour != null
                                        ? `${trafficInsight.peakHour}h`
                                        : "—"}{" "}
                                    · Días más activos:{" "}
                                    {trafficInsight.peakDaysLabel}
                                </p>
                                {trafficInsight.peakHour != null && (
                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded bg-gray-100 text-gray-700">
                                        {trafficInsight.peakHour}h
                                    </span>
                                )}
                            </div>
                            <div className="border border-gray-100 rounded-2xl p-6">
                                <p className="text-sm font-bold text-black mb-4">
                                    Fuente principal de tráfico
                                </p>
                                {topSources.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        Sin datos
                                    </p>
                                ) : (
                                    <ul className="space-y-3">
                                        {topSources.map((s, i) => {
                                            const op =
                                                0.2 +
                                                (s.value / maxSourceVal) * 0.8;
                                            return (
                                                <li
                                                    key={`src-${s.label}-${i}`}
                                                    className="flex flex-col gap-1"
                                                >
                                                    <span className="text-xs font-medium text-black">
                                                        {s.label}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-6 rounded-md bg-[#f1f5f9] overflow-hidden min-w-0">
                                                            <div
                                                                className="h-full rounded-md bg-[#2563eb]"
                                                                style={{
                                                                    width: `${(s.value / maxSourceVal) * 100}%`,
                                                                    opacity: op,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold tabular-nums text-black shrink-0">
                                                            {s.value.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                                <p className="text-[10px] text-gray-400 mt-2">
                                    Por sesiones (GA4)
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 3 */}
                    <section className="mb-12">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3 mb-6">
                            Contenido más buscado
                        </h2>
                        <div className="rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-900 px-6 py-3 flex items-center gap-2 flex-wrap">
                                <Globe className="w-4 h-4 text-white shrink-0" />
                                <span className="text-xs font-bold uppercase tracking-widest text-white">
                                    Web Pública
                                </span>
                            </div>
                            <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-100">
                                <p className="text-xs text-gray-600">
                                    Búsquedas y visitas de usuarios no logueados
                                </p>
                            </div>
                            <div className="p-6 space-y-8">
                            <div>
                                <p className="text-sm font-bold text-black mb-4">
                                    Top categorías (Web pública)
                                </p>
                                {topCats.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        Sin datos
                                    </p>
                                ) : (
                                    <ul className="space-y-3">
                                        {topCats.map((c, i) => (
                                            <li
                                                key={`cat-${c.slug}-${i}`}
                                                className="flex flex-col gap-1"
                                            >
                                                <span className="text-sm font-medium text-black">
                                                    {c.label}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-8 rounded-md bg-[#f1f5f9] overflow-hidden min-w-0">
                                                        <div
                                                            className="h-full rounded-md bg-[#2563eb]"
                                                            style={{
                                                                width: `${(c.views / maxCatViews) * 100}%`,
                                                                opacity:
                                                                    0.2 +
                                                                    (c.views /
                                                                        maxCatViews) *
                                                                        0.8,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold tabular-nums text-black shrink-0">
                                                        {c.views.toLocaleString()}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-black mb-4">
                                    Top formaciones
                                </p>
                                {topFormaciones.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        Sin datos
                                    </p>
                                ) : (
                                    <ul className="space-y-3">
                                        {topFormaciones.map((f, i) => (
                                            <li
                                                key={f.page || i}
                                                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
                                                        {f.tipo}
                                                    </span>
                                                    <span className="text-sm font-medium text-black break-words">
                                                        {f.nombre}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 sm:w-48 shrink-0">
                                                    <div className="flex-1 h-6 rounded-md bg-[#f1f5f9] overflow-hidden min-w-0">
                                                        <div
                                                            className="h-full rounded-md bg-[#2563eb]"
                                                            style={{
                                                                width: `${(f.views / maxFormViews) * 100}%`,
                                                                opacity:
                                                                    0.2 +
                                                                    (f.views /
                                                                        maxFormViews) *
                                                                        0.8,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold tabular-nums text-black">
                                                        {f.views.toLocaleString()}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 4 */}
                    <section className="mb-12">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3 mb-6">
                            Conversión
                        </h2>
                        <div className="rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-900 px-6 py-3 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-white shrink-0" />
                                <span className="text-xs font-bold uppercase tracking-widest text-white">
                                    Web Pública · Landing de Carreras y Cursos
                                </span>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                            <div className="border border-gray-100 rounded-2xl p-6">
                                <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4">
                                    Landing carreras
                                </p>
                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                                    Usuarios únicos (nueva)
                                </p>
                                <p className="text-2xl font-black text-black mb-3">
                                    {(
                                        landingComp?.new?.users ?? 0
                                    ).toLocaleString()}
                                </p>
                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                                    Clicks inscripción + WhatsApp
                                </p>
                                <p className="text-2xl font-black text-black mb-3">
                                    {(
                                        landingComp?.new?.clicks ?? 0
                                    ).toLocaleString()}
                                </p>
                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                                    Conv. %
                                </p>
                                <p className="text-3xl font-black text-black">
                                    {(landingComp?.new?.conversion ?? 0).toFixed(
                                        1,
                                    )}
                                    %
                                </p>
                                {landingComp?.old &&
                                    (landingComp.old.users ?? 0) > 0 && (
                                        <p className="text-xs text-gray-500 mt-3">
                                            vs anterior:{" "}
                                            {(
                                                landingComp.old.conversion ?? 0
                                            ).toFixed(1)}
                                            % conv. ·{" "}
                                            {(
                                                landingComp.old.users ?? 0
                                            ).toLocaleString()}{" "}
                                            usuarios
                                        </p>
                                    )}
                            </div>
                            <div className="border border-gray-100 rounded-2xl p-6">
                                <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4">
                                    Landing cursos
                                </p>
                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                                    Usuarios únicos
                                </p>
                                <p className="text-2xl font-black text-black mb-3">
                                    {(
                                        landingCursos?.users ?? 0
                                    ).toLocaleString()}
                                </p>
                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                                    Clicks inscripción
                                </p>
                                <p className="text-2xl font-black text-black mb-3">
                                    {(
                                        landingCursos?.clicks ?? 0
                                    ).toLocaleString()}
                                </p>
                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                                    Conv. %
                                </p>
                                <p className="text-3xl font-black text-black">
                                    {(landingCursos?.conversion ?? 0).toFixed(1)}%
                                </p>
                            </div>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 5 */}
                    <section className="no-print space-y-3">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3 mb-4">
                            Exportar
                        </h2>
                        <button
                            type="button"
                            onClick={() => void handleCopySlack()}
                            disabled={!hasReport}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-4 px-4 text-sm font-bold text-black hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        >
                            📋 Copiar resumen para Slack
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="w-full rounded-2xl border border-gray-200 bg-white py-4 px-4 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            📄 Exportar PDF
                        </button>
                    </section>
                </>
            )}
        </div>
    );
}
