import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import InfoTooltip from "./InfoTooltip";

export default function MetricCard({ title, value, prevValue, type = "number", loading = false, info }) {
    if (loading) {
        return (
            <div className="bg-[#f5f5f5] p-6 rounded-xl border border-[#e0e0e0] animate-pulse">
                <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
        );
    }

    const calculateChange = () => {
        if (!prevValue || prevValue === 0) return 0;
        return ((value - prevValue) / prevValue) * 100;
    };

    const change = calculateChange();
    const isPositive = change > 0;
    const isNeutral = change === 0;

    const formatValue = (val) => {
        if (type === "duration") {
            const minutes = Math.floor(val / 60);
            const seconds = Math.floor(val % 60);
            return `${minutes}m ${seconds}s`;
        }
        if (type === "percent") return `${val.toFixed(1)}%`;
        return new Intl.NumberFormat().format(val);
    };

    const deltaClass = isNeutral ? "metric-delta-neutral" : isPositive ? "metric-delta-up" : "metric-delta-down";
    const deltaBg = isNeutral ? "bg-gray-50 border border-gray-100" : isPositive ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100";

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 relative group">
            {info && <InfoTooltip {...info} />}
            <p className="metric-label mb-4">
                {title}
            </p>
            <h3 className="metric-value mb-2">
                {formatValue(value)}
            </h3>

            <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full ${deltaBg} ${deltaClass}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : isNeutral ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{Math.abs(change).toFixed(1)}%</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">vs prev</span>
            </div>
        </div>
    );
}
