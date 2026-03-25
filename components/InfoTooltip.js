"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

const TOOLTIP_WIDTH = 260;
const TOOLTIP_HEIGHT = 320; // estimated max height

export default function InfoTooltip({ title, measure, calculation, interpretation }) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, openUpward: false });
    const [mounted, setMounted] = useState(false);
    const buttonRef = useRef(null);
    const tooltipRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const calculatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Default: open below the button, right-aligned
        let top = rect.bottom + 8;
        let openUpward = false;

        // Flip upward if not enough space below
        if (top + TOOLTIP_HEIGHT > viewportHeight - 8) {
            top = rect.top - TOOLTIP_HEIGHT - 8;
            openUpward = true;
        }

        // Align right edge of tooltip to right edge of button
        let left = rect.right - TOOLTIP_WIDTH;

        // Ensure not off left side
        if (left < 8) left = 8;

        // Ensure not off right side
        if (left + TOOLTIP_WIDTH > viewportWidth - 8) {
            left = viewportWidth - TOOLTIP_WIDTH - 8;
        }

        setPosition({ top, left, openUpward });
    };

    const handleToggle = (e) => {
        e.stopPropagation();
        if (!isOpen) calculatePosition();
        setIsOpen((prev) => !prev);
    };

    useEffect(() => {
        if (!isOpen) return;
        function handleClickOutside(event) {
            if (
                tooltipRef.current && !tooltipRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const tooltipContent = isOpen && (
        <div
            ref={tooltipRef}
            className="animate-in fade-in zoom-in duration-200 cursor-default"
            style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: TOOLTIP_WIDTH,
                zIndex: 9999,
                backgroundColor: "#fff",
                border: "1px solid #f3f4f6",
                borderRadius: "1rem",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
                padding: "1rem",
            }}
        >
            {/* Arrow pointing up (tooltip opens downward) */}
            {!position.openUpward && (
                <div style={{
                    position: "absolute",
                    top: -6,
                    right: 12,
                    width: 12,
                    height: 12,
                    backgroundColor: "#fff",
                    borderTop: "1px solid #f3f4f6",
                    borderLeft: "1px solid #f3f4f6",
                    transform: "rotate(45deg)",
                }} />
            )}
            {/* Arrow pointing down (tooltip opens upward) */}
            {position.openUpward && (
                <div style={{
                    position: "absolute",
                    bottom: -6,
                    right: 12,
                    width: 12,
                    height: 12,
                    backgroundColor: "#fff",
                    borderBottom: "1px solid #f3f4f6",
                    borderRight: "1px solid #f3f4f6",
                    transform: "rotate(45deg)",
                }} />
            )}

            {title && (
                <h4 className="text-[10px] font-black uppercase tracking-widest border-b border-gray-50 pb-2 mb-3 text-black">
                    {title}
                </h4>
            )}

            <div
                className="space-y-4"
                style={{ maxHeight: 240, overflowY: "auto" }}
            >
                <div>
                    <p className="text-[11px] font-bold text-black mb-1 uppercase tracking-tight">Qué mide</p>
                    <p className="text-[12px] text-gray-500 leading-snug">{measure}</p>
                </div>
                <div>
                    <p className="text-[11px] font-bold text-black mb-1 uppercase tracking-tight">Cálculo</p>
                    <p className="text-[12px] text-gray-500 font-mono text-[10px] bg-gray-50 p-2 rounded-lg leading-relaxed">
                        {calculation}
                    </p>
                </div>
                {interpretation && (
                    <div className="bg-black p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">Interpretación</p>
                        <p className="text-[11px] text-gray-200 italic leading-snug">
                            {interpretation}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="absolute top-6 right-6" style={{ zIndex: 100 }}>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className={`text-gray-300 hover:text-gray-600 transition-colors p-1 flex items-center justify-center rounded-full hover:bg-gray-50 ${isOpen ? "text-black bg-gray-50" : ""}`}
            >
                <Info size={14} />
            </button>

            {mounted && createPortal(tooltipContent, document.body)}
        </div>
    );
}
