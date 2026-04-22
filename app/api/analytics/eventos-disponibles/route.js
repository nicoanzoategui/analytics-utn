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
        console.log(`[Eventos Disponibles API] Fetching events for property ${GA4_PROPERTY_ID}`);

        const [response] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "eventName" }],
            metrics: [
                { name: "eventCount" },
                { name: "eventCountPerUser" },
            ],
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
            limit: 100,
        });

        const eventos = (response.rows || []).map((row) => ({
            nombre: row.dimensionValues[0]?.value || "",
            totalEventos: parseInt(row.metricValues[0]?.value || "0"),
            eventosPorUsuario: parseFloat(row.metricValues[1]?.value || "0"),
        }));

        console.log(`[Eventos Disponibles API] Found ${eventos.length} events`);

        return NextResponse.json({
            eventos,
            periodo: { startDate, endDate },
        });
    } catch (error) {
        console.error("GA4 Error al listar eventos:", error);
        return NextResponse.json(
            { error: "Error al obtener eventos de GA4", details: error.message },
            { status: 500 }
        );
    }
}
