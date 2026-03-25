import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getGA4Client, GA4_PROPERTY_ID, getRealtimeSegmentFilter } from "@/lib/ga-api";

import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const segment = searchParams.get("segment") || "all";

    const client = getGA4Client(session.accessToken);
    const dimensionFilter = getRealtimeSegmentFilter(segment);

    try {
        const gaRequest = {
            property: `properties/${GA4_PROPERTY_ID}`,
            metrics: [{ name: "activeUsers" }],
            dimensions: [{ name: "country" }] // We always want country for the sidebar table
        };

        if (dimensionFilter) {
            gaRequest.dimensionFilter = dimensionFilter;
            // Realtime API requires dimensions we filter on to be in 'dimensions' too?
            // Actually no, but for multi-segment we might need pagePath in dimensions.
            // Let's keep it simple: filter by panel if requested.
        }

        const [response] = await client.runRealtimeReport(gaRequest);

        const rows = response.rows || [];
        
        // Extract countries and total users from rows
        const countries = rows.map(row => ({
            name: row.dimensionValues[0]?.value || "Desconocido",
            activeUsers: parseInt(row.metricValues[0]?.value || "0")
        })).sort((a, b) => b.activeUsers - a.activeUsers);

        const activeUsers = countries.reduce((acc, c) => acc + c.activeUsers, 0);

        // If no rows, we might need a separate call for total 0
        // (but standard GA4 returns rows for existing users)

        return NextResponse.json({ 
            activeUsers, 
            countries: countries.slice(0, 10) // Top 10 countries
        });

    } catch (error) {
        console.error("GA4 Realtime Error:", error);
        // Fallback to total users only if country dimension fails for some reason
        try {
            const [totalOnlyRes] = await client.runRealtimeReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                metrics: [{ name: "activeUsers" }]
            });
            const users = parseInt(totalOnlyRes.rows?.[0]?.metricValues[0]?.value || "0");
            return NextResponse.json({ activeUsers: users, countries: [] });
        } catch (innerError) {
             return NextResponse.json({ error: "Error al obtener usuarios en tiempo real", details: error.message }, { status: 500 });
        }
    }
}
