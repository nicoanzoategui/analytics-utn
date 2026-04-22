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
        console.log(`[Login Clicks API] Fetching click events for property ${GA4_PROPERTY_ID}`);

        // Buscar todos los eventos de tipo "click" en la página de login
        const [response] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [
                { name: "eventName" },
                { name: "linkText" },
                { name: "linkUrl" },
            ],
            dimensionFilter: {
                andGroup: {
                    expressions: [
                        {
                            filter: {
                                fieldName: "pagePath",
                                stringFilter: { matchType: "EXACT", value: "/" }
                            }
                        },
                        {
                            orGroup: {
                                expressions: [
                                    {
                                        filter: {
                                            fieldName: "eventName",
                                            stringFilter: { matchType: "CONTAINS", value: "click" }
                                        }
                                    },
                                    {
                                        filter: {
                                            fieldName: "eventName",
                                            stringFilter: { matchType: "EXACT", value: "select_item" }
                                        }
                                    },
                                ]
                            }
                        }
                    ]
                }
            },
            metrics: [{ name: "eventCount" }],
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
            limit: 50,
        });

        const clicks = (response.rows || []).map((row) => ({
            evento: row.dimensionValues[0]?.value || "",
            textoLink: row.dimensionValues[1]?.value || "(not set)",
            urlLink: row.dimensionValues[2]?.value || "(not set)",
            total: parseInt(row.metricValues[0]?.value || "0"),
        }));

        return NextResponse.json({
            clicks,
            total: clicks.reduce((sum, c) => sum + c.total, 0),
            periodo: { startDate, endDate },
        });
    } catch (error) {
        console.error("GA4 Error al obtener clicks:", error);
        return NextResponse.json(
            { error: "Error al obtener clicks", details: error.message },
            { status: 500 }
        );
    }
}
