"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

export default function PagesDetailTable({ data, loading = false }) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    if (loading) {
        return (
            <div className="bg-[#f5f5f5] p-6 rounded-xl border border-[#e0e0e0] min-h-[400px] animate-pulse">
                <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-10 bg-gray-200 rounded w-full"></div>
                    ))}
                </div>
            </div>
        );
    }

    const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = data?.slice(startIndex, startIndex + itemsPerPage) || [];

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="bg-[#f5f5f5] p-6 rounded-xl border border-[#e0e0e0]">
            <h3 className="text-lg font-bold mb-6">Detalle de páginas (Top 20)</h3>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-200">
                            <th className="pb-3 font-semibold">Título de página</th>
                            <th className="pb-3 font-semibold">URL</th>
                            <th className="pb-3 font-semibold text-right">Vistas</th>
                            <th className="pb-3 font-semibold text-right">Usuarios</th>
                            <th className="pb-3 font-semibold text-right">Tiempo prom.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentItems.length > 0 ? (
                            currentItems.map((row, index) => (
                                <tr key={index} className="text-sm hover:bg-white/50 transition-colors">
                                    <td className="py-4 font-medium max-w-[200px] truncate" title={row.pageTitle}>
                                        {row.pageTitle}
                                    </td>
                                    <td className="py-4 text-gray-500 font-mono text-[11px] max-w-[150px] truncate">
                                        <div className="flex items-center space-x-1">
                                            <span title={row.pagePath}>{row.pagePath}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right font-bold tabular-nums">
                                        {new Intl.NumberFormat().format(row.screenPageViews)}
                                    </td>
                                    <td className="py-4 text-right tabular-nums">
                                        {new Intl.NumberFormat().format(row.activeUsers)}
                                    </td>
                                    <td className="py-4 text-right text-gray-500 tabular-nums">
                                        {formatDuration(row.averageSessionDuration)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="py-8 text-center text-gray-400 text-sm">
                                    No se encontraron datos
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500">
                        Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, data.length)} de {data.length} resultados
                    </p>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded-md border border-gray-200 hover:bg-white disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded-md border border-gray-200 hover:bg-white disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
