"use client";

import { signOut, useSession } from "next-auth/react";
import { FileText, LogOut, User } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({ children }) {
    const { data: session } = useSession();

    async function handleSignOut() {
        // redirect: false evita seguir data.url del servidor cuando NEXTAUTH_URL
        // no coincide con el origen real (p. ej. otro puerto) → 404 al cerrar sesión.
        await signOut({ redirect: false });
        window.location.assign("/");
    }

    return (
        <div className="min-h-screen bg-white text-black">
            <header className="border-b border-gray-100 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="flex items-center space-x-4">
                    <Link href="/dashboard" className="text-xl font-bold tracking-tight">
                        Analytics UTN
                    </Link>
                </div>

                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3 text-sm font-medium">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">{session?.user?.name}</span>
                        <Link
                            href="/dashboard/resumen"
                            className="inline-flex items-center gap-1.5 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-gray-200 text-gray-600 hover:text-black font-semibold transition-colors text-xs sm:text-sm"
                        >
                            <FileText className="w-4 h-4" />
                            Resumen Ejecutivo
                        </Link>
                    </div>
                    <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className="flex items-center space-x-2 text-sm text-gray-500 hover:text-black transition-colors duration-200"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Cerrar sesión</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
                {children}
            </main>
        </div>
    );
}
