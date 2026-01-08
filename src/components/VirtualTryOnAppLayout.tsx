import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image, Loader2, X, Plus, Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import PremiumUploadArea from "./PremiumUploadArea";
import { Capacitor } from "@capacitor/core";
import neonDancer from "@/assets/neon-dancer.png";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface VirtualTryOnAppLayoutProps {
    // Photo state
    bodyPreview: string | null;
    clothingPreview: string | null;
    onBodyPhotoUpload: () => void;
    onClothingPhotoUpload: () => void;
    onBodyCameraCapture: () => void;
    onClothingCameraCapture: () => void;
    onClearBodyPhoto: () => void;
    onClearClothingPhoto: () => void;

    // Processing
    isProcessing: boolean;
    progress: number;
    onSubmit: () => void;

    // Result
    resultImage: string | null;
    onDownload: () => void;
    onReset: () => void;

    // Constraints
    canSubmit: boolean;
    remainingTryons: number;
    isAdmin: boolean;
    isVip: boolean;
    onBack: () => void;
    currentLanguage?: string;
    onToggleLanguage?: () => void;
    isModelOutfit?: boolean;
}

const VirtualTryOnAppLayout = ({
    bodyPreview,
    clothingPreview,
    onBodyPhotoUpload,
    onClothingPhotoUpload,
    onBodyCameraCapture,
    onClothingCameraCapture,
    onClearBodyPhoto,
    onClearClothingPhoto,
    isProcessing,
    progress,
    onSubmit,
    resultImage,
    onDownload,
    onReset,
    canSubmit,
    remainingTryons,
    isAdmin,
    isVip,
    onBack,
    currentLanguage,
    onToggleLanguage,
    isModelOutfit = false,
}: VirtualTryOnAppLayoutProps) => {
    const { t } = useLanguage();
    const triggerHaptic = () => {
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({ style: ImpactStyle.Light });
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col z-[60]">
            {/* Main Photo Area - Full body photo takes most of the screen, extends behind notch */}
            <div className="flex-1 relative overflow-hidden">
                {resultImage ? (
                    // Show result - photo extends behind notch
                    <div className="w-full h-full flex items-center justify-center">
                        <img
                            src={resultImage}
                            alt="Result"
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : bodyPreview ? (
                    // Show uploaded body photo - extends edge-to-edge
                    <div className="w-full h-full relative">
                        <img
                            src={bodyPreview}
                            alt="Your photo"
                            className="w-full h-full object-cover"
                        />
                        {/* Floating UI with safe area - Clear button */}
                        {/* Floating UI with safe area - Clear button removed */}
                        <button
                            onClick={() => { triggerHaptic(); onClearBodyPhoto(); }}
                            className="hidden absolute bg-black/60 backdrop-blur-sm rounded-full p-2"
                            style={{ top: 'calc(env(safe-area-inset-top, 12px) + 8px)', right: '12px' }}
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* Small gallery button overlay - bottom left */}
                        <button
                            onClick={() => { triggerHaptic(); onBodyPhotoUpload(); }}
                            className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-xl p-3"
                        >
                            <Image className="w-5 h-5 text-white" />
                        </button>
                    </div>
                ) : (


                    // Empty state - prompt to upload body photo
                    <div className="w-full h-full flex flex-col items-center justify-center p-8">
                        <PremiumUploadArea
                            onClick={() => { triggerHaptic(); onBodyPhotoUpload(); }}
                            imageSrc={neonDancer}
                        />
                    </div>
                )}

                {/* Processing overlay */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8">
                        <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-6" />
                        <div className="text-center">
                            <p className="text-white text-xl font-semibold mb-2">
                                {t('virtualTryOn.processingPercent').replace('{{percent}}', Math.floor(progress).toString())}
                            </p>
                            <p className="text-white/60 text-sm">
                                {t('virtualTryOn.processingDesc')}
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
                )}
            </div>

            {/* Clothing Selection - Single Slot */}
            {!resultImage && (
                <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-white/10">
                    <div className="px-4 py-3 flex items-center justify-center">
                        {clothingPreview ? (
                            <div className="relative">
                                <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-orange-500 bg-white/10">
                                    <img
                                        src={clothingPreview}
                                        alt="Clothing"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Clear button removed */}
                            </div>
                        ) : (
                            <div
                                onClick={() => { triggerHaptic(); onClothingPhotoUpload(); }}
                                className="w-full max-w-[200px] h-20 rounded-xl bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center gap-2 cursor-pointer hover:bg-white/15 transition-all"
                            >
                                <Plus className="w-5 h-5 text-white/70" />
                                <span className="text-white/70 text-sm">{t(isModelOutfit ? 'upload.selectModelOutfit' : 'upload.selectFashionItem')}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom Action Bar */}
            <div
                className="bg-black border-t border-white/10"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex items-center justify-between px-4 py-3">
                    {resultImage ? (
                        // Result actions
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => { triggerHaptic(); onReset(); }}
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
                                {onToggleLanguage && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => { triggerHaptic(); onToggleLanguage(); }}
                                        className="text-white/70 hover:text-white hover:bg-white/10 ml-2"
                                    >
                                        <Globe className="w-4 h-4 mr-1" />
                                        {currentLanguage === 'zh' ? 'EN' : '中'}
                                    </Button>
                                )}
                            </div>

                            {/* Remaining count */}
                            {!isAdmin && !isVip && (
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
                                    t('virtualTryOn.startTryOn')
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div >
    );
};

export default VirtualTryOnAppLayout;
