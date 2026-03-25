export default function RealtimeUsersCard({ count, loading = false }) {
    if (loading) {
        return (
            <div className="bg-black text-white p-8 rounded-xl border border-black shadow-xl animate-pulse">
                <div className="h-4 w-32 bg-gray-800 rounded mb-4"></div>
                <div className="h-16 w-24 bg-gray-800 rounded mb-2"></div>
                <div className="h-4 w-40 bg-gray-800 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-black text-white p-8 rounded-[2rem] border-2 border-dashed border-gray-800 shadow-2xl flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-gray-400 mb-2">
                Usuarios en tiempo real
            </p>
            <h2 className="text-7xl font-bold mb-2 tracking-tighter">
                {count}
            </h2>
            <p className="text-sm text-gray-400">
                usuarios activos ahora
            </p>

            <div className="mt-6 flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs font-semibold text-green-500 uppercase">En vivo</span>
            </div>
        </div>
    );
}
