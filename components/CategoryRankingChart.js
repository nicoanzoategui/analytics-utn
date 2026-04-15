"use client";

export default function CategoryRankingChart({ data = [], loading = false }) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-6 w-48 bg-gray-50 animate-pulse rounded-lg" />
                <div className="h-4 w-64 bg-gray-50 animate-pulse rounded" />
                <div className="h-40 bg-gray-50 animate-pulse rounded-xl" />
            </div>
        );
    }

    const cats = data
        .filter((d) => d.page?.includes("/listado/Categorias["))
        .map((d) => {
            const match = d.page.match(/Categorias\[([^\]]+)\]/);
            const raw = match?.[1] || "otra";
            const slug = raw.toLowerCase();
            const label = raw
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
            return { categoria: label, slug, views: d.views };
        })
        .reduce((acc, item) => {
            const existing = acc.find((c) => c.slug === item.slug);
            if (existing) existing.views += item.views;
            else acc.push({ ...item });
            return acc;
        }, [])
        .sort((a, b) => b.views - a.views)
        .slice(0, 8);

    const maxViews = Math.max(...cats.map((c) => c.views), 1);

    return (
        <div>
            <h3 className="chart-title mb-1">Categorías más buscadas</h3>
            <p className="text-gray-400 text-xs mb-6">
                Áreas de interés en web pública
            </p>
            {cats.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos para este período</p>
            ) : (
                <ul className="space-y-4">
                    {cats.map((item, idx) => {
                        const opacity =
                            maxViews > 0
                                ? 0.2 + (item.views / maxViews) * 0.8
                                : 0.2;
                        return (
                            <li
                                key={`cat-${item.slug}-${idx}`}
                                className="flex flex-col gap-2"
                            >
                                <span className="text-sm font-medium text-black break-words">
                                    {item.categoria}
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
