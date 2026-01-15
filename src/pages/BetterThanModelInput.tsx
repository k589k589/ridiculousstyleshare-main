import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useNativeCamera } from "@/hooks/useNativeCamera";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Globe, Loader2, X, Download, Shirt, User as UserIcon, Check, Plus } from "lucide-react";
import neonDancer from "@/assets/neon-dancer.png";

const BetterThanModelInput = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language, setLanguage } = useLanguage();
    const { takePicture } = useNativeCamera();
    const { user } = useAuth();
    const { toast } = useToast();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // State
    const [bodyPhoto, setBodyPhoto] = useState<File | null>(null);
    const [bodyPreview, setBodyPreview] = useState<string>("");

    const [clothingPhoto, setClothingPhoto] = useState<File | null>(null);
    const [clothingPreview, setClothingPreview] = useState<string>("");

    // Processing States
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState("");
    const [resultImage, setResultImage] = useState<string>("");

    // User Stats
    const [tryonsCount, setTryonsCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const progressInterval = useRef<number>();

    const WEBHOOK_URL = 'https://ryann8n.zeabur.app/webhook/17474c15-1097-4bbd-ac43-0c844bca4c0e';
    const MAX_TRYONS = 10;
    const remainingTries = Math.max(0, MAX_TRYONS - tryonsCount);

    // Initial check for preloaded clothing (from Community or Showcase)
    useEffect(() => {
        const state = location.state as { preloadedClothingImage?: string } | null;
        if (state?.preloadedClothingImage) {
            fetch(state.preloadedClothingImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `clothing-preloaded-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setClothingPhoto(file);
                    setClothingPreview(state.preloadedClothingImage!);
                    toast({
                        title: language === 'zh' ? '已載入穿搭' : 'Outfit Loaded',
                        description: language === 'zh' ? '請選擇您的個人照片' : 'Please select your photo',
                    });
                })
                .catch(err => console.error('Failed to load clothing:', err));
        }
    }, [location.state, language, toast]);

    // Fetch user stats
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const { data: adminData } = await supabase.rpc('is_admin', { _user_id: user.id });
                if (adminData) setIsAdmin(true);

                const { data, error } = await supabase
                    .from('user_tryons')
                    .select('tryons_count')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!error && data) setTryonsCount(data.tryons_count);

                // Also fetch Profile Avatar if no body photo
                if (!bodyPhoto) {
                    const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('user_id', user.id).maybeSingle();
                    if (profile?.avatar_url) {
                        setBodyPreview(profile.avatar_url);
                        fetch(profile.avatar_url).then(r => r.blob()).then(b => setBodyPhoto(new File([b], 'avatar.jpg', { type: 'image/jpeg' })));
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
    }, [user]);

    const handleBack = () => {
        navigate(-1);
    };

    // Generic Image Picker
    const handlePickImage = async (type: 'body' | 'clothing') => {
        try {
            const imageBase64 = await takePicture();
            if (imageBase64) {
                const mimeType = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
                const res = await fetch(imageBase64);
                const blob = await res.blob();
                const file = new File([blob], `${type}-${Date.now()}.${mimeType.split('/')[1]}`, { type: mimeType });

                if (type === 'body') {
                    setBodyPhoto(file);
                    setBodyPreview(imageBase64);
                } else {
                    setClothingPhoto(file);
                    setClothingPreview(imageBase64);
                    // Scroll down slightly if needed or minimal feedback
                }
                setResultImage("");
            }
        } catch (error) {
            console.error(`Error selecting ${type} photo:`, error);
        }
    };

    // --- Helper Functions ---
    const extractImageFromJson = (data: any): string | null => {
        if (!data) return null;
        const isUrl = (v: any) => typeof v === 'string' && /^(https?:)?\/\//i.test(v);
        const isImageUrl = (v: any) => isUrl(v) && /(\.png|\.jpe?g|\.webp|\.gif)(\?.*)?$/i.test(v);

        // Common direct fields
        const candidates = [data.result_image, data.image_url, data.output_image, data.result, data.url];
        for (const c of candidates) if (isImageUrl(c) || isUrl(c)) return c;

        // Recursive search
        const deepSearch = (obj: any): string | null => {
            if (!obj || typeof obj !== 'object') return null;
            for (const key of Object.keys(obj)) {
                const val = obj[key];
                if (typeof val === 'string' && (isImageUrl(val) || isUrl(val))) return val;
                if (typeof val === 'object') {
                    const r = deepSearch(val);
                    if (r) return r;
                }
            }
            return null;
        };
        return deepSearch(data);
    };

    const pollForResult = async (endpoint: string): Promise<string> => {
        const start = Date.now();
        const maxWait = 180000; // 3 minutes for VTO
        while (Date.now() - start < maxWait) {
            try {
                const res = await fetch(endpoint, { method: 'GET' });
                if (!res.ok) {
                    await new Promise(r => setTimeout(r, 3000));
                    continue;
                }
                const text = await res.text();
                // Direct URL check
                const trimmed = text.trim().replace(/^"|"$/g, '');
                if (/^https?:\/\//i.test(trimmed)) return trimmed;

                try {
                    const json = JSON.parse(text);
                    const img = extractImageFromJson(json);
                    if (img) return img;
                } catch { }
            } catch (_) { }
            await new Promise(r => setTimeout(r, 3000));
        }
        throw new Error(language === 'zh' ? '生成超時' : 'Generation timed out');
    };

    const handleGenerate = async () => {
        if (!bodyPhoto) {
            toast({ title: language === 'zh' ? "請選擇個人照片" : "Please select your photo", variant: "destructive" });
            return;
        }
        if (!clothingPhoto) {
            toast({ title: language === 'zh' ? "請選擇穿搭照片" : "Please select clothing photo", variant: "destructive" });
            return;
        }

        if (!user) {
            toast({ title: language === 'zh' ? "請先登入" : "Please login first", variant: "destructive" });
            navigate('/auth');
            return;
        }

        if (!isAdmin && tryonsCount >= MAX_TRYONS) {
            toast({ title: language === 'zh' ? "次數已用完" : "Out of credits", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setResultImage("");

        const messages = [
            "Scanning body shape...",
            "Analyzing clothing fabric...",
            "Fitting the outfit...",
            "Adjusting lighting & shadows...",
            "Polishing final look..."
        ];
        let msgIndex = 0;
        setProgressMessage(messages[0]);

        progressInterval.current = window.setInterval(() => {
            setProgress(prev => {
                const next = prev + (prev < 80 ? 1 : 0.2); // Slower at end
                if (next >= 99) return 99;

                const newIndex = Math.floor(next / 20);
                if (newIndex !== msgIndex && newIndex < messages.length) {
                    msgIndex = newIndex;
                    setProgressMessage(messages[msgIndex]);
                }
                return next;
            });
        }, 100);

        try {
            const formData = new FormData();
            formData.append('body_image', bodyPhoto);
            formData.append('clothing_image', clothingPhoto);
            formData.append('action', 'virtual_tryon');

            const getProxiedUrl = (url: string) => `https://cors.isomorphic-git.org/${url}`;
            let endpoint = WEBHOOK_URL;
            let response;

            try {
                response = await fetch(endpoint, { method: 'POST', body: formData });
            } catch {
                endpoint = getProxiedUrl(WEBHOOK_URL);
                response = await fetch(endpoint, { method: 'POST', body: formData });
            }

            if (!response.ok) throw new Error("API Request Failed");

            const text = await response.text();
            let finalImageUrl = "";

            // Check if response is raw URL
            const trimmed = text.trim().replace(/^"|"$/g, '');
            if (/^https?:\/\//i.test(trimmed)) {
                finalImageUrl = trimmed;
            } else {
                try {
                    const data = JSON.parse(text);
                    const extracted = extractImageFromJson(data);
                    if (extracted) {
                        finalImageUrl = extracted;
                    } else if (data.message === 'Workflow was started' || data.status === 'started') {
                        finalImageUrl = await pollForResult(endpoint);
                    } else {
                        throw new Error("No image in response");
                    }
                } catch {
                    throw new Error("Invalid response format");
                }
            }

            if (finalImageUrl) {
                setResultImage(finalImageUrl);
                if (!isAdmin) {
                    const { data: newCount } = await supabase.rpc('increment_user_tryons', { p_user_id: user.id });
                    if (newCount !== null) setTryonsCount(newCount);
                }
                toast({
                    title: language === 'zh' ? "試穿成功！" : "Success!",
                });
            }

        } catch (error) {
            console.error(error);
            toast({
                title: language === 'zh' ? "試穿失敗" : "Try-on Failed",
                description: language === 'zh' ? "請稍後再試" : "Please try again later",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
            if (progressInterval.current) clearInterval(progressInterval.current);
            setProgress(100);
        }
    };

    const downloadImage = async () => {
        if (!resultImage) return;
        try {
            const response = await fetch(resultImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rss-vto-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast({ title: language === 'zh' ? "下載成功" : "Downloaded" });
        } catch (error) { console.error(error); }
    };

    // --- RENDER ---

    // Full screen loading
    if (isProcessing) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
                <div className="w-64 text-center space-y-8">
                    <div className="text-6xl font-thin tracking-tighter tabular-nums">
                        {Math.round(progress)}%
                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                    <div className="text-lg font-light tracking-[0.2em] uppercase animate-pulse">
                        {progressMessage}
                    </div>
                </div>
            </div>
        );
    }

    // Full screen result
    if (resultImage) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                <div className="absolute inset-0 z-0 opacity-50 blur-3xl scale-125 pointer-events-none">
                    <img src={resultImage} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                    <img src={resultImage} alt="Result" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                </div>
                <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between">
                    <button onClick={() => { setResultImage(""); }} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <button onClick={downloadImage} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors shadow-lg">
                        <Download className="w-6 h-6" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-black text-white flex flex-col relative overflow-hidden">
            {/* Nav Bar */}
            <div className="absolute top-0 left-0 right-0 z-50 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between items-center pointer-events-none">
                <div></div>
            </div>

            {/* Main Content Area - Center Layout */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full -mt-20">

                {/* 1. Body Photo - Large Center Glow */}
                <div className="relative w-[85vw] h-[55vh] max-w-lg max-h-[600px] flex items-center justify-center mb-6">
                    {/* Glow */}
                    <div className="absolute inset-0 bg-gray-500/20 blur-3xl rounded-full animate-pulse"></div>

                    {/* Image Area */}
                    <div className="relative z-20 w-full h-full flex items-center justify-center cursor-pointer group" onClick={() => handlePickImage('body')}>
                        {bodyPreview ? (
                            <img
                                src={bodyPreview}
                                alt="Body Preview"
                                className="w-full h-full object-contain drop-shadow-2xl rounded-lg opacity-90"
                            />
                        ) : (
                            <img
                                src={neonDancer}
                                alt="Select Body"
                                className="w-[80%] h-[80%] object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] opacity-80"
                            />
                        )}

                        {/* Edit Overlay Hint */}
                        {bodyPreview && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                <span className="text-white font-light tracking-widest text-sm border border-white/50 px-3 py-1 rounded-full uppercase">
                                    {language === 'zh' ? '更換照片' : 'CHANGE PHOTO'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Text: Select Photo */}
                <button
                    onClick={() => handlePickImage('body')}
                    className="text-xl font-light tracking-[0.2em] uppercase text-white hover:text-white/80 border-b border-white/30 pb-1 z-50 mb-8"
                >
                    {bodyPreview ? (language === 'zh' ? '更換照片' : 'CHANGE BODY') : (language === 'zh' ? '選擇照片' : 'SELECT BODY PHOTO')}
                </button>

                {/* 2. Clothing Photo - Styling Pill (Replacing Gender Selector Area) */}
                <div className="flex justify-center w-full z-50">
                    <div
                        className="flex items-center gap-3 bg-white/10 rounded-full pl-4 pr-1 py-1 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all cursor-pointer shadow-lg max-w-[90vw]"
                        onClick={() => handlePickImage('clothing')}
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/50 uppercase tracking-widest text-left">
                                {language === 'zh' ? '穿搭' : 'OUTFIT'}
                            </span>
                            <span className="text-sm font-medium text-white tracking-wider truncate max-w-[150px]">
                                {clothingPreview ? (language === 'zh' ? '已選擇' : 'Selected') : (language === 'zh' ? '選擇穿搭照片' : 'Select Outfit Photo')}
                            </span>
                        </div>

                        {/* Preview Thumbnail or Plus Icon */}
                        <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center overflow-hidden border border-white/20">
                            {clothingPreview ? (
                                <img src={clothingPreview} alt="Outfit" className="w-full h-full object-cover" />
                            ) : (
                                <Plus className="w-5 h-5 text-white/70" />
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Controls */}
            <div className="w-full pb-[calc(env(safe-area-inset-bottom)+1rem)] px-4 z-20 flex flex-col space-y-4 bg-gradient-to-t from-black via-black/95 to-transparent pt-8">

                <div className="w-full flex items-center justify-between gap-2 px-2">
                    <button onClick={handleBack} className="text-white/70 hover:text-white text-sm font-light">
                        {language === 'zh' ? '取消' : 'Cancel'}
                    </button>

                    <button onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')} className="flex items-center gap-1 text-white/70 hover:text-white">
                        <Globe className="h-4 w-4" />
                        <span className="text-sm">{language === 'zh' ? 'EN' : '中'}</span>
                    </button>

                    <span className="text-white/50 text-xs">
                        {language === 'zh' ? `剩餘試穿次數: ${remainingTries}` : `Credits: ${remainingTries}`}
                    </span>

                    <Button
                        className="h-10 px-6 text-sm font-medium rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-white border-none"
                        style={{ backgroundColor: '#A0522D' }}
                        onClick={handleGenerate}
                        disabled={isProcessing || !bodyPhoto || !clothingPhoto}
                    >
                        {language === 'zh' ? '開始試穿' : 'Start Try-on'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BetterThanModelInput;
