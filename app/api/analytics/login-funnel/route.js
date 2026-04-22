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
        console.log(`[Login Funnel API] Fetching login funnel for property ${GA4_PROPERTY_ID}`);

        // 1. Usuarios que vieron la página de login
        const [pageViewResponse] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "date" }],
            dimensionFilter: {
                andGroup: {
                    expressions: [
                        {
                            filter: {
                                fieldName: "eventName",
                                stringFilter: { matchType: "EXACT", value: "page_view" }
                            }
                        },
                        {
                            filter: {
                                fieldName: "pagePath",
                                stringFilter: { matchType: "EXACT", value: "/" }
                            }
                        }
                    ]
                }
            },
            metrics: [
                { name: "eventCount" },
                { name: "totalUsers" },
            ],
            orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
        });

        // 2. form_start en la página de login
        const [formStartResponse] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "date" }],
            dimensionFilter: {
                andGroup: {
                    expressions: [
                        {
                            filter: {
                                fieldName: "eventName",
                                stringFilter: { matchType: "EXACT", value: "form_start" }
                            }
                        },
                        {
                            filter: {
                                fieldName: "pagePath",
                                stringFilter: { matchType: "EXACT", value: "/" }
                            }
                        }
                    ]
                }
            },
            metrics: [
                { name: "eventCount" },
                { name: "totalUsers" },
            ],
            orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
        });

        // 3. Logins exitosos
        const [loginResponse] = await client.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "date" }],
            dimensionFilter: {
                filter: {
                    fieldName: "eventName",
                    stringFilter: { matchType: "EXACT", value: "login" }
                }
            },
            metrics: [
                { name: "eventCount" },
                { name: "totalUsers" },
            ],
            orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
        });

        // Procesar datos por fecha
        const funnelPorFecha = {};

        // Page views
        (pageViewResponse.rows || []).forEach(row => {
            const fecha = row.dimensionValues[0].value;
            if (!funnelPorFecha[fecha]) funnelPorFecha[fecha] = {};
            funnelPorFecha[fecha].vistas = parseInt(row.metricValues[0].value);
            funnelPorFecha[fecha].usuariosVistas = parseInt(row.metricValues[1].value);
        });

        // Form starts
        (formStartResponse.rows || []).forEach(row => {
            const fecha = row.dimensionValues[0].value;
            if (!funnelPorFecha[fecha]) funnelPorFecha[fecha] = {};
            funnelPorFecha[fecha].formStarts = parseInt(row.metricValues[0].value);
            funnelPorFecha[fecha].usuariosFormStart = parseInt(row.metricValues[1].value);
        });

        // Logins
        (loginResponse.rows || []).forEach(row => {
            const fecha = row.dimensionValues[0].value;
            if (!funnelPorFecha[fecha]) funnelPorFecha[fecha] = {};
            funnelPorFecha[fecha].logins = parseInt(row.metricValues[0].value);
            funnelPorFecha[fecha].usuariosLogin = parseInt(row.metricValues[1].value);
        });

        // Convertir a array y calcular tasas de conversión
        const funnel = Object.entries(funnelPorFecha).map(([fecha, datos]) => {
            const vistas = datos.vistas || 0;
            const formStarts = datos.formStarts || 0;
            const logins = datos.logins || 0;
            
            return {
                fecha,
                vistas,
                usuariosVistas: datos.usuariosVistas || 0,
                formStarts,
                usuariosFormStart: datos.usuariosFormStart || 0,
                logins,
                usuariosLogin: datos.usuariosLogin || 0,
                tasaInteraccion: vistas > 0 ? ((formStarts / vistas) * 100).toFixed(2) : 0,
                tasaConversion: vistas > 0 ? ((logins / vistas) * 100).toFixed(2) : 0,
                tasaExito: formStarts > 0 ? ((logins / formStarts) * 100).toFixed(2) : 0,
            };
        }).sort((a, b) => a.fecha.localeCompare(b.fecha));

        // Totales
        const totales = {
            vistas: funnel.reduce((sum, d) => sum + d.vistas, 0),
            formStarts: funnel.reduce((sum, d) => sum + d.formStarts, 0),
            logins: funnel.reduce((sum, d) => sum + d.logins, 0),
        };

        totales.tasaInteraccion = totales.vistas > 0 
            ? ((totales.formStarts / totales.vistas) * 100).toFixed(2) 
            : 0;
        totales.tasaConversion = totales.vistas > 0 
            ? ((totales.logins / totales.vistas) * 100).toFixed(2) 
            : 0;
        totales.tasaExito = totales.formStarts > 0 
            ? ((totales.logins / totales.formStarts) * 100).toFixed(2) 
            : 0;

        return NextResponse.json({
            funnel,
            totales,
            periodo: { startDate, endDate },
        });
    } catch (error) {
        console.error("GA4 Error al obtener funnel de login:", error);
        return NextResponse.json(
            { error: "Error al obtener funnel de login", details: error.message },
            { status: 500 }
        );
    }
}
