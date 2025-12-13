import { useRef, useEffect } from "react";

interface TransformationShowcaseProps {
    originalImage: string;
    targetImage: string;
    resultImage: string;
}

// 3-Column "Triptych Build" Showcase Component
const TransformationShowcase = ({ originalImage, targetImage, resultImage }: TransformationShowcaseProps) => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const col2Ref = useRef<HTMLDivElement>(null);
    const col3Ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!sectionRef.current) return;

            const rect = sectionRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const distance = -rect.top;
            const totalHeight = rect.height - viewportHeight;
            const overallProgress = Math.max(0, Math.min(1, distance / totalHeight));

            // 3-Column Build Logic:
            // Col 1 (Original): Always visible
            // Col 2 (Target): Slides in 0.2 -> 0.45
            // Col 3 (Result): Slides in 0.55 -> 0.8

            // Col 2 Animation (Target)
            if (col2Ref.current) {
                let p = 0;
                if (overallProgress < 0.2) p = 0;
                else if (overallProgress > 0.45) p = 1;
                else p = (overallProgress - 0.2) / 0.25;

                const ease = 1 - Math.pow(1 - p, 4); // Quartic ease out
                const translateY = (1 - ease) * 100;
                col2Ref.current.style.transform = `translateY(${translateY}%)`;
                // Fade in slightly
                col2Ref.current.style.opacity = `${p * 1 + 0.2}`;
            }

            // Col 3 Animation (Result)
            if (col3Ref.current) {
                let p = 0;
                if (overallProgress < 0.55) p = 0;
                else if (overallProgress > 0.8) p = 1;
                else p = (overallProgress - 0.55) / 0.25;

                const ease = 1 - Math.pow(1 - p, 4);
                const translateY = (1 - ease) * 100;
                col3Ref.current.style.transform = `translateY(${translateY}%)`;
                col3Ref.current.style.opacity = `${p * 1 + 0.2}`;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section ref={sectionRef} className="relative h-[400vh] z-20">
            <div className="sticky top-0 h-screen w-full bg-[#050505] overflow-hidden">

                {/* Triptych Grid - Mobile: Relative (Stacked), Desktop: Grid (Side by Side) */}
                <div className="w-full h-full relative md:grid md:grid-cols-3">

                    {/* Col 1: Original */}
                    {/* Mobile: Absolute Full Screen, Desktop: Relative Col */}
                    <div className="absolute md:relative inset-0 w-full h-full border-r border-white/5 bg-[#050505] flex items-center justify-center overflow-hidden z-0">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent)]" />
                        <img
                            src={originalImage}
                            alt="Original"
                            className="w-full h-full object-contain md:object-cover opacity-90"
                        />
                        <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
                            <h3 className="text-sm md:text-base text-gray-400 font-light tracking-widest uppercase">Original</h3>
                        </div>
                    </div>

                    {/* Col 2: Target */}
                    <div
                        ref={col2Ref}
                        className="absolute md:relative inset-0 w-full h-full border-r border-white/5 bg-[#080808] flex items-center justify-center overflow-hidden will-change-transform z-10 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.5)]"
                        style={{ transform: 'translateY(100%)' }}
                    >
                        <img
                            src={targetImage}
                            alt="Target Style"
                            className="w-full h-full object-contain md:object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
                            <h3 className="text-sm md:text-base text-gray-400 font-light tracking-widest uppercase">Target Vibe</h3>
                        </div>
                    </div>

                    {/* Col 3: Result */}
                    <div
                        ref={col3Ref}
                        className="absolute md:relative inset-0 w-full h-full bg-[#050505] flex items-center justify-center overflow-hidden will-change-transform z-20 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.8)]"
                        style={{ transform: 'translateY(100%)' }}
                    >
                        <div className="absolute inset-0 bg-amber-500/5 mix-blend-overlay pointer-events-none" />
                        <img
                            src={resultImage}
                            alt="Result"
                            className="w-full h-full object-contain md:object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                        <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
                            <h3 className="text-sm md:text-base text-gray-400 font-light tracking-widest uppercase">New Look</h3>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
};

export default TransformationShowcase;
