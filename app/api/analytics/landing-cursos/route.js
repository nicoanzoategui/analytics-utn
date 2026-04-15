import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
    getGA4Client,
    GA4_PROPERTY_ID,
    getSegmentFilter,
    getDateRange,
} from "@/lib/ga-api";
import { NextResponse } from "next/server";

const CURSO_PAGE_PREFIX = "/e-learning/detalle/curso/";

function cursoPathFilter() {
    return {
        filter: {
            fieldName: "pagePath",
            stringFilter: {
                matchType: "BEGINS_WITH",
                value: CURSO_PAGE_PREFIX,
            },
        },
    };
}

function filterCursoPages(segmentFilter) {
    const path = cursoPathFilter();
    if (!segmentFilter) return path;
    return {
        andGroup: {
            expressions: [path, segmentFilter],
        },
    };
}

function filterCursoClicks(segmentFilter) {
    const path = cursoPathFilter();
    const event = {
        filter: {
            fieldName: "eventName",
            stringFilter: {
                matchType: "EXACT",
                value: "click_inscription",
            },
        },
    };
    const expressions = segmentFilter
        ? [path, segmentFilter, event]
        : [path, event];
    return { andGroup: { expressions } };
}

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const segment = searchParams.get("segment") || "all";
    const { startDate, endDate } = getDateRange(searchParams);

    const client = getGA4Client(session.accessToken);
    const segmentFilter = getSegmentFilter(segment);
    const dateRange = { startDate, endDate };

    try {
        const [pageRes, clickRes] = await Promise.all([
            client.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                dateRanges: [dateRange],
                metrics: [
                    { name: "screenPageViews" },
                    { name: "activeUsers" },
                    { name: "averageSessionDuration" },
                ],
                dimensionFilter: filterCursoPages(segmentFilter),
            }),
            client.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                dateRanges: [dateRange],
                metrics: [{ name: "eventCount" }],
                dimensionFilter: filterCursoClicks(segmentFilter),
            }),
        ]);

        const pageRow = pageRes[0].rows?.[0] || {
            metricValues: [
                { value: "0" },
                { value: "0" },
                { value: "0" },
            ],
        };
        const clickRow = clickRes[0].rows?.[0] || {
            metricValues: [{ value: "0" }],
        };

        const views = parseInt(pageRow.metricValues[0].value || "0", 10);
        const users = parseInt(pageRow.metricValues[1].value || "0", 10);
        const duration = parseFloat(pageRow.metricValues[2].value || "0");
        const clicks = parseInt(clickRow.metricValues[0].value || "0", 10);
        const conversion = users > 0 ? (clicks / users) * 100 : 0;

        return NextResponse.json({
            views,
            users,
            duration,
            clicks,
            conversion,
        });
    } catch (error) {
        console.error("GA4 Landing Cursos Error:", error);
        return NextResponse.json(
            {
                error: "Error al obtener métricas de landing de cursos",
                details: error.message,
            },
            { status: 500 },
        );
    }
}
