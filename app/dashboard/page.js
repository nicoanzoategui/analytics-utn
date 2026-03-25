"use client";

import { useState } from "react";
import DateRangeSelector from "@/components/DateRangeSelector";
import SegmentSelector from "@/components/SegmentSelector";
import TabResumen from "@/components/tabs/TabResumen";
import TabComportamiento from "@/components/tabs/TabComportamiento";
import TabContenido from "@/components/tabs/TabContenido";
import TabRetencion from "@/components/tabs/TabRetencion";
import TabConversiones from "@/components/tabs/TabConversiones";


export default function DashboardPage() {
    const [dateRange, setDateRange] = useState({ days: 7, startDate: null, endDate: null });
    const [segment, setSegment] = useState("all");
    const [activeTab, setActiveTab] = useState("resumen");

    const tabs = [
        { id: "resumen", label: "Resumen" },
        { id: "comportamiento", label: "Comportamiento" },
        { id: "contenido", label: "Contenido" },
        { id: "retencion", label: "Retención" },
        { id: "conversiones", label: "Conversiones" },
    ];


    return (
        <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-gray-50">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-black flex items-center gap-2">
                        Analytics <span className="text-gray-200 font-light">|</span> UTN
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <SegmentSelector value={segment} onChange={setSegment} />
                    <DateRangeSelector value={dateRange} onChange={setDateRange} />
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="flex items-center space-x-1 border-b border-gray-100 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-b-2 -mb-[2px] ${activeTab === tab.id
                                ? "border-black text-black"
                                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="pt-2 animate-in fade-in duration-500">
                {activeTab === "resumen" && <TabResumen {...dateRange} segment={segment} />}
                {activeTab === "comportamiento" && <TabComportamiento {...dateRange} segment={segment} />}
                {activeTab === "contenido" && <TabContenido {...dateRange} segment={segment} />}
                {activeTab === "retencion" && <TabRetencion {...dateRange} segment={segment} />}
                {activeTab === "conversiones" && <TabConversiones {...dateRange} segment={segment} />}

            </div>
        </div>
    );
}


