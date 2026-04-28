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

/**
 * GA4 `runRealtimeReport` no expone `pagePath` (solo títulos vía `unifiedScreenName`, etc.).
 * Un filtro tipo CONTAINS "/panel/" sobre `unifiedScreenName` no coincide con URLs → siempre 0.
 * Los reportes históricos sí usan `pagePath` en {@link getSegmentFilter}.
 * Hasta que Realtime incluya ruta, el tiempo real es global a la propiedad.
 * @returns {null}
 */
export function getRealtimeSegmentFilter(_segment) {
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

export { getComparisonRange } from "./comparison-range";


export const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
