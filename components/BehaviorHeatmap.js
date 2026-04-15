"use client";

export default function BehaviorHeatmap({ data, loading }) {
    if (loading) {
        return <div className="h-64 bg-gray-50 animate-pulse rounded-xl" />;
    }

    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Grid data map: dayIndex -> hour -> count
    const grid = data.reduce((acc, item) => {
        if (!acc[item.day]) acc[item.day] = {};
        acc[item.day][item.hour] = item.users;
        return acc;
    }, {});

    const maxUsers = Math.max(...data.map((d) => d.users), 1);

    return (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[800px]">
                <div className="flex mb-2">
                    <div className="w-12" />
                    <div className="flex-1 flex justify-between px-1">
                        {[0, 6, 12, 18, 23].map(h => (
                            <span key={h} className="text-[10px] text-gray-400 font-medium">
                                {h.toString().padStart(2, '0')}h
                            </span>
                        ))}
                    </div>
                </div>
                {days.map((day, dIdx) => (
                    <div key={day} className="flex items-center mb-1">
                        <div className="w-12 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {day}
                        </div>
                        <div className="flex-1 flex space-x-1">
                            {hours.map(hour => {
                                const val = grid[dIdx]?.[hour] || 0;
                                const alpha = val / maxUsers;
                                return (
                                    <div
                                        key={hour}
                                        title={`${day} ${hour}h: ${val} usuarios`}
                                        className="h-8 flex-1 rounded-sm transition-colors duration-300"
                                        style={{
                                            backgroundColor: val === 0 ? '#f1f5f9' : `rgba(37, 99, 235, ${0.1 + alpha * 0.9})`
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex items-center justify-end space-x-2">
                <span className="text-[10px] text-gray-400 lowercase">Menos actividad</span>
                <div className="flex space-x-1">
                    {[0.1, 0.4, 0.7, 1].map(o => (
                        <div key={o} className="w-3 h-3 rounded-sm bg-blue-600" style={{ opacity: o }} />
                    ))}
                </div>
                <span className="text-[10px] text-gray-400 lowercase">Más actividad</span>
            </div>
        </div>
    );
}
