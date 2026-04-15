"use client";

function tipoBadgeClass(tipo) {
    switch (tipo) {
        case "Curso":
            return "bg-blue-100 text-blue-700";
        case "Carrera":
            return "bg-purple-100 text-purple-700";
        case "Diplomatura":
            return "bg-green-100 text-green-700";
        case "Experto":
            return "bg-orange-50 text-orange-700";
        case "Posgrado":
            return "bg-red-50 text-red-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
}

export default function TopCursosTable({ data = [], loading = false }) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-12 w-full bg-gray-50 animate-pulse rounded-xl"
                    />
                ))}
            </div>
        );
    }

    return (
        <div>
            <h3 className="chart-title mb-1">Top formaciones más visitadas</h3>
            <p className="text-gray-400 text-xs mb-6">
                Cursos, carreras, diplomaturas y expertos · Web pública
            </p>
            {data.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos para este período</p>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-left min-w-[480px]">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80">
                                <th className="py-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-12">
                                    #
                                </th>
                                <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24">
                                    Tipo
                                </th>
                                <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Formación
                                </th>
                                <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                                    Vistas
                                </th>
                                <th className="py-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                                    Usuarios
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.map((item, i) => (
                                <tr key={item.page || i} className="hover:bg-gray-50/50">
                                    <td className="py-3 px-3 text-xs font-bold text-gray-400 tabular-nums">
                                        #{i + 1}
                                    </td>
                                    <td className="py-3 px-2">
                                        <span
                                            className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${tipoBadgeClass(item.tipo)}`}
                                        >
                                            {item.tipo}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-sm text-black break-words max-w-[280px]">
                                        {item.nombre}
                                    </td>
                                    <td className="py-3 px-2 text-sm font-semibold text-black text-right tabular-nums whitespace-nowrap">
                                        {Number(item.views).toLocaleString()}
                                    </td>
                                    <td className="py-3 px-3 text-sm font-semibold text-gray-600 text-right tabular-nums whitespace-nowrap">
                                        {Number(item.users).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
