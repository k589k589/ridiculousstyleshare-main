
import { useRef, useEffect, useState } from "react";

interface GridTransformationShowcaseProps {
    originalImage: string;
    resultImages: string[]; // Expecting exactly 4 images
}

const GridTransformationShowcase = ({ originalImage, resultImages }: GridTransformationShowcaseProps) => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!sectionRef.current) return;

            const rect = sectionRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const totalHeight = rect.height - viewportHeight;

            // Calculate progress (0 to 1) based on sticky scrolling
            // We want the animation to happen as the user scrolls through the section
            let progress = 0;

            if (rect.top <= 0) {
                progress = Math.abs(rect.top) / totalHeight;
            }

            setScrollProgress(Math.min(Math.max(progress, 0), 1));
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Initial check

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Animation Constants
    const START_FADE_OUT = 0.2;
    const END_FADE_IN = 0.6;

    // Calculate opacities and scales based on progress
    let originalOpacity = 1;
    let gridOpacity = 0;
    let originalScale = 1;
    let gridScale = 1.1;

    if (scrollProgress > START_FADE_OUT) {
        const fadeRange = END_FADE_IN - START_FADE_OUT;
        const currentFadeProgress = Math.min((scrollProgress - START_FADE_OUT) / fadeRange, 1);

        // Crossfade
        originalOpacity = 1 - currentFadeProgress;
        gridOpacity = currentFadeProgress;

        // Scale effects for "breathing" transition
        originalScale = 1 - (currentFadeProgress * 0.05); // 1 -> 0.95
        gridScale = 1.1 - (currentFadeProgress * 0.1);    // 1.1 -> 1.0
    }

    return (
        <section ref={sectionRef} className="relative h-[300vh] z-20">
            <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
                <div className="w-full h-full relative flex items-center justify-center">

                    {/* Layer 1: Original Image */}
                    <div
                        className="absolute inset-0 z-10 w-full h-full transition-transform duration-100 ease-out"
                        style={{
                            opacity: originalOpacity,
                            transform: `scale(${originalScale})`,
                            pointerEvents: originalOpacity > 0 ? 'auto' : 'none'
                        }}
                    >
                        <div className="relative w-full h-full flex items-center justify-center bg-[#050505]">
                            <img
                                src={originalImage}
                                alt="Original"
                                className="w-full h-full object-contain md:object-cover max-w-4xl mx-auto"
                            />

                            {/* Floating Label for Original */}
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                                <span className="text-white font-playfair text-xl tracking-wider">Original Look</span>
                            </div>
                        </div>
                    </div>

                    {/* Layer 2: Grid Result Images */}
                    <div
                        className="absolute inset-0 z-20 w-full h-full transition-transform duration-100 ease-out"
                        style={{
                            opacity: gridOpacity,
                            transform: `scale(${gridScale})`,
                            pointerEvents: gridOpacity > 0 ? 'auto' : 'none'
                        }}
                    >
                        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 md:gap-2 p-1 md:p-2 bg-[#050505]">
                            {resultImages.map((img, index) => (
                                <div key={index} className="relative w-full h-full overflow-hidden rounded-sm md:rounded-lg border border-white/5">
                                    <img
                                        src={img}
                                        alt={`Style Option ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
                                    />
                                    {/* Optional corner badges per image if needed */}
                                    {/* <div className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm px-2 py-1 rounded text-xs text-white/50">
                             Style {index + 1}
                         </div> */}
                                </div>
                            ))}
                        </div>

                        {/* Floating Label for Grid */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(45,60%,50%)] to-[hsl(45,80%,60%)] px-8 py-3 rounded-full shadow-[0_10px_30px_-5px_hsl(45,60%,50%,0.5)] z-40 transform translate-y-0 transition-all duration-500">
                            <span className="text-black font-playfair font-bold text-xl tracking-wider">New Styles</span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default GridTransformationShowcase;
