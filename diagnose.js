const http = require("http");
const dns = require("dns");
const fs = require("fs");

console.log("🔍 Iniciando Diagnóstico de Analytics UTN...\n");

function nextAuthOriginFromEnvLocal() {
    if (!fs.existsSync(".env.local")) return null;
    const raw = fs.readFileSync(".env.local", "utf8");
    const m = raw.match(/^NEXTAUTH_URL=(.+)$/m);
    if (!m) return null;
    let value = m[1].trim().replace(/^["']|["']$/g, "");
    if (!value.startsWith("http")) return null;
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
}

const checkOrigin = nextAuthOriginFromEnvLocal() || "http://localhost:3000";

const req = http.get(checkOrigin, (res) => {
    console.log(
        `✅ Respuesta en ${checkOrigin} (Status: ${res.statusCode})`
    );
}).on("error", () => {
    console.log(
        `❌ No hay servidor en ${checkOrigin}. ¿Corre la app ahí? (ej. npm run dev o el puerto de NEXTAUTH_URL)`
    );
});

dns.lookup("analyticsdata.googleapis.com", (err) => {
    if (err) {
        console.log("❌ Error de DNS: No se puede llegar a Google Analytics API.");
    } else {
        console.log("✅ Conexión con Google API disponible.");
    }
});

if (fs.existsSync(".env.local")) {
    const env = fs.readFileSync(".env.local", "utf8");
    const line = env.match(/^NEXTAUTH_URL=(.+)$/m);
    if (!line) {
        console.log("⚠️ No hay NEXTAUTH_URL en .env.local (NextAuth lo necesita para OAuth).");
    } else {
        const v = line[1].trim();
        console.log(`ℹ️ NEXTAUTH_URL=${v}`);
        console.log(
            `   En Google Cloud, la URI de redirección debe ser: ${v.replace(/\/$/, "")}/api/auth/callback/google`
        );
    }
} else {
    console.log("❌ No se encontró .env.local (copiá .env.example).");
}

setTimeout(() => {
    console.log("\n💡 Pasame el resultado de este diagnóstico para poder ayudarte mejor.");
    req.destroy();
    process.exit();
}, 2000);
