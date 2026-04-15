import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getGA4Client, GA4_PROPERTY_ID, getRealtimeSegmentFilter } from "@/lib/ga-api";

import { NextResponse } from "next/server";

function headerIndex(headers, name) {
    if (!headers?.length) return -1;
    return headers.findIndex((h) => h?.name === name);
}

function rowDimensionValues(row) {
    return row.dimensionValues ?? row.dimension_values ?? [];
}

function rowMetricValues(row) {
    return row.metricValues ?? row.metric_values ?? [];
}

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
        const baseDimensions = [
            { name: "country" },
            { name: "countryId" },
        ];

        if (dimensionFilter) {
            baseDimensions.push({ name: "unifiedScreenName" });
        }

        const gaRequest = {
            property: `properties/${GA4_PROPERTY_ID}`,
            metrics: [{ name: "activeUsers" }],
            dimensions: baseDimensions,
        };

        if (dimensionFilter) {
            gaRequest.dimensionFilter = dimensionFilter;
        }

        const [response] = await client.runRealtimeReport(gaRequest);

        const rows = response.rows || [];
        const dimHeaders =
            response.dimensionHeaders ?? response.dimension_headers ?? [];
        const metricHeaders =
            response.metricHeaders ?? response.metric_headers ?? [];

        const countryIdx = headerIndex(dimHeaders, "country");
        const countryIdIdx = headerIndex(dimHeaders, "countryId");
        const activeUsersIdx = headerIndex(metricHeaders, "activeUsers");
        const metricCol =
            activeUsersIdx >= 0 ? activeUsersIdx : 0;

        const countries = rows.map((row) => {
                const dims = rowDimensionValues(row);
                const metrics = rowMetricValues(row);

                const name =
                    countryIdx >= 0
                        ? (dims[countryIdx]?.value ?? "").trim()
                        : (dims[0]?.value ?? "").trim();
                const iso =
                    countryIdIdx >= 0
                        ? (dims[countryIdIdx]?.value ?? "").trim()
                        : "";

                const country =
                    name || iso || "Desconocido";

                const activeUsers = parseInt(
                    metrics[metricCol]?.value ?? "0",
                    10
                );

                return { country, activeUsers };
            });

        const grouped = countries.reduce((acc, row) => {
            const existing = acc.find((c) => c.country === row.country);
            if (existing) {
                existing.activeUsers += row.activeUsers;
            } else {
                acc.push({ ...row });
            }
            return acc;
        }, []);

        const sorted = grouped
            .filter((c) => c.country && c.country !== "Desconocido" || c.activeUsers > 0)
            .sort((a, b) => b.activeUsers - a.activeUsers);

        const activeUsers = sorted.reduce((acc, c) => acc + c.activeUsers, 0);

        return NextResponse.json({
            activeUsers,
            countries: sorted.slice(0, 10),
        });

    } catch (error) {
        console.error("GA4 Realtime Error:", error);
        console.error("GA4 Realtime Error DETALLE:", {
            message: error.message,
            code: error.code,
            status: error.status,
            details: JSON.stringify(error.details || error.errors || {}),
        });
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
