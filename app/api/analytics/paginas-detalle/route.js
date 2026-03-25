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
                { name: "activeUsers" },
                { name: "engagementRate" },
                { name: "averageSessionDuration" },
                { name: "bounceRate" },
                { name: "keyEvents" },
            ],
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
            limit: 10,
        });

        const rows = response.rows || [];
        const data = rows.map((row) => ({
            page: row.dimensionValues[0].value,
            views: parseInt(row.metricValues[0].value),
            users: parseInt(row.metricValues[1].value),
            engagementRate: parseFloat(row.metricValues[2].value),
            avgDuration: parseFloat(row.metricValues[3].value),
            bounceRate: parseFloat(row.metricValues[4].value),
            conversions: parseInt(row.metricValues[5].value),
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error("GA4 Error Detailed Pages:", error);
        return NextResponse.json({ error: "Error al obtener detalle de páginas" }, { status: 500 });
    }
}
