import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
    getGA4Client,
    GA4_PROPERTY_ID,
    getSegmentFilter,
    getDateRange,
} from "@/lib/ga-api";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
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
            limit: 50,
        });

        const rows = response.rows || [];
        const tipos = {
            curso: "Curso",
            carrera: "Carrera",
            diplomatura: "Diplomatura",
            "experto-universitario": "Experto",
            experto: "Experto",
            posgrado: "Posgrado",
        };

        const data = rows
            .filter((row) =>
                row.dimensionValues[0].value.includes("/detalle/")
            )
            .map((row) => {
                const page = row.dimensionValues[0].value;
                const parts = page.split("/").filter(Boolean);
                const detIdx = parts.indexOf("detalle");
                const tipoRaw =
                    detIdx >= 0 ? parts[detIdx + 1] || "" : "";
                const nombreRaw = parts[parts.length - 1]
                    ?.replace(/-/g, " ")
                    ?.replace(/^\d+\s*/, "")
                    ?.trim();
                const primera = nombreRaw
                    ? nombreRaw.charAt(0).toUpperCase() + nombreRaw.slice(1)
                    : "";

                return {
                    nombre: primera || page,
                    tipo: tipos[tipoRaw.toLowerCase()] || "Curso",
                    views: parseInt(row.metricValues[0].value, 10),
                    users: parseInt(row.metricValues[1].value, 10),
                    page,
                };
            })
            .slice(0, 10);

        return NextResponse.json(data);
    } catch (error) {
        console.error("GA4 Error top-cursos:", error);
        return NextResponse.json(
            { error: "Error al obtener top cursos", details: error.message },
            { status: 500 }
        );
    }
}
