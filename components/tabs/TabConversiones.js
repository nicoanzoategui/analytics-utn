"use client";

import { Target } from "lucide-react";
import LandingComparisonBlock from "@/components/LandingComparisonBlock";

export default function TabConversiones({ segment }) {
    if (segment === "panel") {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                    <Target className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Sección Restringida</h3>
                <p className="text-gray-500 max-w-xs">Esta sección aplica únicamente a la web pública</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            <LandingComparisonBlock segment={segment} />
            
            {/* Future conversion types can be added here as new blocks */}
        </div>
    );
}
