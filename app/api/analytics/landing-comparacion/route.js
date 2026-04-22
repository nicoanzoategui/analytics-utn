import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getGA4Client, GA4_PROPERTY_ID } from "@/lib/ga-api";
import { NextResponse } from "next/server";

/** Alineado con la UI: métricas solo en URLs de detalle de carrera (variantes de path en GA4). */
const CARRERA_PATH_SUBSTRING = "/e-learning/detalle/carrera";

const INSCRIPTION_EVENT_NAMES = ["click_inscription"];

function sumEventCountForCarreraPaths(rows, pathSubstring = CARRERA_PATH_SUBSTRING) {
    let total = 0;
    const needle = pathSubstring.toLowerCase();
    for (const row of rows || []) {
        const path = (row.dimensionValues?.[0]?.value || "").toLowerCase();
        if (!path.includes(needle)) continue;
        total += parseInt(row.metricValues?.[0]?.value || "0", 10);
    }
    return total;
}

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

    const eventOnCarreraLandingFilter = (eventName) => ({
        andGroup: {
            expressions: [
                {
                    filter: {
                        fieldName: "pagePath",
                        stringFilter: {
                            matchType: "BEGINS_WITH",
                            value: "/e-learning/detalle/carrera/",
                        },
                    },
                },
                {
                    filter: {
                        fieldName: "eventName",
                        stringFilter: {
                            matchType: "EXACT",
                            value: eventName,
                        },
                    },
                },
            ],
        },
    });

    const getMetricsForRange = async (range) => {
        const [pageRes, inscripcionRes, whatsappRes] = await Promise.all([
            client.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                dateRanges: [range],
                metrics: [
                    { name: "screenPageViews" },
                    { name: "activeUsers" },
                    { name: "averageSessionDuration" },
                ],
                dimensionFilter: {
                    filter: {
                        fieldName: "pagePath",
                        stringFilter: {
                            matchType: "BEGINS_WITH",
                            value: "/e-learning/detalle/carrera/",
                        },
                    },
                },
            }),
            client.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                dateRanges: [range],
                dimensions: [{ name: "pagePath" }],
                metrics: [{ name: "eventCount" }],
                dimensionFilter: {
                    filter: {
                        fieldName: "eventName",
                        stringFilter: {
                            matchType: "IN_LIST",
                            inListFilter: {
                                values: INSCRIPTION_EVENT_NAMES,
                            },
                        },
                    },
                },
                limit: 100000,
            }),
            client.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                dateRanges: [range],
                metrics: [{ name: "eventCount" }],
                dimensionFilter: eventOnCarreraLandingFilter(
                    "chatbot_open_whatsapp",
                ),
            }),
        ]);

        const pageRow = pageRes[0].rows?.[0] || {
            metricValues: [
                { value: "0" },
                { value: "0" },
                { value: "0" },
            ],
        };
        const whatsappRow =
            whatsappRes[0].rows?.[0] || { metricValues: [{ value: "0" }] };

        const views = parseInt(pageRow.metricValues[0].value || "0", 10);
        const users = parseInt(pageRow.metricValues[1].value || "0", 10);
        const duration = parseFloat(pageRow.metricValues[2].value || "0");
        const clicks_inscription = sumEventCountForCarreraPaths(
            inscripcionRes[0].rows,
        );
        const clicks_whatsapp = parseInt(
            whatsappRow.metricValues[0].value || "0",
            10,
        );
        const clicks = clicks_inscription + clicks_whatsapp;

        return {
            views,
            users,
            duration,
            clicks_inscription,
            clicks_whatsapp,
            clicks,
            conversion: users > 0 ? (clicks / users) * 100 : 0,
        };
    };

    try {
        const [oldMetrics, newMetrics] = await Promise.all([
            getMetricsForRange(rangeOld),
            getMetricsForRange(rangeNew)
        ]);

        const data = {
            old: { ...oldMetrics, range: rangeOld },
            new: { ...newMetrics, range: rangeNew },
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error("GA4 Landing Comparison Error:", error);
        return NextResponse.json({ error: "Error al obtener comparación de landing", details: error.message }, { status: 500 });
    }
}
