"use client";

export default function CountryDistributionTable({ data, loading }) {
    if (loading) {
        return <div className="h-64 bg-gray-50 animate-pulse rounded-2xl" />;
    }

    const maxUsers = Math.max(...data.map(d => d.activeUsers), 1);

    return (
        <div className="w-full">
            <div className="space-y-4">
                {data.slice(0, 8).map((country, idx) => {
                    const percentage = (country.activeUsers / maxUsers) * 100;

                    return (
                        <div key={idx} className="group">
                            <div className="flex items-center justify-between mb-1.5 px-1">
                                <span className="text-xs font-bold text-black uppercase tracking-tight">
                                    {country.country}
                                </span>
                                <span className="text-[10px] font-mono font-black text-gray-400">
                                    {country.activeUsers.toLocaleString()}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                <div
                                    className="h-full bg-black transition-all duration-1000 group-hover:bg-gray-800"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            {data.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400 italic">No hay datos geográficos disponibles</div>
            )}
        </div>
    );
}
