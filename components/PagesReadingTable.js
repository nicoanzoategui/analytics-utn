"use client";

import { Clock, ExternalLink } from "lucide-react";

export default function PagesReadingTable({ data, loading, segment }) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-gray-50 animate-pulse rounded-lg" />
                <div className="h-48 bg-gray-50 animate-pulse rounded-xl" />
            </div>
        );
    }

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getBadgeStyle = (cat) => {
        switch (cat) {
            case "Estudio profundo": return "border-black text-black bg-black/5";
            case "Lectura normal": return "border-gray-200 text-gray-800";
            case "Visita corta": return "border-gray-100 text-gray-500";
            default: return "border-red-100 text-red-400 opacity-60 italic";
        }
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {segment === "panel" ? "Sección del Panel" : "URL de la Página"}
                        </th>
                        <th className={`py-4 px-2 text-[10px] font-bold uppercase tracking-widest text-right ${segment === 'panel' ? 'text-gray-300' : 'text-gray-400'}`}>
                            Vistas
                        </th>
                        <th className={`py-4 px-2 text-[10px] font-bold uppercase tracking-widest text-right ${segment === 'panel' ? 'text-black' : 'text-gray-400'}`}>
                            Tiempo Promedio
                        </th>
                        <th className="py-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Categoría</th>
                    </tr>
                </thead>
                <tbody>
                    {data.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                            <td className="py-4 px-2">
                                <div className="flex items-center space-x-2">
                                    <span className={`text-sm font-medium truncate max-w-[300px] ${segment === 'panel' ? 'text-black' : 'text-gray-900'}`}>{item.pagePath}</span>
                                    {segment !== "panel" && (
                                        <a href={`https://elearning.utn.edu.ar${item.pagePath}`} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="w-3 h-3 text-gray-400 hover:text-black" />
                                        </a>
                                    )}
                                </div>
                            </td>
                            <td className={`py-4 px-2 text-right font-mono text-sm ${segment === 'panel' ? 'text-gray-400 opacity-60' : 'text-black'}`}>
                                {(item.screenPageViews || 0).toLocaleString()}
                            </td>
                            <td className={`py-4 px-2 text-right ${segment === 'panel' ? 'bg-zinc-50' : ''}`}>
                                <div className={`flex items-center justify-end space-x-1 text-sm font-bold ${segment === 'panel' ? 'text-black' : 'text-gray-900'}`}>
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span>{formatDuration(item.averageSessionDuration || 0)}</span>
                                </div>
                            </td>


                            <td className="py-4 px-2 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${getBadgeStyle(item.categoriaLectura)}`}>
                                    {item.categoriaLectura}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
