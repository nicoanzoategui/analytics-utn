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
        console.log(`[Login Botones API] Fetching enhanced measurements for property ${GA4_PROPERTY_ID}`);

        // Buscar eventos con link_text (enhanced measurement de GA4)
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
                                stringFilter: { matchType: "CONTAINS", value: "login" }
                            }
                        },
                        {
                            orGroup: {
                                expressions: [
                                    {
                                        filter: {
                                            fieldName: "linkText",
                                            stringFilter: { matchType: "CONTAINS", value: "Google" }
                                        }
                                    },
                                    {
                                        filter: {
                                            fieldName: "linkText",
                                            stringFilter: { matchType: "CONTAINS", value: "LinkedIn" }
                                        }
                                    },
                                    {
                                        filter: {
                                            fieldName: "linkText",
                                            stringFilter: { matchType: "CONTAINS", value: "Ingresar" }
                                        }
                                    },
                                ]
                            }
                        }
                    ]
                }
            },
            metrics: [
                { name: "eventCount" },
                { name: "totalUsers" },
            ],
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
            limit: 50,
        });

        const clicks = (response.rows || []).map((row) => ({
            evento: row.dimensionValues[0]?.value || "",
            textoBoton: row.dimensionValues[1]?.value || "",
            url: row.dimensionValues[2]?.value || "",
            clicks: parseInt(row.metricValues[0]?.value || "0"),
            usuarios: parseInt(row.metricValues[1]?.value || "0"),
        }));

        return NextResponse.json({
            clicks,
            totalClicks: clicks.reduce((sum, c) => sum + c.clicks, 0),
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
