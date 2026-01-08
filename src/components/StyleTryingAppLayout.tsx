import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Check, Loader2, X, RotateCcw, Download, ChevronLeft, Globe } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useLanguage } from "@/hooks/useLanguage";
import PremiumUploadArea from "./PremiumUploadArea";
import neonDancer from "@/assets/neon-dancer.png";

interface StyleOption {
    value: string;
    label: string;
}

interface StyleTryingAppLayoutProps {
    // Photo state
    bodyPreview: string;
    onPhotoUpload: () => void;
    onCameraCapture: () => void;
    onClearPhoto: () => void;

    // Style selection
    selectedGender: string;
    setSelectedGender: (gender: string) => void;
    selectedStyle: string;
    setSelectedStyle: (style: string) => void;
    currentStyles: StyleOption[];

    // Processing
    isProcessing: boolean;
    progress: number;
    progressMessage: string;
    onSubmit: () => void;

    // Result
    resultImage: string;
    onDownload: () => void;

    // Constraints
    canSubmit: boolean;
    remainingTryons: number;
    isAdmin: boolean;
    onBack: () => void;
    currentLanguage: string;
    onToggleLanguage: () => void;
}

const StyleTryingAppLayout = ({
    bodyPreview,
    onPhotoUpload,
    onCameraCapture,
    onClearPhoto,
    selectedGender,
    setSelectedGender,
    selectedStyle,
    setSelectedStyle,
    currentStyles,
    isProcessing,
    progress,
    progressMessage,
    onSubmit,
    resultImage,
    onDownload,
    canSubmit,
    remainingTryons,
    isAdmin,
    onBack,
    currentLanguage,
    onToggleLanguage,

}: StyleTryingAppLayoutProps) => {
    const { t } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);

    const triggerHaptic = () => {
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({ style: ImpactStyle.Light });
        }
    };

    const handleStyleSelect = (style: string) => {
        triggerHaptic();
        setSelectedStyle(style);
    };

    const handleGenderSelect = (gender: string) => {
        triggerHaptic();
        setSelectedGender(gender);
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col z-[60]">
            {/* Main Photo Area - Takes up most of the screen, extends behind notch */}
            <div className="flex-1 relative overflow-hidden">
                {resultImage ? (
                    // Show result - photo extends behind notch
                    <div className="w-full h-full">
                        <img
                            src={resultImage}
                            alt="Result"
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : bodyPreview ? (
                    // Show uploaded photo - extends edge-to-edge
                    <div className="w-full h-full relative">
                        <img
                            src={bodyPreview}
                            alt="Your photo"
                            className="w-full h-full object-cover"
                        />
                        {/* Floating UI with safe area - Clear button removed */}
                        <button
                            onClick={() => { triggerHaptic(); onClearPhoto(); }}
                            className="hidden absolute bg-black/60 backdrop-blur-sm rounded-full p-2"
                            style={{ top: 'calc(env(safe-area-inset-top, 12px) + 8px)', right: '12px' }}
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                ) : (


                    // ... [existing imports]

                    // Empty state - prompt to upload
                    <div className="w-full h-full flex flex-col items-center justify-center p-8">
                        <PremiumUploadArea
                            onClick={() => { triggerHaptic(); onPhotoUpload(); }}
                            imageSrc={neonDancer}
                        />
                    </div>
                )}

                {/* Processing overlay */}
                {
                    isProcessing && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8">
                            <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-6" />
                            <div className="text-center">
                                <p className="text-white text-xl font-semibold mb-2">
                                    {t('styleTrying.processing')} {Math.floor(progress)}%
                                </p>
                                <p className="text-white/60 text-sm animate-pulse">
                                    {progressMessage}
                                </p>
                            </div>
                            {/* Progress bar */}
                            <div className="w-64 h-2 bg-white/20 rounded-full mt-6 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Gender Selection */}
            {
                !resultImage && (
                    <div className="px-4 py-2 flex gap-2 justify-center">
                        <button
                            onClick={() => handleGenderSelect('Male')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedGender === 'Male'
                                ? 'bg-orange-500 text-white'
                                : 'bg-white/10 text-white/70'
                                }`}
                        >
                            {t('auth.male')}
                        </button>
                        <button
                            onClick={() => handleGenderSelect('Female')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedGender === 'Female'
                                ? 'bg-orange-500 text-white'
                                : 'bg-white/10 text-white/70'
                                }`}
                        >
                            {t('auth.female')}
                        </button>
                    </div>
                )
            }

            {/* Style Selector - Horizontal Scroll */}
            {
                !resultImage && selectedGender && (
                    <div className="border-t border-white/10">
                        <div
                            ref={scrollRef}
                            className="flex gap-3 px-4 py-4 overflow-x-auto scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {currentStyles.map((style) => (
                                <button
                                    key={style.value}
                                    onClick={() => handleStyleSelect(style.value)}
                                    className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedStyle === style.value
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                                        }`}
                                >
                                    {style.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Bottom Action Bar */}
            <div
                className="border-t border-white/10 bg-black/90 backdrop-blur-xl"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex items-center justify-between px-4 py-3">
                    {resultImage ? (
                        // Result actions
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => { triggerHaptic(); onClearPhoto(); }}
                                className="text-white hover:bg-white/10"
                            >
                                {t('styleChanger.tryAgain')}
                            </Button>
                            <Button
                                onClick={() => { triggerHaptic(); onDownload(); }}
                                className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-8"
                            >
                                {t('tryOn.downloadWork')}
                            </Button>
                        </>
                    ) : (
                        // Upload/Generate actions
                        <>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => { triggerHaptic(); onBack(); }}
                                    className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                    {t('community.cancel')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => { triggerHaptic(); onToggleLanguage(); }}
                                    className="text-white/70 hover:text-white hover:bg-white/10 ml-2"
                                >
                                    <Globe className="w-4 h-4 mr-1" />
                                    {currentLanguage === 'zh' ? 'EN' : '中'}
                                </Button>
                            </div>
                            {/* Camera/Upload buttons removed as requested */}
                            <div className="flex gap-2">
                            </div>

                            {/* Remaining count */}
                            {!isAdmin && (
                                <span className="text-white/50 text-xs">
                                    {t('virtualTryOn.remainingTryons')}: {remainingTryons}
                                </span>
                            )}

                            <Button
                                onClick={() => { triggerHaptic(); onSubmit(); }}
                                disabled={!canSubmit || isProcessing}
                                className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-6 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    t('styleTrying.differentYou')
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div >
    );
};

export default StyleTryingAppLayout;
