"use client";

export default function SegmentSelector({ value, onChange }) {
    const options = [
        { label: "Web pública", value: "public" },
        { label: "Panel del alumno", value: "panel" },
    ];

    return (
        <div className="relative inline-block w-[140px]">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-[12px] font-medium bg-transparent border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
        </div>
    );
}
