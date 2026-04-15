import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getGA4Client, GA4_PROPERTY_ID, getSegmentFilter, getDateRange, getComparisonRange } from "@/lib/ga-api";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const segment = searchParams.get("segment") || "all";
    const { startDate, endDate } = getDateRange(searchParams);
    const { startDate: prevStartDate, endDate: prevEndDate } = getComparisonRange(startDate, endDate);

    const client = getGA4Client(session.accessToken);
    const dimensionFilter = getSegmentFilter(segment);

    try {
        console.log(`[Resumen API] Fetching GA4 data for property ${GA4_PROPERTY_ID}. Segment: ${segment}, Range: [${startDate}, ${endDate}], Prev: [${prevStartDate}, ${prevEndDate}]`);

        const [response] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [
                { startDate, endDate },
                { startDate: prevStartDate, endDate: prevEndDate },
            ],
            dimensionFilter: dimensionFilter || undefined,
            metrics: [
                { name: "activeUsers" },
                { name: "newUsers" },
                { name: "averageSessionDuration" },
                { name: "keyEvents" },
                { name: "engagementRate" },
                { name: "screenPageViewsPerSession" },
            ],
        });

        const rows = response.rows || [];
        console.log(`[Resumen API] GA4 response rows length: ${rows.length}`);

        const currentRows = rows.filter((row) =>
            row.dimensionValues?.some((d) => d.value === "date_range_0")
        );
        const previousRows = rows.filter((row) =>
            row.dimensionValues?.some((d) => d.value === "date_range_1")
        );

        const defaultMetricValues = Array(6).fill({ value: "0" });
        const currentM = currentRows[0]?.metricValues ?? defaultMetricValues;
        const previousM = previousRows[0]?.metricValues ?? defaultMetricValues;

        const parseMetrics = (metricValues) => {
            const activeUsers = parseInt(metricValues[0]?.value || "0");
            const newUsers = parseInt(metricValues[1]?.value || "0");
            const avgDuration = parseFloat(metricValues[2]?.value || "0");
            const keyEvents = parseInt(metricValues[3]?.value || "0");
            const engRate = parseFloat(metricValues[4]?.value || "0");
            const pvPerSession = parseFloat(metricValues[5]?.value || "0");

            const newUsersRate = activeUsers > 0 ? (newUsers / activeUsers) * 100 : 0;
            const engagementRate = Math.round(engRate * 100);

            return {
                activeUsers, newUsers, avgSessionDuration: avgDuration,
                keyEvents, engagementRate, screenPageViewsPerSession: pvPerSession,
                newUsersRate,
            };
        };

        const currentData = parseMetrics(currentM);
        const prevData = parseMetrics(previousM);

        const data = {
            activeUsers: { value: currentData.activeUsers, prevValue: prevData.activeUsers },
            newUsers: { value: currentData.newUsers, prevValue: prevData.newUsers },
            avgSessionDuration: { value: currentData.avgSessionDuration, prevValue: prevData.avgSessionDuration },
            keyEvents: { value: currentData.keyEvents, prevValue: prevData.keyEvents },
            engagementRate: { value: currentData.engagementRate, prevValue: prevData.engagementRate },
            newUsersRate: { value: currentData.newUsersRate, prevValue: prevData.newUsersRate },
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error("GA4 Error Summary:", error);
        return NextResponse.json({ error: "Error al obtener datos de GA4", details: error.message }, { status: 500 });
    }
}
