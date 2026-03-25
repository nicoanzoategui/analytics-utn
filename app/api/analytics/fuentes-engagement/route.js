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
            dimensions: [{ name: "sessionSource" }],
            metrics: [
                { name: "activeUsers" },
                { name: "engagementRate" },
                { name: "averageSessionDuration" },
            ],
            orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
            limit: 10,
        });

        const rows = response.rows || [];
        const data = rows.map((row) => ({
            source: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value),
            engagementRate: parseFloat(row.metricValues[1].value),
            avgDuration: parseFloat(row.metricValues[2].value),
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error("GA4 Error Sources Engagement:", error);
        return NextResponse.json({ error: "Error al obtener engagement de fuentes" }, { status: 500 });
    }
}
