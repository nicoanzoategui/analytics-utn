import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
    getGA4Client,
    GA4_PROPERTY_ID,
    getSegmentFilter,
    getDateRange,
} from "@/lib/ga-api";
import { NextResponse } from "next/server";

function extractTipo(page) {
    const p = page.toLowerCase();
    if (p.includes("/detalle/curso/")) return "Curso";
    if (p.includes("/detalle/carrera/")) return "Carrera";
    if (p.includes("/detalle/diplomatura/")) return "Diplomatura";
    if (p.includes("/detalle/experto/")) return "Experto";
    return "Curso";
}

function extractNombre(page) {
    const parts = page.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    const spaced = last.replace(/-/g, " ").trim();
    if (!spaced) return "";
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");
    if (!categoria || !categoria.trim()) {
        return NextResponse.json(
            { error: "Falta el parámetro categoria" },
            { status: 400 }
        );
    }

    const segment = searchParams.get("segment") || "all";
    const { startDate, endDate } = getDateRange(searchParams);

    const client = getGA4Client(session.accessToken);
    const segmentFilter = getSegmentFilter(segment);

    const detalleFilter = {
        filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "CONTAINS", value: "/detalle/" },
        },
    };

    const dimensionFilter = segmentFilter
        ? { andGroup: { expressions: [detalleFilter, segmentFilter] } }
        : detalleFilter;

    try {
        const [response] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensionFilter,
            dimensions: [{ name: "pagePath" }],
            metrics: [
                { name: "screenPageViews" },
                { name: "activeUsers" },
            ],
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
            limit: 250,
        });

        const rows = response.rows || [];
        const slugNeedle = categoria.trim().toLowerCase();

        const mapped = rows
            .map((row) => {
                const page = row.dimensionValues[0].value;
                return {
                    page,
                    views: parseInt(row.metricValues[0].value, 10),
                    users: parseInt(row.metricValues[1].value, 10),
                };
            })
            .filter((row) => row.page.toLowerCase().includes(slugNeedle))
            .map((row) => ({
                ...row,
                tipo: extractTipo(row.page),
                nombre: extractNombre(row.page),
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10);

        return NextResponse.json(mapped);
    } catch (error) {
        console.error("GA4 Error categoria-detalle:", error);
        return NextResponse.json(
            { error: "Error al obtener detalle por categoría", details: error.message },
            { status: 500 }
        );
    }
}
