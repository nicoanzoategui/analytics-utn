/**
 * Rango de fechas inmediatamente anterior al [startDate, endDate],
 * con la misma cantidad de días (alineado con la API de resumen GA4).
 */
export function getComparisonRange(startDate, endDate) {
    if (startDate.includes("daysAgo")) {
        const days = parseInt(startDate.replace("daysAgo", ""), 10);
        return {
            startDate: `${days * 2}daysAgo`,
            endDate: `${days + 1}daysAgo`,
        };
    }

    try {
        const start = new Date(startDate);
        const end = new Date(
            endDate === "yesterday"
                ? new Date().setDate(new Date().getDate() - 1)
                : endDate,
        );

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
            startDate: prevStart.toISOString().split("T")[0],
            endDate: prevEnd.toISOString().split("T")[0],
        };
    } catch {
        return { startDate: "14daysAgo", endDate: "8daysAgo" };
    }
}
