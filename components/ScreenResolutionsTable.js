"use client";

export default function ScreenResolutionsTable({ data, loading }) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-gray-50 animate-pulse rounded-lg" />
                <div className="h-48 bg-gray-50 animate-pulse rounded-xl" />
            </div>
        );
    }

    const totalUsers = data.reduce((acc, current) => acc + current.activeUsers, 0);

    const getResolutionType = (res) => {
        const parts = res.split("x");
        if (parts.length < 1) return "HD";
        const width = parseInt(parts[0]);
        if (width >= 1920) return "Full HD / 4K";
        if (width >= 1280) return "HD";
        if (width >= 768) return "Tablet";
        return "Mobile";
    };

    const getBadgeStyle = (type) => {
        switch (type) {
            case "Full HD / 4K": return "border-black text-black bg-black/5";
            case "HD": return "border-gray-200 text-gray-800";
            case "Tablet": return "border-gray-100 text-gray-500 opacity-80";
            case "Mobile": return "border-gray-100 text-gray-400 opacity-60";
            default: return "border-gray-50 text-gray-400";
        }
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resolución</th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tipo</th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Usuarios</th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">% del total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.slice(0, 10).map((item, idx) => {
                        const type = getResolutionType(item.resolution);
                        return (
                            <tr key={idx} className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 rounded-xl">
                                <td className="py-4 px-2">
                                    <span className="text-sm font-bold text-black font-mono">{item.resolution}</span>
                                </td>
                                <td className="py-4 px-2 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tight border ${getBadgeStyle(type)}`}>
                                        {type}
                                    </span>
                                </td>
                                <td className="py-4 px-2 text-right font-mono text-sm text-black">
                                    {item.activeUsers.toLocaleString()}
                                </td>
                                <td className="py-4 px-2 text-right">
                                    <span className="text-sm font-bold text-black opacity-40">
                                        {((item.activeUsers / totalUsers) * 100).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
