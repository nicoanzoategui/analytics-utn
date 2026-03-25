export default function RealtimeCountriesTable({ data, loading = false }) {
    if (loading) {
        return (
            <div className="bg-[#f5f5f5] p-6 rounded-xl border border-[#e0e0e0] h-[300px] animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f5f5f5] p-8 rounded-[2.5rem] border border-gray-100 min-h-[300px] shadow-sm">
            <div className="flex items-center justify-between mb-8 overflow-hidden">
                <div>
                    <h3 className="text-lg font-bold text-black">Top Países</h3>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">En tiempo real</p>
                </div>
                <div className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-200">
                            <th className="pb-3 font-semibold">País</th>
                            <th className="pb-3 font-semibold text-right">Usuarios</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data?.length > 0 ? (
                            data.map((row, index) => (
                                <tr key={index} className="text-sm">
                                    <td className="py-4 font-medium">{row.country}</td>
                                    <td className="py-4 text-right font-bold">{row.activeUsers}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="2" className="py-8 text-center text-gray-400 text-sm">
                                    Sin datos en tiempo real
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
