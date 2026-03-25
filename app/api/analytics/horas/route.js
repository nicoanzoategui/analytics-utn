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
            dimensions: [{ name: "hour" }],
            metrics: [{ name: "activeUsers" }],
            orderBys: [{ dimension: { dimensionName: "hour" }, desc: false }],
        });

        const rows = response.rows || [];
        const stats = rows.map((row) => ({
            hour: parseInt(row.dimensionValues[0].value),
            users: parseInt(row.metricValues[0].value),
        }));

        // Fill missing hours
        const hourMap = {};
        stats.forEach(s => hourMap[s.hour] = s.users);
        const fullStats = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            users: hourMap[i] || 0
        }));

        // Identify peaks
        const sorted = [...fullStats].sort((a, b) => b.users - a.users);
        const peaks = sorted.slice(0, 3).map(s => s.hour);

        return NextResponse.json({ stats: fullStats, peaks });
    } catch (error) {
        console.error("GA4 Error:", error);
        return NextResponse.json({ error: "Error al obtener horas" }, { status: 500 });
    }
}
