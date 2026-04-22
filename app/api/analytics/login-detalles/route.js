import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getGA4Client, GA4_PROPERTY_ID, getDateRange } from "@/lib/ga-api";
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
        console.log(`[Login Detalles API] Fetching login event details for property ${GA4_PROPERTY_ID}`);

        // Query para ver todos los parámetros del evento login
        const [response] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [
                { name: "eventName" },
                { name: "customEvent:method" }, // método de login
                { name: "pagePath" },
            ],
            dimensionFilter: {
                filter: {
                    fieldName: "eventName",
                    stringFilter: { matchType: "EXACT", value: "login" }
                }
            },
            metrics: [
                { name: "eventCount" },
            ],
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
            limit: 100,
        });

        const detalles = (response.rows || []).map((row) => ({
            evento: row.dimensionValues[0]?.value || "",
            metodo: row.dimensionValues[1]?.value || "(not set)",
            pagina: row.dimensionValues[2]?.value || "",
            total: parseInt(row.metricValues[0]?.value || "0"),
        }));

        console.log(`[Login Detalles API] Found ${detalles.length} login variations`);

        return NextResponse.json({
            detalles,
            periodo: { startDate, endDate },
        });
    } catch (error) {
        console.error("GA4 Error al obtener detalles de login:", error);
        return NextResponse.json(
            { error: "Error al obtener detalles de login", details: error.message },
            { status: 500 }
        );
    }
}
