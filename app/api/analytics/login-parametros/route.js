import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getGA4Client, GA4_PROPERTY_ID } from "@/lib/ga-api";
import { NextResponse } from "next/server";

function matchesLoginRelevance(dim) {
    const ui = (dim.uiName || "").toLowerCase();
    const api = (dim.apiName || "").toLowerCase();
    return (
        ui.includes("login") ||
        ui.includes("method") ||
        ui.includes("tipo") ||
        api.includes("login") ||
        api.includes("method")
    );
}

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const client = getGA4Client(session.accessToken);

    try {
        console.log(`[Login Parametros API] Fetching metadata for property ${GA4_PROPERTY_ID}`);

        // Metadata GA4: dimensiones con customDefinition === true son definiciones personalizadas
        const [meta] = await client.getMetadata({
            name: `properties/${GA4_PROPERTY_ID}/metadata`,
        });

        const customDimensions = (meta.dimensions || []).filter((d) => d.customDefinition);

        const dimensionesRelevantes = customDimensions.filter(matchesLoginRelevance);

        const todasDimensiones = customDimensions.map((dim) => ({
            nombre: dim.uiName,
            parametro: dim.apiName,
            apiName: dim.apiName,
        }));

        return NextResponse.json({
            dimensionesRelevantes: dimensionesRelevantes.map((dim) => ({
                nombre: dim.uiName,
                parametro: dim.apiName,
                apiName: dim.apiName,
                descripcion: dim.description,
            })),
            todasDimensiones,
            totalDimensiones: todasDimensiones.length,
        });
    } catch (error) {
        console.error("GA4 Error al obtener parámetros:", error);
        return NextResponse.json(
            { error: "Error al obtener parámetros", details: error.message },
            { status: 500 }
        );
    }
}
