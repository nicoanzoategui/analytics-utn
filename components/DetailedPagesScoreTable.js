"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export default function DetailedPagesScoreTable({ data, loading }) {
    const [page, setPage] = useState(0);
    const pageSize = 10;

    if (loading) {
        return <div className="h-96 bg-gray-50 animate-pulse rounded-2xl" />;
    }

    const totalPages = Math.ceil(data.length / pageSize);
    const currentData = data.slice(page * pageSize, (page + 1) * pageSize);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contenido</th>
                            <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Métricas</th>
                            <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Score de Calidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((item, idx) => (
                            <tr key={idx} className="group border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="py-5 px-2">
                                    <div className="max-w-[400px]">
                                        <p className="text-sm font-bold text-black truncate mb-1">{item.pageTitle}</p>
                                        <p className="text-[10px] text-gray-400 font-mono truncate">{item.pagePath}</p>
                                    </div>
                                </td>
                                <td className="py-5 px-2 text-right">
                                    <div className="inline-grid grid-cols-3 gap-6 text-right">
                                        <div>
                                            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter">Vistas</p>
                                            <p className="text-sm font-mono text-black">{item.screenPageViews}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter">Users</p>
                                            <p className="text-sm font-mono text-black">{item.activeUsers}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter">Tiempo</p>
                                            <p className="text-sm font-mono text-black">{formatDuration(item.averageSessionDuration)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-5 px-2 w-[240px]">
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className="flex items-center justify-between w-full px-1">
                                            <div className="flex items-center space-x-1">
                                                {item.scoreCalidad >= 70 && <Star className="w-3 h-3 text-black fill-black" />}
                                                <span className={`text-[10px] font-bold uppercase tracking-tight ${item.scoreCalidad >= 70 ? 'text-black' : 'text-gray-400'}`}>
                                                    {item.quality}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-black font-bold">{item.scoreCalidad}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${item.scoreCalidad >= 70 ? 'bg-black' : 'bg-gray-300'}`}
                                                style={{ width: `${item.scoreCalidad}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="text-xs text-gray-400 lg:col-span-1">Página {page + 1} de {totalPages}</span>
                    <div className="flex space-x-2">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 border border-gray-100 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={page === totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 border border-gray-100 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
