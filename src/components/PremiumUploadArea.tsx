import React from 'react';
import { cn } from "@/lib/utils";

interface PremiumUploadAreaProps {
    onClick: () => void;
    title?: string;
    subtitle?: string;
    className?: string;
    imageSrc?: string;
}

const PremiumUploadArea = ({
    onClick,
    title,
    subtitle,
    className,
    imageSrc
}: PremiumUploadAreaProps) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative w-full h-full min-h-[400px] flex flex-col items-center justify-center cursor-pointer transition-all duration-500",
                "active:scale-95",
                className
            )}
        >
            {/* Content Container */}
            <div className="flex flex-col items-center justify-center text-center z-10 space-y-8">

                {/* Image Display (if provided) */}
                {imageSrc ? (
                    <div className="relative w-48 h-48 md:w-64 md:h-64 mb-4 transition-transform duration-500 group-hover:scale-110">
                        <img
                            src={imageSrc}
                            alt="Upload"
                            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        />
                    </div>
                ) : (
                    /* Text Fallback */
                    <div className="flex flex-col items-center space-y-6">
                        <h3 className="text-4xl md:text-5xl font-light text-white font-playfair tracking-wide opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-white/40 text-sm font-light tracking-[0.2em] uppercase max-w-[200px] leading-relaxed group-hover:text-white/60 transition-colors duration-300">
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Minimalist Action Indicator - White */}
                <div className="opacity-80 group-hover:opacity-100 transition-all duration-500 transform group-hover:-translate-y-1">
                    <span className="inline-block border-b border-white text-white pb-2 text-xs tracking-[0.3em] font-medium transition-all duration-300">
                        SELECT PHOTO
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PremiumUploadArea;
