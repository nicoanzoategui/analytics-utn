"use client";

const PANEL_SECTIONS = {
    "/panel/course": "Mis cursos",
    "/panel/home": "Inicio",
    "/panel/cart": "Carrito",
    "/panel/benefits": "Beneficios",
    "/panel/checkout": "Checkout",
    "/panel/pre-validate-cart": "Pre-validación carrito",
    "/panel/payment/recurrent": "Pago recurrente",
    "/panel/payment/unique": "Pago único",
    "/panel/profile": "Perfil",
    "/panel/document": "Documentos",
    "/panel/document/validator": "Validador",
    "/panel/notifications": "Notificaciones",
};

export default function PanelSectionsChart({ data = [], loading = false }) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-6 w-48 bg-gray-50 animate-pulse rounded-lg" />
                <div className="h-4 w-64 bg-gray-50 animate-pulse rounded" />
                <div className="h-40 bg-gray-50 animate-pulse rounded-xl" />
            </div>
        );
    }

    const list = Array.isArray(data) ? data : [];

    const sections = Object.entries(PANEL_SECTIONS)
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
        .sort((a, b) => b.views - a.views);

    const maxViews = Math.max(...sections.map((s) => s.views), 1);

    return (
        <div>
            <h3 className="chart-title mb-1">
                Secciones más usadas del panel
            </h3>
            <p className="text-gray-400 text-xs mb-6">
                Actividad de alumnos por sección
            </p>
            {sections.length === 0 ? (
                <p className="text-sm text-gray-400">
                    Sin datos para este período
                </p>
            ) : (
                <ul className="space-y-4">
                    {sections.map((item, idx) => {
                        const opacity =
                            maxViews > 0
                                ? 0.2 + (item.views / maxViews) * 0.8
                                : 0.2;
                        return (
                            <li
                                key={`panel-sec-${item.label}-${idx}`}
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
                                                width: `${(item.views / maxViews) * 100}%`,
                                                backgroundColor: "#2563eb",
                                                opacity,
                                            }}
                                        />
                                    </div>
                                    <span className="shrink-0 text-right text-sm font-bold tabular-nums text-black whitespace-nowrap">
                                        {item.views.toLocaleString()}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
