"use client";

const labels = {
    curso: "Cursos",
    carrera: "Carreras",
    diplomatura: "Diplomaturas",
    "experto-universitario": "Experto Universitarios",
    posgrado: "Posgrados",
};

/** Alinea slugs de Tipo[...] con las claves de `labels` (plurales, experto, etc.). */
function listadoSlugToKey(slug) {
    if (!slug) return null;
    const s = String(slug).toLowerCase().trim();
    if (Object.prototype.hasOwnProperty.call(labels, s)) return s;
    if (s === "experto-universitario" || s.startsWith("experto")) {
        return "experto-universitario";
    }
    if (s === "cursos" || s.startsWith("curso")) return "curso";
    if (s === "carreras" || s.startsWith("carrera")) return "carrera";
    if (s === "diplomaturas" || s.startsWith("diplomatura")) return "diplomatura";
    if (s === "posgrados" || s.startsWith("posgrado")) return "posgrado";
    return s;
}

export default function CourseTypeChart({ data = [], loading = false }) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-6 w-48 bg-gray-50 animate-pulse rounded-lg" />
                <div className="h-4 w-64 bg-gray-50 animate-pulse rounded" />
                <div className="h-40 bg-gray-50 animate-pulse rounded-xl" />
            </div>
        );
    }

    const listadoTipoRows = data.filter((d) =>
        d.page?.includes("/listado/Tipo["),
    );
    const slugsEncontrados = listadoTipoRows
        .map((d) => d.page.match(/Tipo\[([^\]]+)\]/)?.[1])
        .filter(Boolean);
    console.log("Tipos encontrados:", [...new Set(slugsEncontrados)]);

    const tiposListado = listadoTipoRows
        .map((d) => {
            const match = d.page.match(/Tipo\[([^\]]+)\]/);
            const raw = match?.[1];
            const key = raw ? listadoSlugToKey(raw) : null;
            return { tipo: key, views: Number(d.views) || 0 };
        })
        .filter((d) => d.tipo);

    const tiposQuery = data
        .filter((d) => d.page?.includes("type=posgrado"))
        .reduce((acc, d) => {
            acc += Number(d.views) || 0;
            return acc;
        }, 0);

    const posgradoEntry =
        tiposQuery > 0 ? [{ tipo: "posgrado", views: tiposQuery }] : [];

    const tipos = [...tiposListado, ...posgradoEntry]
        .reduce((acc, item) => {
            const existing = acc.find((c) => c.tipo === item.tipo);
            if (existing) existing.views += item.views;
            else acc.push({ ...item });
            return acc;
        }, [])
        .map((item) => ({
            tipo: labels[item.tipo] || item.tipo,
            views: item.views,
            slug: item.tipo,
        }))
        .sort((a, b) => b.views - a.views);

    const maxVal = Math.max(...tipos.map((t) => t.views), 1);

    return (
        <div>
            <h3 className="chart-title mb-1">Tipos de formación más buscados</h3>
            <p className="text-gray-400 text-xs mb-6">
                Navegación por tipo en web pública
            </p>
            {tipos.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos para este período</p>
            ) : (
                <ul className="space-y-3">
                    {tipos.map((row, idx) => {
                        const pct = maxVal > 0 ? (row.views / maxVal) * 100 : 0;
                        const opacity =
                            maxVal > 0 ? 0.2 + (row.views / maxVal) * 0.8 : 0.2;
                        return (
                            <li
                                key={`tipo-${row.slug}-${idx}`}
                                className="flex items-center gap-3"
                            >
                                <span className="w-36 shrink-0 text-sm font-medium text-black truncate">
                                    {row.tipo}
                                </span>
                                <div className="flex-1 min-w-0 h-8 rounded-md bg-[#f1f5f9] overflow-hidden">
                                    <div
                                        className="h-full rounded-md transition-all duration-300"
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: "#2563eb",
                                            opacity,
                                        }}
                                    />
                                </div>
                                <span className="w-20 shrink-0 text-right text-sm font-bold tabular-nums text-black">
                                    {row.views.toLocaleString()}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
