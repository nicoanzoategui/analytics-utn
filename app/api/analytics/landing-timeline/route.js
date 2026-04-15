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

    let startDate, endDate;

    if (startOld && endOld && startNew && endNew) {
        const allDates = [
            new Date(startOld),
            new Date(endOld),
            new Date(startNew),
            new Date(endNew),
        ];
        startDate = new Date(Math.min(...allDates)).toISOString().split("T")[0];
        endDate = new Date(Math.max(...allDates)).toISOString().split("T")[0];
    } else if (cutoffDate) {
        const cutoff = new Date(cutoffDate);
        const dateNewEnd = new Date(cutoff);
        dateNewEnd.setDate(dateNewEnd.getDate() + daysAfter - 1);
        const dateOldStart = new Date(cutoff);
        dateOldStart.setDate(dateOldStart.getDate() - daysBefore);

        startDate = dateOldStart.toISOString().split("T")[0];
        endDate = dateNewEnd.toISOString().split("T")[0];
    } else {
        return NextResponse.json(
            { error: "Falta fecha de corte o rangos" },
            { status: 400 },
        );
    }

    const client = getGA4Client(session.accessToken);

    try {
        const [response] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "date" }, { name: "eventName" }],
            metrics: [{ name: "eventCount" }, { name: "activeUsers" }],
            dimensionFilter: {
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
                                    matchType: "IN_LIST",
                                    inListFilter: {
                                        values: [
                                            "page_view",
                                            "click_inscription",
                                            "chatbot_open_whatsapp",
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
            orderBys: [{ dimension: { dimensionName: "date" } }],
        });

        const timeline = {};

        response.rows?.forEach((row) => {
            const dateStr = row.dimensionValues[0].value;
            const eventName = row.dimensionValues[1].value;
            const count = parseInt(row.metricValues[0].value || "0", 10);
            const activeUsers = parseInt(
                row.metricValues[1].value || "0",
                10,
            );

            const formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;

            if (!timeline[formattedDate]) {
                timeline[formattedDate] = {
                    date: formattedDate,
                    pageViews: 0,
                    users: 0,
                    clicks_inscription: 0,
                    clicks_whatsapp: 0,
                    clicks: 0,
                    conversionRate: 0,
                };
            }

            if (eventName === "page_view") {
                timeline[formattedDate].pageViews += count;
            } else if (eventName === "click_inscription") {
                timeline[formattedDate].clicks_inscription += count;
            } else if (eventName === "chatbot_open_whatsapp") {
                timeline[formattedDate].clicks_whatsapp += count;
            }
            timeline[formattedDate].users += activeUsers;
        });

        const data = Object.values(timeline)
            .map((item) => {
                item.clicks =
                    item.clicks_inscription + item.clicks_whatsapp;
                item.conversionRate =
                    item.users > 0 ? (item.clicks / item.users) * 100 : 0;
                return item;
            })
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json(data);
    } catch (error) {
        console.error("GA4 Landing Timeline Error:", error);
        return NextResponse.json(
            { error: "Error al obtener timeline", details: error.message },
            { status: 500 },
        );
    }
}
