import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useNativeCamera } from "@/hooks/useNativeCamera";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Globe, Loader2, X, Download, Share2 } from "lucide-react";
import neonDancer from "@/assets/neon-dancer.png";

const StyleTransferInput = () => {
    const navigate = useNavigate();
    const { language, setLanguage } = useLanguage();
    const { takePicture } = useNativeCamera();
    const { user } = useAuth();
    const { toast } = useToast();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Style Definitions
    const maleStyles = [
        { id: 'Southern European', label: '南歐渡假風' },
        { id: 'British Gentleman', label: '英倫紳士' },
        { id: 'American Street', label: '美式街頭' },
        { id: 'Quiet Luxury', label: '極簡靜奢' },
        { id: 'City Boy', label: '日系 City Boy' },
        { id: 'Vintage Workwear', label: '復古工裝' },
        { id: 'Techwear', label: '賽博機能' },
        { id: 'Korean Clean', label: '韓系質感' },
        { id: 'Gorpcore', label: '戶外山系' },
        { id: 'Business Casual', label: '雅痞商務' },
    ];

    const femaleStyles = [
        { id: 'Southern European', label: '南歐渡假風' },
        { id: 'French Chic', label: '法式慵懶' },
        { id: 'American Vintage', label: '美式復古' },
        { id: 'Y2K', label: '千禧辣妹' },
        { id: 'Quiet Luxury', label: '極簡靜奢' },
        { id: 'Korean Soft', label: '韓系溫柔' },
        { id: 'Dopamine', label: '多巴胺穿搭' },
        { id: 'Balletcore', label: '芭蕾風' },
        { id: 'Grunge', label: '廢土風' },
        { id: 'Librarian', label: '知識份子風' },
    ];

    const [selectedGender, setSelectedGender] = useState<string>("Male");
    const [selectedStyle, setSelectedStyle] = useState<string>(maleStyles[0].label); // Default to first style
    const [bodyPhoto, setBodyPhoto] = useState<File | null>(null);
    const [bodyPreview, setBodyPreview] = useState<string>("");

    // Processing States
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState("");
    const [resultImage, setResultImage] = useState<string>("");

    // User Stats
    const [tryonsCount, setTryonsCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const progressInterval = useRef<number>();

    const WEBHOOK_URL = "https://ryann8n.zeabur.app/webhook/8b2fe55f-df90-4e33-9248-fc9d29541ae1";
    const MAX_TRYONS = 10;
    const remainingTries = Math.max(0, MAX_TRYONS - tryonsCount);

    // Update default style when gender changes
    useEffect(() => {
        const styles = selectedGender === 'Male' ? maleStyles : femaleStyles;
        setSelectedStyle(styles[0].label);
    }, [selectedGender]);

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
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
    }, [user]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleSelectPhoto = async () => {
        try {
            const imageBase64 = await takePicture();
            if (imageBase64) {
                // Determine MIME type (default to png if unknown, though usually jpeg/png)
                const mimeType = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
                const res = await fetch(imageBase64);
                const blob = await res.blob();
                const file = new File([blob], `photo-${Date.now()}.${mimeType.split('/')[1]}`, { type: mimeType });

                setBodyPhoto(file);
                setBodyPreview(imageBase64);
                setResultImage(""); // Reset result when new photo is picked
            }
        } catch (error) {
            console.error("Error selecting photo:", error);
            toast({
                title: language === 'zh' ? "選擇照片失敗" : "Failed to select photo",
                description: language === 'zh' ? "請再試一次" : "Please try again",
                variant: "destructive"
            });
        }
    };

    // --- Helper Functions from StyleTrying.tsx ---

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
        const maxWait = 120000; // 2 minutes
        while (Date.now() - start < maxWait) {
            try {
                const res = await fetch(endpoint, { method: 'GET' });
                if (!res.ok) {
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    const img = extractImageFromJson(json);
                    if (img) return img;
                } catch {
                    // Check if raw URL
                    const trimmed = text.trim().replace(/^"|"$/g, '');
                    if (/^https?:\/\//i.test(trimmed)) return trimmed;
                }
            } catch (_) { }
            await new Promise(r => setTimeout(r, 2000));
        }
        throw new Error(language === 'zh' ? '生成超時' : 'Generation timed out');
    };

    const handleGenerate = async () => {
        if (!bodyPhoto) {
            toast({
                title: language === 'zh' ? "請先選擇照片" : "Please select a photo first",
                variant: "destructive"
            });
            return;
        }

        if (!user) {
            toast({
                title: language === 'zh' ? "請先登入" : "Please login first",
                variant: "destructive"
            });
            navigate('/auth');
            return;
        }

        if (!isAdmin && tryonsCount >= MAX_TRYONS) {
            toast({
                title: language === 'zh' ? "次數已用完" : "Out of credits",
                description: language === 'zh' ? "請升級或等待重置" : "Please upgrade or wait for reset",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setResultImage("");

        // Progress Messages
        const messages = [
            "Analyzing your unique features...",
            "Consulting 2026 fashion trends...",
            "Matching fabrics and textures...",
            "Rendering your new look...",
            "Adding final touches..."
        ];

        // Simulated progress
        let msgIndex = 0;
        setProgressMessage(messages[0]);

        progressInterval.current = window.setInterval(() => {
            setProgress(prev => {
                if (prev >= 98) return prev;
                const next = prev + 0.8;

                // Update message every ~20%
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
            formData.append('gender', language === 'zh' && selectedGender === 'Male' ? '男性' : (language === 'zh' ? '女性' : selectedGender));

            // Pass the selected style!
            formData.append('style', selectedStyle);
            formData.append('season', 'Random');
            formData.append('brand', 'Random');
            formData.append('user_id', user.id);

            // Use CORS proxy if needed
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
                // Parse JSON
                try {
                    const data = JSON.parse(text);
                    const extracted = extractImageFromJson(data);
                    if (extracted) {
                        finalImageUrl = extracted;
                    } else if (data.message === 'Workflow was started' || data.status === 'started') {
                        // Start polling
                        finalImageUrl = await pollForResult(endpoint);
                    } else {
                        throw new Error("No image in response");
                    }
                } catch {
                    // Last resort fallback or error
                    throw new Error("Invalid response format");
                }
            }

            if (finalImageUrl) {
                setResultImage(finalImageUrl);
                // Increment credits
                if (!isAdmin) {
                    const { data: newCount } = await supabase.rpc('increment_user_tryons', { p_user_id: user.id });
                    if (newCount !== null) setTryonsCount(newCount);
                }
                toast({
                    title: language === 'zh' ? "生成成功！" : "Success!",
                    description: language === 'zh' ? "您的新風格已完成" : "Your new style is ready"
                });
            }

        } catch (error) {
            console.error(error);
            toast({
                title: language === 'zh' ? "生成失敗" : "Generation Failed",
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
            a.download = `rss-style-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast({
                title: language === 'zh' ? "下載成功" : "Downloaded",
            });
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    // Full screen loading overlay
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

    // Full screen result overlay
    if (resultImage) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                {/* Visual Background Blur */}
                <div className="absolute inset-0 z-0 opacity-50 blur-3xl scale-125 pointer-events-none">
                    <img src={resultImage} className="w-full h-full object-cover" alt="" />
                </div>

                {/* Main Image - Full Screen Contain */}
                <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                    <img
                        src={resultImage}
                        alt="Style Transfer Result"
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                    />
                </div>

                {/* Overlaid UI Controls */}
                <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between">
                    <button
                        onClick={() => { setResultImage(""); setBodyPhoto(null); setBodyPreview(""); }}
                        className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <button
                        onClick={downloadImage}
                        className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors shadow-lg"
                    >
                        <Download className="w-6 h-6" />
                    </button>
                </div>
            </div>
        );
    }

    // Standard Grid of Styles
    const currentStyleOptions = selectedGender === 'Male' ? maleStyles : femaleStyles;

    return (
        <div className="h-screen bg-black text-white flex flex-col relative overflow-hidden">
            {/* Nav Bar (Absolute) */}
            <div className="absolute top-0 left-0 right-0 z-50 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between items-center pointer-events-none">
                <div></div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full -mt-20">

                {/* Image Container */}
                <div className="relative w-72 h-72 lg:w-96 lg:h-96 flex items-center justify-center">

                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gray-500/20 blur-3xl rounded-full animate-pulse"></div>

                    {/* Content: Preview > Neon Placeholder */}
                    <div className="relative z-20 w-full h-full flex items-center justify-center cursor-pointer" onClick={handleSelectPhoto}>
                        {bodyPreview ? (
                            <img
                                src={bodyPreview}
                                alt="Preview"
                                className="w-full h-full object-contain drop-shadow-2xl rounded-lg opacity-90"
                            />
                        ) : (
                            <img
                                src={neonDancer}
                                alt="Select Photo"
                                className="w-[80%] h-[80%] object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] opacity-80"
                            />
                        )}
                    </div>
                </div>

                {/* Select Photo Text */}
                <button
                    onClick={handleSelectPhoto}
                    className="mt-8 text-xl font-light tracking-[0.2em] uppercase text-white hover:text-white/80 border-b border-white/30 pb-1 z-50"
                >
                    {bodyPreview ? (language === 'zh' ? '更換照片' : 'CHANGE PHOTO') : 'SELECT PHOTO'}
                </button>
            </div>

            {/* Bottom Controls Area */}
            <div className="w-full pb-[calc(env(safe-area-inset-bottom)+1rem)] px-4 z-20 flex flex-col space-y-4 bg-gradient-to-t from-black via-black/95 to-transparent pt-8">

                {/* Gender Toggle - Centered */}
                <div className="flex justify-center w-full">
                    <div className="flex bg-white/10 rounded-full p-1 backdrop-blur-sm border border-white/10 w-fit">
                        <button
                            onClick={() => setSelectedGender("Male")}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedGender === "Male"
                                ? "bg-white/20 text-white shadow-lg"
                                : "text-white/50 hover:text-white/80"
                                }`}
                        >
                            {language === 'zh' ? '男性' : 'Male'}
                        </button>
                        <button
                            onClick={() => setSelectedGender("Female")}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedGender === "Female"
                                ? "bg-white/20 text-white shadow-lg"
                                : "text-white/50 hover:text-white/80"
                                }`}
                        >
                            {language === 'zh' ? '女性' : 'Female'}
                        </button>
                    </div>
                </div>

                {/* Style Selector - Horizontal Scroll - Only show if photo selected, or always show? Always show for better discovery */}
                <div className="w-full overflow-x-auto pb-4 no-scrollbar">
                    <div className="flex space-x-3 px-2 min-w-max">
                        {currentStyleOptions.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedStyle(style.label)}
                                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition-all duration-300 ${selectedStyle === style.label
                                        ? "bg-white text-black border-white"
                                        : "bg-black/40 text-white/60 border-white/20 hover:border-white/50"
                                    }`}
                            >
                                {style.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom Bar: Cancel | Language | Credits | Action Button */}
                <div className="w-full flex items-center justify-between gap-2 px-2">
                    <button
                        onClick={handleBack}
                        className="text-white/70 hover:text-white text-sm font-light"
                    >
                        {language === 'zh' ? '取消' : 'Cancel'}
                    </button>

                    <button
                        onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                        className="flex items-center gap-1 text-white/70 hover:text-white"
                    >
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
                        disabled={isProcessing}
                    >
                        {language === 'zh' ? '嘗試風格' : 'Try Style'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StyleTransferInput;
