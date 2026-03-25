import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getGA4Client, GA4_PROPERTY_ID } from "@/lib/ga-api";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cutoffDate = searchParams.get("cutoffDate");
    const startOld = searchParams.get("startOld");
    const endOld = searchParams.get("endOld");
    const startNew = searchParams.get("startNew");
    const endNew = searchParams.get("endNew");
    const daysBefore = parseInt(searchParams.get("daysBefore")) || 28;
    const daysAfter = parseInt(searchParams.get("daysAfter")) || 28;

    let rangeOld, rangeNew;

    if (startOld && endOld && startNew && endNew) {
        rangeOld = { startDate: startOld, endDate: endOld };
        rangeNew = { startDate: startNew, endDate: endNew };
    } else if (cutoffDate) {
        const cutoff = new Date(cutoffDate);
        
        const dateNewStart = new Date(cutoff);
        const dateNewEnd = new Date(cutoff);
        dateNewEnd.setDate(dateNewEnd.getDate() + daysAfter - 1);

        const dateOldEnd = new Date(cutoff);
        dateOldEnd.setDate(dateOldEnd.getDate() - 1);
        const dateOldStart = new Date(dateOldEnd);
        dateOldStart.setDate(dateOldStart.getDate() - daysBefore + 1);

        rangeOld = { 
            startDate: dateOldStart.toISOString().split('T')[0], 
            endDate: dateOldEnd.toISOString().split('T')[0] 
        };
        rangeNew = { 
            startDate: dateNewStart.toISOString().split('T')[0], 
            endDate: dateNewEnd.toISOString().split('T')[0] 
        };
    } else {
        return NextResponse.json({ error: "Falta fecha de corte o rangos" }, { status: 400 });
    }

    const client = getGA4Client(session.accessToken);

    const getMetricsForRange = async (range) => {
        const [pageRes, clickRes] = await Promise.all([
            client.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                dateRanges: [range],
                metrics: [
                    { name: "screenPageViews" },
                    { name: "averageSessionDuration" }
                ],
                dimensionFilter: {
                    filter: {
                        fieldName: "pagePath",
                        stringFilter: {
                            matchType: "BEGINS_WITH",
                            value: "/e-learning/detalle/carrera/"
                        }
                    }
                }
            }),
            client.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                dateRanges: [range],
                metrics: [
                    { name: "eventCount" }
                ],
                dimensionFilter: {
                    andGroup: {
                        expressions: [
                            {
                                filter: {
                                    fieldName: "pagePath",
                                    stringFilter: {
                                        matchType: "BEGINS_WITH",
                                        value: "/e-learning/detalle/carrera/"
                                    }
                                }
                            },
                            {
                                filter: {
                                    fieldName: "eventName",
                                    stringFilter: {
                                        matchType: "EXACT",
                                        value: "click_inscription"
                                    }
                                }
                            }
                        ]
                    }
                }
            })
        ]);

        const pageRow = pageRes[0].rows?.[0] || { metricValues: [{value: "0"}, {value: "0"}] };
        const clickRow = clickRes[0].rows?.[0] || { metricValues: [{value: "0"}] };

        return {
            views: parseInt(pageRow.metricValues[0].value || "0"),
            duration: parseFloat(pageRow.metricValues[1].value || "0"),
            clicks: parseInt(clickRow.metricValues[0].value || "0")
        };
    };

    try {
        const [oldMetrics, newMetrics] = await Promise.all([
            getMetricsForRange(rangeOld),
            getMetricsForRange(rangeNew)
        ]);

        const data = {
            old: {
                ...oldMetrics,
                conversion: oldMetrics.views > 0 ? (oldMetrics.clicks / oldMetrics.views) * 100 : 0,
                range: rangeOld
            },
            new: {
                ...newMetrics,
                conversion: newMetrics.views > 0 ? (newMetrics.clicks / newMetrics.views) * 100 : 0,
                range: rangeNew
            }
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error("GA4 Landing Comparison Error:", error);
        return NextResponse.json({ error: "Error al obtener comparación de landing", details: error.message }, { status: 500 });
    }
}
