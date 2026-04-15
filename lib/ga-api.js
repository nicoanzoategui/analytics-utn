import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { OAuth2Client } from "google-auth-library";

/**
 * Get an authenticated GA4 Data API client using the user's access token.
 * Includes patches for getUniverseDomain and getClient to fix compatibility issues
 * with google-gax and google-auth-library in modern Next.js/Turbopack environments.
 * @param {string} accessToken - The access token from the session
 * @returns {BetaAnalyticsDataClient}
 */
export function getGA4Client(accessToken) {
    const auth = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({ access_token: accessToken });

    // Patch for compatibility
    if (typeof auth.getUniverseDomain !== 'function') {
        auth.getUniverseDomain = () => 'googleapis.com';
    }

    if (typeof auth.getClient !== 'function') {
        auth.getClient = async () => auth;
    }

    return new BetaAnalyticsDataClient({ auth, transport: 'rest' });
}

export function getSegmentFilter(segment) {
    if (segment === "panel") {
        return {
            filter: {
                fieldName: "pagePath",
                stringFilter: { matchType: "CONTAINS", value: "/panel/" }
            }
        };
    }
    if (segment === "public") {
        return {
            notExpression: {
                filter: {
                    fieldName: "pagePath",
                    stringFilter: { matchType: "CONTAINS", value: "/panel/" }
                }
            }
        };
    }
    return null;
}

export function getRealtimeSegmentFilter(segment) {
    if (segment === "panel") {
        return {
            filter: {
                fieldName: "unifiedScreenName",
                stringFilter: { matchType: "CONTAINS", value: "/panel/" }
            }
        };
    }
    if (segment === "public") {
        return {
            notExpression: {
                filter: {
                    fieldName: "unifiedScreenName",
                    stringFilter: { matchType: "CONTAINS", value: "/panel/" }
                }
            }
        };
    }
    return null;
}


export function getDateRange(searchParams) {
    let startDate = searchParams.get("startDate");
    let endDate = searchParams.get("endDate");
    const days = searchParams.get("days");

    // Sanitise stringified null/undefined
    if (startDate === "null" || startDate === "undefined") startDate = null;
    if (endDate === "null" || endDate === "undefined") endDate = null;

    if (!startDate) {
        startDate = days ? `${days}daysAgo` : "7daysAgo";
    }
    if (!endDate) {
        endDate = "yesterday";
    }

    return { startDate, endDate };
}

/**
 * Calculates a comparison date range for the period immediately preceding the given range.
 */
export function getComparisonRange(startDate, endDate) {
    // If using 'XdaysAgo' format
    if (startDate.includes("daysAgo")) {
        const days = parseInt(startDate.replace("daysAgo", ""));
        return {
            startDate: `${days * 2}daysAgo`,
            endDate: `${days + 1}daysAgo`
        };
    }

    // If using absolute dates YYYY-MM-DD
    try {
        const start = new Date(startDate);
        const end = new Date(endDate === "yesterday" ? new Date().setDate(new Date().getDate() - 1) : endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { startDate: "14daysAgo", endDate: "8daysAgo" };
        }

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const prevEnd = new Date(start);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - diffDays + 1);

        return {
            startDate: prevStart.toISOString().split('T')[0],
            endDate: prevEnd.toISOString().split('T')[0]
        };
    } catch (e) {
        return { startDate: "14daysAgo", endDate: "8daysAgo" };
    }
}




export const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
