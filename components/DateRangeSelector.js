"use client";

import { useState, useEffect } from "react";

export default function DateRangeSelector({ value, onChange }) {
    // value is { days, stDate, enDate }
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        if (value.startDate && value.endDate) {
            setIsCustom(true);
        }
    }, [value.startDate, value.endDate]);

    const handleSelectChange = (e) => {
        const val = e.target.value;
        if (val === "custom") {
            setIsCustom(true);
        } else {
            setIsCustom(false);
            onChange({ days: parseInt(val), startDate: null, endDate: null });
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-2 items-end md:items-center">
            <div className="relative inline-block w-[160px]">
                <select
                    value={isCustom ? "custom" : value.days}
                    onChange={handleSelectChange}
                    className="w-full h-9 pl-3 pr-8 text-[12px] font-medium bg-transparent border border-gray-100 rounded-lg text-gray-500 focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
                >
                    <option value={7}>Últimos 7 días</option>
                    <option value={28}>Últimos 28 días</option>
                    <option value={90}>Últimos 90 días</option>
                    <option value="custom">Rango personalizado...</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
            </div>

            {isCustom && (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
                    <input
                        type="date"
                        value={value.startDate || ""}
                        onChange={(e) => onChange({ ...value, startDate: e.target.value })}
                        className="h-9 px-2 text-[11px] border border-gray-100 rounded-lg focus:outline-none focus:border-black bg-white text-gray-600 appearance-none"
                    />
                    <span className="text-[10px] uppercase font-bold text-gray-300">al</span>
                    <input
                        type="date"
                        value={value.endDate || ""}
                        onChange={(e) => onChange({ ...value, endDate: e.target.value })}
                        className="h-9 px-2 text-[11px] border border-gray-100 rounded-lg focus:outline-none focus:border-black bg-white text-gray-600 appearance-none"
                    />
                </div>
            )}
        </div>
    );
}
