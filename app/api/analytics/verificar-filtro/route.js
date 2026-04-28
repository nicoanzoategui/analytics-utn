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
        // 1. SIN filtro - todas las páginas
        const [sinFiltro] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "pagePath" }],
            metrics: [
                { name: "activeUsers" },
                { name: "screenPageViews" },
            ],
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
            limit: 20,
        });

        // 2. CON filtro panel
        const [conFiltroPanel] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "pagePath" }],
            dimensionFilter: {
                filter: {
                    fieldName: "pagePath",
                    stringFilter: { matchType: "CONTAINS", value: "/panel/" }
                }
            },
            metrics: [
                { name: "activeUsers" },
                { name: "screenPageViews" },
            ],
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
            limit: 20,
        });

        // 3. SIN panel (público)
        const [sinPanel] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "pagePath" }],
            dimensionFilter: {
                notExpression: {
                    filter: {
                        fieldName: "pagePath",
                        stringFilter: { matchType: "CONTAINS", value: "/panel/" }
                    }
                }
            },
            metrics: [
                { name: "activeUsers" },
                { name: "screenPageViews" },
            ],
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
            limit: 20,
        });

        const formatData = (rows) => (rows || []).map(row => ({
            pagina: row.dimensionValues[0]?.value || "",
            usuarios: parseInt(row.metricValues[0]?.value || "0"),
            vistas: parseInt(row.metricValues[1]?.value || "0"),
        }));

        return NextResponse.json({
            sinFiltro: {
                paginas: formatData(sinFiltro.rows),
                totalUsuarios: formatData(sinFiltro.rows).reduce((sum, p) => sum + p.usuarios, 0),
            },
            conPanel: {
                paginas: formatData(conFiltroPanel.rows),
                totalUsuarios: formatData(conFiltroPanel.rows).reduce((sum, p) => sum + p.usuarios, 0),
            },
            sinPanel: {
                paginas: formatData(sinPanel.rows),
                totalUsuarios: formatData(sinPanel.rows).reduce((sum, p) => sum + p.usuarios, 0),
            },
            periodo: { startDate, endDate },
        });
    } catch (error) {
        console.error("GA4 Error:", error);
        return NextResponse.json(
            { error: "Error al verificar filtro", details: error.message },
            { status: 500 }
        );
    }
}
