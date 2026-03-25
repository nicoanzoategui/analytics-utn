import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getGA4Client, GA4_PROPERTY_ID, getSegmentFilter, getDateRange } from "@/lib/ga-api";
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
    const dimensionFilter = getSegmentFilter(segment);

    try {
        const [response] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensionFilter: dimensionFilter || undefined,
            dimensions: [{ name: "pagePath" }],
            metrics: [
                { name: "screenPageViews" },
                { name: "averageSessionDuration" }
            ],
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
            limit: 15,
        });

        const rows = response.rows || [];
        const data = rows.map((row) => {
            const views = parseInt(row.metricValues[0].value);
            const duration = parseFloat(row.metricValues[1].value);

            let categoria = "Desconocido";
            if (duration < 60) categoria = "Visita corta"; // Also bounce but following user prompt labels
            else if (duration < 180) categoria = "Visita corta";
            else if (duration < 600) categoria = "Lectura normal";
            else categoria = "Estudio profundo";

            // If duration < 60, it's actually even shorter
            if (duration < 60) categoria = "Visita corta"; 

            return {
                pagePath: row.dimensionValues[0].value,
                screenPageViews: views,
                averageSessionDuration: duration,
                categoriaLectura: categoria
            };
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("GA4 Error Pages:", error);
        return NextResponse.json({ error: "Error al obtener páginas", details: error.message }, { status: 500 });
    }
}
