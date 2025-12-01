import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNativeCamera } from "@/hooks/useNativeCamera";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StyleTrying = () => {
  const [bodyPhoto, setBodyPhoto] = useState<File | null>(null);
  const [bodyPreview, setBodyPreview] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("隨機");
  const [selectedSeason, setSelectedSeason] = useState<string>("隨機");
  const [selectedBrand, setSelectedBrand] = useState<string>("隨機");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [resultImage, setResultImage] = useState<string>("");
  const [resultText, setResultText] = useState<string>("");
  const [tryonsCount, setTryonsCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const bodyInputRef = useRef<HTMLInputElement>(null);
  const progressInterval = useRef<number>();
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { takePicture } = useNativeCamera();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const WEBHOOK_URL = "https://ryann8n.zeabur.app/webhook/8b2fe55f-df90-4e33-9248-fc9d29541ae1";
  const MAX_TRYONS = 10;

  // Fetch user's try-on count and admin status
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setIsLoadingCount(false);
        return;
      }

      try {
        // Check if user is admin
        const { data: adminData } = await supabase.rpc('is_admin', {
          _user_id: user.id
        });

        if (adminData) {
          setIsAdmin(true);
        }

        // Fetch tryon count
        const { data, error } = await supabase
          .from('user_tryons')
          .select('tryons_count')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        setTryonsCount(data?.tryons_count || 0);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleFileUpload = (
    file: File,
    setPhoto: (file: File) => void,
    setPreview: (url: string) => void
  ) => {
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "檔案太大",
        description: "請上傳小於 20MB 的圖片",
        variant: "destructive",
      });
      return;
    }
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBodyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, setBodyPhoto, setBodyPreview);
    }
  };

  const handleCameraCaptureBody = async () => {
    try {
      const result = await takePicture();
      if (result) {
        const response = await fetch(result);
        const blob = await response.blob();
        const file = new File([blob], "body-photo.jpg", { type: "image/jpeg" });
        handleFileUpload(file, setBodyPhoto, setBodyPreview);
      }
    } catch (error) {
      console.error("Camera capture error:", error);
      toast({
        title: "拍照失敗",
        description: "無法使用相機拍照",
        variant: "destructive",
      });
    }
  };

  // Helper to extract image URL from various JSON shapes (robust)
  const extractImageFromJson = (data: any): string | null => {
    if (!data) return null;

    const isUrl = (v: any) =>
      typeof v === 'string' && /^(https?:)?\/\//i.test(v);

    const isImageUrl = (v: any) =>
      isUrl(v) && /(\.png|\.jpe?g|\.webp|\.gif)(\?.*)?$/i.test(v);

    // Common direct fields
    const directCandidates = [
      data.result_image,
      data.image_url,
      data.output_image,
      data.result,
      data.image,
      data.url,
      data.file_url,
      data.file,
    ].filter(Boolean);
    for (const c of directCandidates) {
      if (isImageUrl(c) || isUrl(c)) return c as string;
    }

    // images array: objects or strings
    if (Array.isArray(data.images) && data.images.length > 0) {
      const first = data.images[0];
      if (typeof first === 'string') {
        if (isImageUrl(first) || isUrl(first)) return first;
      } else if (first && typeof first === 'object') {
        if (isImageUrl(first.url) || isUrl(first.url)) return first.url;
        if (isImageUrl(first.src) || isUrl(first.src)) return first.src;
      }
    }

    // output array
    if (Array.isArray((data as any).output) && (data as any).output.length > 0) {
      const first = (data as any).output[0];
      if (typeof first === 'string') {
        if (isImageUrl(first) || isUrl(first)) return first;
      } else if (first && typeof first === 'object') {
        if (isImageUrl(first.url) || isUrl(first.url)) return first.url;
        if (isImageUrl(first.src) || isUrl(first.src)) return first.src;
      }
    }

    // nested common containers
    const nested = [data.data, data.result, data.response, data.payload].filter(Boolean);
    for (const n of nested) {
      const nestedUrl = extractImageFromJson(n);
      if (nestedUrl) return nestedUrl;
    }

    // Deep search: find first URL-looking string
    const deepSearch = (obj: any): string | null => {
      if (!obj || typeof obj !== 'object') return null;
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string' && (isImageUrl(val) || isUrl(val))) return val;
        if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === 'string' && (isImageUrl(item) || isUrl(item))) return item;
            if (item && typeof item === 'object') {
              const r = deepSearch(item);
              if (r) return r;
            }
          }
        } else if (typeof val === 'object') {
          const r = deepSearch(val);
          if (r) return r;
        }
      }
      return null;
    };

    return deepSearch(data);
  };

  // Poll for result if needed
  const pollForResult = async (
    endpoint: string,
    intervalMs = 2000,
    maxWait = 120000
  ): Promise<string> => {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      try {
        const res = await fetch(endpoint, { method: 'GET' });
        if (!res.ok) {
          await new Promise((r) => setTimeout(r, intervalMs));
          continue;
        }

        const contentType = res.headers.get('content-type') || '';
        if (contentType.startsWith('image/')) {
          const blob = await res.blob();
          return URL.createObjectURL(blob);
        }

        const text = await res.text();
        if (!text || text.trim() === '') {
          await new Promise((r) => setTimeout(r, intervalMs));
          continue;
        }

        const trimmed = text.trim().replace(/^"|"$/g, '');
        if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:image')) {
          return trimmed;
        }

        try {
          const json = JSON.parse(text);
          const img = extractImageFromJson(json);
          if (img) return img as string;
          if (json.message === 'Workflow was started') {
            await new Promise((r) => setTimeout(r, intervalMs));
            continue;
          }
        } catch (_) {
          // not JSON, keep polling
        }
      } catch (_) {
        // network hiccup, keep polling
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error('超時：仍未取得生成結果');
  };

  const handleStyleTrying = async () => {
    if (!bodyPhoto) {
      toast({
        title: "請上傳照片",
        description: "請上傳您的身體照片",
        variant: "destructive",
      });
      return;
    }

    if (!selectedGender) {
      toast({
        title: "請選擇性別",
        description: "請選擇您的性別",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStyle) {
      toast({
        title: "請選擇風格",
        description: "請選擇您想要的風格",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBrand) {
      toast({
        title: "請選擇品牌",
        description: "請選擇您想要的品牌",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "請先登入",
        description: "您需要登入才能使用此功能",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Check try-on limit (unless admin)
    if (!isAdmin && tryonsCount >= MAX_TRYONS) {
      toast({
        title: "試穿次數已達上限",
        description: `您已使用完所有 ${MAX_TRYONS} 次試穿機會`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage("🎨 正在分析您的風格偏好...");
    setResultImage("");

    // 階段性提示訊息
    const progressMessages = [
      { threshold: 0, message: "🎨 正在分析您的風格偏好..." },
      { threshold: 15, message: "👔 正在尋找最適合的服飾搭配..." },
      { threshold: 30, message: "✨ AI 設計師正在構思專屬造型..." },
      { threshold: 45, message: "🎭 正在調整細節與配色..." },
      { threshold: 60, message: "👗 正在挑選完美的單品組合..." },
      { threshold: 75, message: "💎 正在加入時尚元素..." },
      { threshold: 90, message: "🌟 即將完成，請稍候..." }
    ];

    progressInterval.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const newProgress = prev + Math.random() * 1.5 + 0.5; // 減慢速度：每次增加 0.5-2
        
        // 更新階段性提示訊息
        const currentMessage = progressMessages
          .reverse()
          .find(m => newProgress >= m.threshold);
        if (currentMessage) {
          setProgressMessage(currentMessage.message);
        }
        
        return newProgress;
      });
    }, 500); // 從 200ms 改為 500ms

    const getProxiedUrl = (url: string) => `https://cors.isomorphic-git.org/${url}`;
    let endpoint = WEBHOOK_URL;

    try {
      console.log('開始發送請求到:', WEBHOOK_URL);

      // 轉換性別值為中文
      const genderValue = selectedGender === 'Male' ? '男性' : selectedGender === 'Female' ? '女性' : selectedGender;
      
      // 轉換風格值為中文
      const styleMap: { [key: string]: string } = {
        '隨機': '隨機',
        'Korean Style': '韓系',
        'Japanese Style': '日系',
        'American Style': '美式',
        'European Style': '歐風'
      };
      const styleValue = styleMap[selectedStyle] || selectedStyle;
      
      // 轉換季節值為中文
      const seasonMap: { [key: string]: string } = {
        '隨機': '隨機',
        'Spring': '春季',
        'Summer': '夏季',
        'Autumn': '秋季',
        'Winter': '冬季'
      };
      const seasonValue = seasonMap[selectedSeason] || selectedSeason;
      
      const formData = new FormData();
      formData.append('body_image', bodyPhoto);
      formData.append('gender', genderValue);
      formData.append('style', styleValue);
      formData.append('season', seasonValue);
      formData.append('brand', selectedBrand);
      formData.append('user_id', user.id);

      console.log('準備發送表單數據:', {
        body_image: bodyPhoto.name,
        gender: genderValue,
        style: styleValue,
        season: seasonValue,
        brand: selectedBrand,
        user_id: user.id
      });

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });
      } catch (postErr) {
        console.warn('直接請求失敗，改用 CORS 代理重試', postErr);
        endpoint = getProxiedUrl(WEBHOOK_URL);
        response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';

      // If server returns image directly
      if (contentType.startsWith('image/')) {
        const blob = await response.blob();
        const objUrl = URL.createObjectURL(blob);
        setResultImage(objUrl);
        
        // Increment try-on count
        if (!isAdmin) {
          const { data: newCount } = await supabase.rpc('increment_user_tryons', {
            p_user_id: user.id
          });
          if (newCount !== null) {
            setTryonsCount(newCount);
          }
        }
        
        toast({ 
          title: "風格轉換成功", 
          description: "您的新風格已生成"
        });
        return;
      }

      const responseText = await response.text();

      // Empty body -> start polling
      if (!responseText || responseText.trim() === '') {
        const imgUrl = await pollForResult(endpoint);
        setProgress(100);
        setTimeout(async () => {
          setResultImage(imgUrl);
          
          // Increment try-on count
          if (!isAdmin) {
            const { data: newCount } = await supabase.rpc('increment_user_tryons', {
              p_user_id: user.id
            });
            if (newCount !== null) {
              setTryonsCount(newCount);
            }
          }
          
          toast({
            title: "風格轉換成功",
            description: "您的新風格已生成",
          });
        }, 500);
        return;
      }

      // Plain URL string
      const trimmed = responseText.trim().replace(/^"|"$/g, '');
      if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:image')) {
        setProgress(100);
        setTimeout(async () => {
          setResultImage(trimmed);
          
          // Increment try-on count
          if (!isAdmin) {
            const { data: newCount } = await supabase.rpc('increment_user_tryons', {
              p_user_id: user.id
            });
            if (newCount !== null) {
              setTryonsCount(newCount);
            }
          }
          
          toast({
            title: "風格轉換成功",
            description: "您的新風格已生成",
          });
        }, 500);
        return;
      }

      // JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse response as JSON:', parseErr);
        throw new Error(`無法解析回應: ${responseText.substring(0, 100)}`);
      }

      console.log('Parsed response:', data);

      // Extract image from JSON
      const imgUrl = extractImageFromJson(data);
      if (imgUrl) {
        setProgress(100);
        setTimeout(async () => {
          setResultImage(imgUrl);
          // Extract text from response if available
          if (data.text) {
            setResultText(data.text);
          }
          
          // Increment try-on count
          if (!isAdmin) {
            const { data: newCount } = await supabase.rpc('increment_user_tryons', {
              p_user_id: user.id
            });
            if (newCount !== null) {
              setTryonsCount(newCount);
            }
          }
          
          toast({
            title: "風格轉換成功",
            description: "您的新風格已生成",
          });
        }, 500);
        return;
      }

      // Check for workflow start message
      if (data.message === 'Workflow was started' || data.status === 'started') {
        const result = await pollForResult(endpoint);
        setProgress(100);
        setTimeout(async () => {
          setResultImage(result);
          
          // Increment try-on count
          if (!isAdmin) {
            const { data: newCount } = await supabase.rpc('increment_user_tryons', {
              p_user_id: user.id
            });
            if (newCount !== null) {
              setTryonsCount(newCount);
            }
          }
          
          toast({
            title: "風格轉換成功",
            description: "您的新風格已生成",
          });
        }, 500);
        return;
      }

      // Error in response
      if (data.error) {
        throw new Error(data.error);
      }

      throw new Error('無法從回應中取得結果圖片');
    } catch (error) {
      console.error("Style trying error:", error);
      toast({
        title: "處理失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Luxury Dressing Room Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210,15%,15%)] via-[hsl(210,20%,8%)] to-[hsl(220,20%,5%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(197,149,96,0.08),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.02),transparent_50%)]"></div>
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto px-0">
          {/* Premium Header */}
          <div className="text-center mb-20">
            <div className="inline-block relative mb-8">
              <h1 className="font-playfair text-5xl md:text-7xl font-bold text-white mb-4 relative z-10">
                {t('styleTrying.title')}
              </h1>
              <div className="absolute -inset-6 bg-gradient-to-r from-[hsl(45,60%,50%,0.1)] to-[hsl(45,80%,60%,0.1)] blur-2xl rounded-full"></div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[hsl(45,60%,50%)] to-transparent"></div>
            </div>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-light">
              {t('styleTrying.subtitle')}
            </p>
            
            {/* Try-on counter */}
            {user && !isLoadingCount && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">
                      {isAdmin ? (
                        t('styleTrying.adminUnlimited')
                      ) : (
                        <>
                          {t('styleTrying.remainingTryons')}: <span className="text-[hsl(45,60%,50%)] font-bold">{MAX_TRYONS - tryonsCount}</span> / {MAX_TRYONS}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[hsl(45,60%,50%)] rounded-full animate-pulse"></div>
              <div className="h-px w-16 bg-gradient-to-r from-[hsl(45,60%,50%)] to-transparent"></div>
              <div className="text-[hsl(45,60%,50%)] text-sm font-medium tracking-widest">EXCLUSIVE</div>
              <div className="h-px w-16 bg-gradient-to-l from-[hsl(45,60%,50%)] to-transparent"></div>
              <div className="w-2 h-2 bg-[hsl(45,60%,50%)] rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-20 max-w-none w-full">
            {/* Body Photo Upload */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-white/8 to-white/2 backdrop-blur-2xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] hover:shadow-[0_50px_150px_-20px_rgba(197,149,96,0.4)] transition-all duration-700 hover:-translate-y-3 hover:scale-[1.02] rounded-lg">
              {/* Background Image */}
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 group-hover:opacity-30 transition-opacity duration-500" 
                   style={{backgroundImage: `url('/lovable-uploads/5acdebbb-cca2-43d2-860a-65f67ab9fdf7.png')`}}></div>
              
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>
              
              {/* Animated gradient border */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-[hsl(45,60%,50%,0.3)] via-transparent to-[hsl(45,60%,50%,0.3)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Floating orbs */}
              <div className="absolute top-6 right-6 w-3 h-3 bg-[hsl(45,60%,50%)] rounded-full animate-pulse opacity-60 z-10"></div>
              <div className="absolute bottom-6 left-6 w-2 h-2 bg-[hsl(45,80%,60%)] rounded-full animate-pulse opacity-40 delay-300 z-10"></div>
              
              {/* Subtle glass effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(45,20%,25%,0.08)] to-[hsl(45,40%,35%,0.03)] rounded-lg backdrop-blur-sm"></div>
              
              <div className="text-center relative z-10 pb-6">
                <h3 className="text-2xl font-playfair text-white mb-2 group-hover:text-[hsl(45,60%,50%)] transition-colors duration-300">
                  {t('styleTrying.uploadBody')}
                </h3>
                <p className="text-white/70 text-base font-light">
                  {t('styleTrying.uploadDesc')}
                </p>
              </div>
              
              <div className="space-y-6 relative z-10 px-6">
                <div 
                  className="relative border-2 border-dashed border-white/25 rounded-2xl p-8 text-center cursor-pointer hover:border-[hsl(45,60%,50%,0.6)] hover:bg-gradient-to-br hover:from-[hsl(45,60%,50%,0.05)] hover:to-[hsl(45,80%,60%,0.03)] transition-all duration-500 group-hover:border-[hsl(45,60%,50%,0.4)] overflow-hidden"
                  onClick={() => bodyInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[hsl(45,60%,50%)]', 'bg-[hsl(45,60%,50%,0.05)]'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-[hsl(45,60%,50%)]', 'bg-[hsl(45,60%,50%,0.05)]'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-[hsl(45,60%,50%)]', 'bg-[hsl(45,60%,50%,0.05)]');
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileUpload(file, setBodyPhoto, setBodyPreview);
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {bodyPreview ? (
                    <>
                      <img
                        src={bodyPreview}
                        alt="Body"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(45,60%,50%,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Success badge */}
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-[hsl(45,60%,50%)] to-[hsl(45,80%,60%)] text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                        {t('upload.completed')}
                      </div>
                      
                      {/* Overlay info */}
                      <div className="absolute bottom-4 left-4 right-4 bg-black/30 backdrop-blur-sm rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-sm font-medium">{t('upload.clickToReselect')}</p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-8">
                      <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center border border-white/20 shadow-inner">
                        </div>
                        {/* Floating particles */}
                        <div className="absolute -top-2 -right-2 w-3 h-3 bg-[hsl(45,60%,50%)] rounded-full opacity-60 animate-bounce"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full opacity-40 animate-pulse"></div>
                      </div>
                      <div className="space-y-3">
                        <p className="font-bold text-white text-xl group-hover:text-[hsl(45,60%,50%)] transition-colors duration-300">
                          {t('upload.dragOrClick')}
                        </p>
                        <p className="text-white/60 text-base">
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <input
                  ref={bodyInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBodyUpload}
                  className="hidden"
                />
                
                <Button 
                  variant="outline" 
                  className="w-full bg-gradient-to-r from-gray-700/90 to-gray-600/90 border-gray-500/50 text-white hover:bg-gradient-to-r hover:from-gray-600/90 hover:to-gray-500/90 hover:border-gray-400/60 hover:text-white backdrop-blur-xl h-14 text-lg font-medium transition-all duration-500 rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(100,100,100,0.3)] group"
                  onClick={() => bodyInputRef.current?.click()}
                >
                  使用相機拍照
                </Button>
              </div>
            </div>

            {/* Gender Selection */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">{t('styleTrying.selectGender')}</label>
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <SelectValue placeholder={t('styleTrying.selectGenderPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(210,20%,10%)] border-white/10">
                  <SelectItem value="Male" className="text-white hover:bg-white/10">{t('styleTrying.genderMale')}</SelectItem>
                  <SelectItem value="Female" className="text-white hover:bg-white/10">{t('styleTrying.genderFemale')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Style Selection */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">{t('styleTrying.selectStyle')}</label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <SelectValue placeholder={t('styleTrying.selectStylePlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(210,20%,10%)] border-white/10">
                  <SelectItem value="隨機" className="text-white hover:bg-white/10">{t('styleTrying.styleRandom')}</SelectItem>
                  <SelectItem value="Korean Style" className="text-white hover:bg-white/10">{t('styleTrying.styleKorean')}</SelectItem>
                  <SelectItem value="Japanese Style" className="text-white hover:bg-white/10">{t('styleTrying.styleJapanese')}</SelectItem>
                  <SelectItem value="American Style" className="text-white hover:bg-white/10">{t('styleTrying.styleAmerican')}</SelectItem>
                  <SelectItem value="European Style" className="text-white hover:bg-white/10">{t('styleTrying.styleEuropean')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Season Selection */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">{t('styleTrying.selectSeason')}</label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <SelectValue placeholder={t('styleTrying.selectSeasonPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(210,20%,10%)] border-white/10">
                  <SelectItem value="隨機" className="text-white hover:bg-white/10">{t('styleTrying.seasonRandom')}</SelectItem>
                  <SelectItem value="Spring" className="text-white hover:bg-white/10">{t('styleTrying.seasonSpring')}</SelectItem>
                  <SelectItem value="Summer" className="text-white hover:bg-white/10">{t('styleTrying.seasonSummer')}</SelectItem>
                  <SelectItem value="Autumn" className="text-white hover:bg-white/10">{t('styleTrying.seasonAutumn')}</SelectItem>
                  <SelectItem value="Winter" className="text-white hover:bg-white/10">{t('styleTrying.seasonWinter')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand Selection */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">{t('styleTrying.selectBrand')}</label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <SelectValue placeholder={t('styleTrying.selectBrandPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(210,20%,10%)] border-white/10">
                  <SelectItem value="隨機" className="text-white hover:bg-white/10">{t('styleTrying.brandRandom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              size="lg"
              onClick={handleStyleTrying}
              disabled={isProcessing || !bodyPhoto || !selectedStyle || !selectedBrand}
              className="w-full text-lg px-8 py-4 bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-white rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all duration-300 border-none"
            >
              {isProcessing ? (
                <div className="flex flex-col items-center py-2 gap-1">
                  <span className="font-semibold">We are changing you. {Math.floor(progress)}%</span>
                  <span className="text-sm font-normal">(Estimated time: 1 min 30 sec)</span>
                  <span className="text-sm font-normal animate-pulse mt-1">✨ {progressMessage}</span>
                </div>
              ) : (
                <span>Try New Style</span>
              )}
            </Button>

            {/* Result */}
            {resultImage && (
              <div className="group relative overflow-hidden bg-gradient-to-br from-white/8 to-white/2 backdrop-blur-2xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] rounded-lg">
                <div className="relative p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-playfair font-bold text-white">{t('styleTrying.exclusiveResult')}</h2>
                      <p className="text-white/60 text-sm">{t('styleTrying.resultDesc')}</p>
                    </div>
                  </div>
                  <img
                    src={resultImage}
                    alt="Result"
                    className="w-full rounded-lg mb-6"
                  />
                  {resultText && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-6">
                      <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                        {resultText}
                      </p>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = resultImage;
                        link.download = 'style-trying-result.jpg';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-white rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-300"
                      size="lg"
                    >
                      喜歡嗎?下載下來Po到IG吧！
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleTrying;
