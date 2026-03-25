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
            dimensions: [{ name: "deviceCategory" }],
            metrics: [{ name: "activeUsers" }],
        });

        const rows = response.rows || [];
        const data = rows.map((row) => ({
            device: row.dimensionValues[0].value,
            activeUsers: parseInt(row.metricValues[0].value),
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error("GA4 Error:", error);
        return NextResponse.json({ error: "Error al obtener dispositivos" }, { status: 500 });
    }
}
