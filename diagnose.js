const http = require('http');
const dns = require('dns');

console.log("🔍 Iniciando Diagnóstico de Analytics UTN...\n");

// 1. Check Port 4000
const req = http.get('http://localhost:4000', (res) => {
    console.log("✅ Servidor detectado en http://localhost:4000 (Status: " + res.statusCode + ")");
}).on('error', (e) => {
    console.log("❌ NO hay nada corriendo en http://localhost:4000. ¿Corriste 'npm run dev -- -p 4000'?");
});

// 2. Check Google API Reachability
dns.lookup('analyticsdata.googleapis.com', (err) => {
    if (err) {
        console.log("❌ Error de DNS: No se puede llegar a Google Analytics API.");
    } else {
        console.log("✅ Conexión con Google API disponible.");
    }
});

// 3. Check ENV consistency
const fs = require('fs');
if (fs.existsSync('.env.local')) {
    const env = fs.readFileSync('.env.local', 'utf8');
    if (!env.includes('NEXTAUTH_URL=http://localhost:4000')) {
        console.log("⚠️ Advertencia: NEXTAUTH_URL en .env.local no coincide con http://localhost:4000");
    } else {
        console.log("✅ .env.local configurado correctamente para el puerto 4000.");
    }
} else {
    console.log("❌ No se encontró el archivo .env.local.");
}

setTimeout(() => {
    console.log("\n💡 Pasame el resultado de este diagnóstico para poder ayudarte mejor.");
    process.exit();
}, 2000);
