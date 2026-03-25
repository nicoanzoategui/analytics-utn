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
    const { startDate, endDate } = getDateRange(searchParams);

    const client = getGA4Client(session.accessToken);

    try {
        const publicFilter = getSegmentFilter("public");
        const panelFilter = getSegmentFilter("panel");

        const [publicRes, panelRes] = await Promise.all([
            client.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                dateRanges: [{ startDate, endDate }],
                dimensionFilter: publicFilter,
                metrics: [{ name: "activeUsers" }],
            }),
            client.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                dateRanges: [{ startDate, endDate }],
                dimensionFilter: panelFilter,
                metrics: [{ name: "activeUsers" }],
            })
        ]);

        const publicUsers = parseInt(publicRes[0].rows?.[0]?.metricValues[0].value || "0");
        const panelUsers = parseInt(panelRes[0].rows?.[0]?.metricValues[0].value || "0");

        const conversionRate = publicUsers > 0 ? (panelUsers / publicUsers) * 100 : 0;

        return NextResponse.json({
            publicUsers,
            panelUsers,
            conversionRate: parseFloat(conversionRate.toFixed(2))
        });
    } catch (error) {
        console.error("GA4 Conversion Error:", error);
        return NextResponse.json({ error: "Error al calcular conversión" }, { status: 500 });
    }
}
