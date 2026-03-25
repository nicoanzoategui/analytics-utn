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
            dimensions: [{ name: "dayOfWeek" }],
            metrics: [{ name: "activeUsers" }],
            orderBys: [{ dimension: { dimensionName: "dayOfWeek" }, desc: false }],
        });

        const rows = response.rows || [];
        const data = rows.map((row) => ({
            day: parseInt(row.dimensionValues[0].value),
            users: parseInt(row.metricValues[0].value),
        }));

        // Day of week mapping: 0-6 (Sun-Sat)
        const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const fullData = Array.from({ length: 7 }, (_, i) => {
            const entry = data.find(d => d.day === i);
            return {
                day: dayNames[i],
                users: entry ? entry.users : 0,
            };
        });

        return NextResponse.json(fullData);
    } catch (error) {
        console.error("GA4 Error:", error);
        return NextResponse.json({ error: "Error al obtener días" }, { status: 500 });
    }
}
