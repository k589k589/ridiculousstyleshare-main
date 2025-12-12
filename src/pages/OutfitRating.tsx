import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Star, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

const OutfitRating = () => {
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            // Reset previous results
            setScore(null);
            setFeedback("");
        }
    };

    const handleRateOutfit = async () => {
        if (!photo || !preview) {
            toast({
                title: t('outfitRating.noPhoto'),
                description: t('outfitRating.uploadFirst'),
                variant: "destructive",
            });
            return;
        }

        if (!user) {
            toast({
                title: t('auth.loginRequired'),
                description: t('outfitRating.loginRequired'),
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);
        setScore(null);
        setFeedback("");

        try {
            const { data, error } = await supabase.functions.invoke('outfit-rating', {
                body: { imageBase64: preview },
            });

            if (error) throw error;

            if (data.success) {
                setScore(data.score);
                setFeedback(data.feedback);
            } else {
                throw new Error(data.error || 'Rating failed');
            }
        } catch (error: any) {
            console.error('Rating error:', error);
            toast({
                title: t('outfitRating.error'),
                description: error.message || t('outfitRating.tryAgain'),
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const getScoreColor = (s: number) => {
        if (s >= 90) return 'from-yellow-400 to-amber-500';
        if (s >= 80) return 'from-green-400 to-emerald-500';
        if (s >= 70) return 'from-blue-400 to-cyan-500';
        if (s >= 60) return 'from-purple-400 to-violet-500';
        return 'from-orange-400 to-red-500';
    };

    const getScoreLabel = (s: number) => {
        if (s >= 90) return '完美穿搭 ✨';
        if (s >= 80) return '優秀穿搭 👏';
        if (s >= 70) return '良好穿搭 👍';
        if (s >= 60) return '普通穿搭 💪';
        return '需要改進 📝';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[hsl(210,20%,8%)] via-[hsl(210,15%,12%)] to-[hsl(220,20%,10%)]">
            <div className="relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(45,60%,50%,0.08),transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(210,60%,40%,0.06),transparent_50%)]"></div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 md:py-20">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[hsl(45,60%,50%,0.15)] to-[hsl(45,80%,60%,0.1)] border border-[hsl(45,60%,50%,0.3)] mb-6">
                            <Star className="w-4 h-4 text-[hsl(45,60%,50%)]" />
                            <span className="text-sm font-medium text-[hsl(45,60%,50%)]">AI 穿搭評分</span>
                        </div>
                        <h1 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-4">
                            {t('outfitRating.title')}
                        </h1>
                        <p className="text-lg text-white/60 max-w-2xl mx-auto">
                            {t('outfitRating.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Upload Section */}
                        <div className="space-y-6">
                            <div
                                className="relative group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-2xl border border-white/10 p-8 min-h-[400px] flex items-center justify-center overflow-hidden transition-all duration-300 hover:border-[hsl(45,60%,50%,0.3)]">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Outfit preview"
                                            className="max-w-full max-h-[350px] object-contain rounded-xl"
                                        />
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                                                <Upload className="w-8 h-8 text-white/60" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-medium text-white">{t('outfitRating.uploadPhoto')}</p>
                                                <p className="text-sm text-white/50">{t('outfitRating.uploadHint')}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>

                            <Button
                                onClick={handleRateOutfit}
                                disabled={!photo || isProcessing}
                                className="w-full h-14 bg-gradient-to-r from-[hsl(45,60%,50%)] to-[hsl(45,80%,60%)] hover:from-[hsl(45,60%,55%)] hover:to-[hsl(45,80%,65%)] text-black font-semibold text-lg rounded-xl transition-all duration-300 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {t('outfitRating.analyzing')}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        {t('outfitRating.rateButton')}
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Results Section */}
                        <div className="space-y-6">
                            {score !== null ? (
                                <>
                                    {/* Score Display */}
                                    <div className="relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
                                        <div className="mb-4">
                                            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getScoreColor(score)} shadow-2xl`}>
                                                <span className="text-5xl font-bold text-white">{score}</span>
                                            </div>
                                        </div>
                                        <p className="text-xl font-semibold text-white mb-2">{getScoreLabel(score)}</p>
                                        <div className="flex items-center justify-center gap-2 text-white/60">
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="text-sm">AI 穿搭分析</span>
                                        </div>
                                    </div>

                                    {/* Feedback Display */}
                                    <div className="relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-[hsl(45,60%,50%)]" />
                                            {t('outfitRating.detailedFeedback')}
                                        </h3>
                                        <div className="prose prose-invert max-w-none">
                                            <pre className="whitespace-pre-wrap text-white/80 text-sm leading-relaxed font-noto bg-transparent p-0 m-0">
                                                {feedback.replace(/評分[：:]\s*\d+\s*/, '')}
                                            </pre>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-2xl border border-white/10 p-8 min-h-[400px] flex items-center justify-center">
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                                            <AlertCircle className="w-8 h-8 text-white/40" />
                                        </div>
                                        <p className="text-white/50">{t('outfitRating.waitingForPhoto')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutfitRating;
