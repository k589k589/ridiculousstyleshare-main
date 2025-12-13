import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useNativeCamera } from "@/hooks/useNativeCamera";
import { useNativeShare } from "@/hooks/useNativeShare";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import personCase1New from "@/assets/person-case1-new.jpg";
import clothingCase1New from "@/assets/clothing-case1-new.png";
import resultCase1New from "@/assets/result-case1-new.jpg";
import personCase2 from "@/assets/person-case2.png";
import clothingCase2 from "@/assets/clothing-case2.png";
import resultCase2 from "@/assets/result-case2.jpg";
import personCase3Basketball from "@/assets/person-case3-basketball.jpg";
import clothingCase3Basketball from "@/assets/clothing-case3-basketball.png";
import resultCase3Basketball from "@/assets/result-case3-basketball.jpg";
import rssWatermark from "@/assets/rss-watermark.png";

// BTM Showcase images (v2)
import btmOriginal from "@/assets/btm-original-v2.png";
import btmTarget from "@/assets/btm-target-v2.png";
import btmResult from "@/assets/btm-result-v2.png";

// 3-Step "Curtain Reveal" Showcase Component
const TransformationShowcase = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const distance = -rect.top;
      const totalHeight = rect.height - viewportHeight;
      const overallProgress = Math.max(0, Math.min(1, distance / totalHeight));

      // Curtain Reveal Logic:
      // 0-35%: Original is visible. Target is hidden below.
      // 35-65%: Target slides UP over Original.
      // 65-100%: Result slides UP over Target.

      // Labels
      if (overallProgress < 0.35) setActiveStep(0);
      else if (overallProgress < 0.65) setActiveStep(1);
      else setActiveStep(2);

      // Target Animation (Slides up 0.35 -> 0.55)
      if (targetRef.current) {
        // Start sliding at 0.25, finish at 0.55
        // Progress within phase
        let p = 0;
        if (overallProgress < 0.25) p = 0;
        else if (overallProgress > 0.55) p = 1;
        else p = (overallProgress - 0.25) / 0.3; // 0.3 duration

        // Easing (smooth out)
        const ease = 1 - Math.pow(1 - p, 3);
        const translateY = (1 - ease) * 100;
        targetRef.current.style.transform = `translateY(${translateY}%)`;
      }

      // Result Animation (Slides up 0.55 -> 0.85)
      if (resultRef.current) {
        // Start sliding at 0.55, finish at 0.85
        let p = 0;
        if (overallProgress < 0.55) p = 0;
        else if (overallProgress > 0.85) p = 1;
        else p = (overallProgress - 0.55) / 0.3;

        const ease = 1 - Math.pow(1 - p, 3);
        const translateY = (1 - ease) * 100;
        resultRef.current.style.transform = `translateY(${translateY}%)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[350vh] z-20 pointer-events-none">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-black">

        {/* Dynamic Header */}
        <div className="absolute top-0 w-full z-40 p-8 text-center bg-gradient-to-b from-black/80 to-transparent">
          <div className="inline-block px-4 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md transition-all duration-500">
            <span className="text-white text-sm font-light tracking-[0.2em] uppercase">
              {activeStep === 0 && "Step 1: The Original"}
              {activeStep === 1 && "Step 2: Choose Style"}
              {activeStep === 2 && "Step 3: The Result"}
            </span>
          </div>
        </div>

        {/* Container for the stack */}
        <div className="relative w-full h-full max-w-lg mx-auto md:max-w-2xl lg:max-w-4xl">

          {/* Layer 1: Bottom (Original) - Always there, z-10 */}
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
            <img
              src={btmOriginal}
              alt="Original"
              className="w-full h-full object-cover md:object-contain opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-20 left-8 z-10">
              <h3 className="text-4xl md:text-6xl font-playfair text-white opacity-40 font-bold">Original</h3>
            </div>
          </div>

          {/* Layer 2: Middle (Target) - Slides up, z-20 */}
          <div
            ref={targetRef}
            className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-800 shadow-[0_-25px_50px_-12px_rgba(0,0,0,0.8)] will-change-transform"
            style={{ transform: 'translateY(100%)' }}
          >
            <img
              src={btmTarget}
              alt="Target Style"
              className="w-full h-full object-cover md:object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-20 left-8 z-10">
              <h3 className="text-4xl md:text-6xl font-playfair text-white font-bold">Target</h3>
              <p className="text-white/60 mt-2 font-light tracking-wide">Select your desired vibe</p>
            </div>
          </div>

          {/* Layer 3: Top (Result) - Slides up, z-30 */}
          <div
            ref={resultRef}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black shadow-[0_-25px_50px_-12px_rgba(0,0,0,1)] will-change-transform"
            style={{ transform: 'translateY(100%)' }}
          >
            <img
              src={btmResult}
              alt="Result"
              className="w-full h-full object-cover md:object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/10 to-transparent pointer-events-none mix-blend-overlay" />

            <div className="absolute bottom-20 left-8 z-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-px w-12 bg-[#FFD700]" />
                <span className="text-[#FFD700] tracking-widest uppercase text-sm font-bold">Transformation Complete</span>
              </div>
              <h3 className="text-4xl md:text-6xl font-playfair text-white font-bold">New Look</h3>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const VirtualTryOn = () => {
  const [bodyPhoto, setBodyPhoto] = useState<File | null>(null);
  const [clothingPhoto, setClothingPhoto] = useState<File | null>(null);
  const [bodyPreview, setBodyPreview] = useState<string | null>(null);
  const [clothingPreview, setClothingPreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tryonsCount, setTryonsCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const bodyInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { takePicture, pickFromGallery, isLoading: cameraLoading, isNative } = useNativeCamera();
  const { shareOutfit } = useNativeShare();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const MAX_TRYONS = 10;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch user's try-on count, admin status, and VIP subscription
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setIsLoadingCount(false);
        return;
      }

      try {
        // Check if user is admin
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!roleError && roleData) {
          setIsAdmin(true);
        }

        // Check if user is VIP
        const { data: vipData, error: vipError } = await supabase
          .from('vip_subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (!vipError && vipData) {
          setIsVip(true);
        }

        // Fetch tryon count
        const { data, error } = await supabase
          .from('user_tryons')
          .select('tryons_count')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        setTryonsCount(data?.tryons_count || 0);

        // Fetch user avatar for auto-populate
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData?.avatar_url) {
          setUserAvatarUrl(profileData.avatar_url);
          // Auto-set avatar as body preview if user has no body photo yet
          setBodyPreview(profileData.avatar_url);
          // Create a File object from the avatar URL for the actual upload
          try {
            const response = await fetch(profileData.avatar_url);
            const blob = await response.blob();
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
            setBodyPhoto(file);
          } catch (avatarError) {
            console.warn('Could not fetch avatar as file:', avatarError);
            // Still show preview even if file creation fails
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleFileUpload = (file: File, type: 'body' | 'clothing') => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: t('upload.fileSizeError'),
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      if (type === 'body') {
        setBodyPhoto(file);
        setBodyPreview(preview);
      } else {
        setClothingPhoto(file);
        setClothingPreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load preloaded clothing image from location state
  useEffect(() => {
    const state = location.state as { preloadedClothingImage?: string } | null;
    if (state?.preloadedClothingImage) {
      // Fetch the image and convert to File
      fetch(state.preloadedClothingImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `clothing-from-community-${Date.now()}.jpg`, { type: 'image/jpeg' });
          handleFileUpload(file, 'clothing');
          toast({
            title: '已載入穿搭照片',
            description: '請上傳您的全身照以開始試穿',
          });
        })
        .catch(err => {
          console.error('Failed to load preloaded image:', err);
          toast({
            title: '載入照片失敗',
            description: '請手動上傳穿搭照片',
            variant: 'destructive',
          });
        });

      // Clear the state to prevent reloading on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, toast]);

  const handleBodyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, 'body');
  };

  const handleClothingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, 'clothing');
  };

  const handleCameraCaptureBody = async () => {
    const imageDataUrl = await takePicture();
    if (imageDataUrl) {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `body-${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFileUpload(file, 'body');
    }
  };

  const handleCameraCaptureClothing = async () => {
    const imageDataUrl = await takePicture();
    if (imageDataUrl) {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `clothing-${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFileUpload(file, 'clothing');
    }
  };

  const handleGalleryPickBody = async () => {
    const imageDataUrl = await pickFromGallery();
    if (imageDataUrl) {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `body-gallery-${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFileUpload(file, 'body');
    }
  };

  const handleGalleryPickClothing = async () => {
    const imageDataUrl = await pickFromGallery();
    if (imageDataUrl) {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `clothing-gallery-${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFileUpload(file, 'clothing');
    }
  };

  const handleVirtualTryOn = async () => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: t('virtualTryOn.loginRequired'),
        description: t('virtualTryOn.loginRequiredDesc'),
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Check try-on limit (skip for admins and VIP users)
    if (!isAdmin && !isVip && tryonsCount >= MAX_TRYONS) {
      toast({
        title: t('virtualTryOn.limitReached'),
        description: t('virtualTryOn.limitReachedDesc').replace('{count}', MAX_TRYONS.toString()),
        variant: "destructive",
      });
      return;
    }

    if (!bodyPhoto || !clothingPhoto) {
      toast({
        title: t('virtualTryOn.uploadPhoto'),
        description: t('upload.bothPhotosRequired'),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 200);

    const WEBHOOK_URL = 'https://ryann8n.zeabur.app/webhook/17474c15-1097-4bbd-ac43-0c844bca4c0e';

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

      // output array (common in AI providers)
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
          } else if (val && typeof val === 'object') {
            const r = deepSearch(val);
            if (r) return r;
          }
        }
        return null;
      };

      return deepSearch(data);
    };

    // Polling GET to fetch result after workflow started (3 minutes total)
    const pollForResult = async (url: string, maxAttempts = 36, intervalMs = 5000): Promise<string> => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetch(url, { method: 'GET' });
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

    try {
      console.log('開始發送請求到:', WEBHOOK_URL);

      // 檢查URL是否可訪問
      try {
        const testResponse = await fetch(WEBHOOK_URL, {
          method: 'HEAD',
          mode: 'no-cors' // 避免CORS問題的預檢
        });
        console.log('URL連通性測試完成');
      } catch (testError) {
        console.warn('URL連通性測試失敗:', testError);
      }

      const formData = new FormData();
      formData.append('body_image', bodyPhoto);
      formData.append('clothing_image', clothingPhoto);
      formData.append('action', 'virtual_tryon');

      console.log('準備發送表單數據:', {
        body_image: bodyPhoto.name,
        clothing_image: clothingPhoto.name,
        action: 'virtual_tryon'
      });

      const getProxiedUrl = (url: string) => `https://cors.isomorphic-git.org/${url}`;
      let endpoint = WEBHOOK_URL;

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

        // Increment tryon count
        const newCount = await incrementTryonCount();

        toast({
          title: t('virtualTryOn.tryonSuccess'),
          description: t('virtualTryOn.tryonSuccessDesc')
            .replace('{remaining}', (MAX_TRYONS - newCount).toString())
            .replace('{total}', MAX_TRYONS.toString())
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

          // Increment tryon count
          const newCount = await incrementTryonCount();

          toast({
            title: t('virtualTryOn.tryonSuccess'),
            description: t('virtualTryOn.tryonSuccessDesc')
              .replace('{remaining}', (MAX_TRYONS - newCount).toString())
              .replace('{total}', MAX_TRYONS.toString())
          });
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }, 300);
        return;
      }

      // If returns a direct URL or data URL
      const trimmed = responseText.trim().replace(/^"|"$/g, '');
      if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:image')) {
        setProgress(100);
        setTimeout(async () => {
          setResultImage(trimmed);

          // Increment tryon count
          const newCount = await incrementTryonCount();

          toast({
            title: t('virtualTryOn.tryonSuccess'),
            description: t('virtualTryOn.tryonSuccessDesc')
              .replace('{remaining}', (MAX_TRYONS - newCount).toString())
              .replace('{total}', MAX_TRYONS.toString())
          });
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }, 300);
        return;
      }

      let result: any = null;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON解析錯誤:', parseError, '回應內容:', responseText);
        throw new Error('伺服器回應格式錯誤');
      }

      console.log('Webhook response:', result);

      const imgFromJson = extractImageFromJson(result);
      if (imgFromJson) {
        setProgress(100);
        setTimeout(async () => {
          setResultImage(imgFromJson);

          // Increment tryon count
          const newCount = await incrementTryonCount();

          toast({
            title: t('virtualTryOn.tryonSuccess'),
            description: t('virtualTryOn.tryonSuccessDesc')
              .replace('{remaining}', (MAX_TRYONS - newCount).toString())
              .replace('{total}', MAX_TRYONS.toString())
          });
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }, 300);
        return;
      }

      if (result.message === 'Workflow was started') {
        toast({ title: t('virtualTryOn.processing'), description: t('virtualTryOn.processingDesc') });
        const imgUrl = await pollForResult(endpoint);
        setProgress(100);
        setTimeout(async () => {
          setResultImage(imgUrl);

          // Increment tryon count
          const newCount = await incrementTryonCount();

          toast({
            title: t('virtualTryOn.tryonSuccess'),
            description: t('virtualTryOn.tryonSuccessDesc')
              .replace('{remaining}', (MAX_TRYONS - newCount).toString())
              .replace('{total}', MAX_TRYONS.toString())
          });
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }, 300);
        return;
      }

      if (result.code === 0 && result.message) {
        throw new Error(result.message);
      }

      console.warn('未知的回應格式:', result);
      throw new Error(result.message || result.error || '處理失敗，請重試');
    } catch (error) {
      console.error('Virtual try-on error details:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : '未知錯誤',
        errorName: error instanceof Error ? error.name : 'Unknown',
        webhookUrl: WEBHOOK_URL
      });

      let errorMessage = '處理失敗，請重試';

      if (error instanceof Error) {
        // 檢查不同類型的錯誤
        if (error.message.toLowerCase().includes('fetch')) {
          errorMessage = '網絡連接失敗，請檢查您的網絡連接或稍後重試';
        } else if (error.message.toLowerCase().includes('cors')) {
          errorMessage = '跨域請求被阻止，請聯繫技術支援';
        } else if (error.message.toLowerCase().includes('timeout')) {
          errorMessage = '請求超時，請稍後重試';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: t('virtualTryOn.processingFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const incrementTryonCount = async () => {
    if (!user) return tryonsCount;

    // Admins and VIP users don't increment count
    if (isAdmin || isVip) return tryonsCount;

    try {
      const { data, error } = await supabase.rpc('increment_user_tryons', {
        p_user_id: user.id
      });

      if (error) throw error;

      const newCount = data || tryonsCount + 1;
      setTryonsCount(newCount);
      return newCount;
    } catch (error) {
      console.error('Error incrementing tryon count:', error);
      return tryonsCount;
    }
  };

  const downloadResult = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'virtual-tryron-result.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (resultImage) {
      const shared = await shareOutfit(
        t('virtualTryOn.shareTitle'),
        t('virtualTryOn.shareDescription'),
        resultImage
      );

      if (shared) {
        toast({
          title: t('virtualTryOn.shareSuccess'),
          description: t('virtualTryOn.shareSuccessDesc'),
        });
      } else {
        // Fallback to download if sharing is not available
        downloadResult();
      }
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
                {t('betterThanModel.title')}
              </h1>

              {/* Usage Counter */}
              {user && !isLoadingCount && (
                <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                  {isAdmin ? (
                    <>
                      <span className="text-white/70 text-sm">{t('virtualTryOn.admin')}</span>
                      <span className="text-lg font-bold text-green-400">{t('virtualTryOn.unlimited')}</span>
                    </>
                  ) : isVip ? (
                    <>
                      <span className="text-white/70 text-sm">VIP Member</span>
                      <span className="text-lg font-bold text-[#FFD700]">{t('virtualTryOn.unlimited')}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white/70 text-sm">{t('virtualTryOn.remainingTryons')}</span>
                      <span className={`text-lg font-bold ${tryonsCount >= MAX_TRYONS
                        ? 'text-red-400'
                        : tryonsCount >= MAX_TRYONS * 0.8
                          ? 'text-yellow-400'
                          : 'text-[#FF6B35]'
                        }`}>
                        {MAX_TRYONS - tryonsCount} / {MAX_TRYONS}
                      </span>
                    </>
                  )}
                </div>
              )}
              <div className="absolute -inset-6 bg-gradient-to-r from-[hsl(45,60%,50%,0.1)] to-[hsl(45,80%,60%,0.1)] blur-2xl rounded-full"></div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[hsl(45,60%,50%)] to-transparent"></div>
            </div>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-light">
              {t('tryOn.subtitle')}
            </p>
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[hsl(45,60%,50%)] rounded-full animate-pulse"></div>
              <div className="h-px w-16 bg-gradient-to-r from-[hsl(45,60%,50%)] to-transparent"></div>
              <div className="text-[hsl(45,60%,50%)] text-sm font-medium tracking-widest">EXCLUSIVE</div>
              <div className="h-px w-16 bg-gradient-to-l from-[hsl(45,60%,50%)] to-transparent"></div>
              <div className="w-2 h-2 bg-[hsl(45,60%,50%)] rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Horizontal Gallery Showcase */}
          <TransformationShowcase />

          <div className="grid grid-cols-1 gap-8 mb-20 max-w-none w-full">
            {/* Body Photo Upload */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-white/8 to-white/2 backdrop-blur-2xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] hover:shadow-[0_50px_150px_-20px_rgba(197,149,96,0.4)] transition-all duration-700 hover:-translate-y-3 hover:scale-[1.02] rounded-lg">
              {/* Background Image */}
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                style={{ backgroundImage: `url('/lovable-uploads/5acdebbb-cca2-43d2-860a-65f67ab9fdf7.png')` }}></div>

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
                  {t('virtualTryOn.personalPhoto')}
                </h3>
                <p className="text-white/70 text-base font-light">
                  {t('virtualTryOn.uploadPhoto')}
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
                    if (file) handleFileUpload(file, 'body');
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
                  {t('upload.selectFullBodyPhoto')}
                </Button>
              </div>
            </div>

            {/* Clothing Photo Upload */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-white/8 to-white/2 backdrop-blur-2xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] hover:shadow-[0_50px_150px_-20px_rgba(139,69,19,0.4)] transition-all duration-700 hover:-translate-y-3 hover:scale-[1.02] rounded-lg">
              {/* Background Image */}
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 group-hover:opacity-35 transition-opacity duration-500"
                style={{ backgroundImage: `url('/lovable-uploads/2c9565ef-37a9-420c-a328-4f4331bfaeb9.png')` }}></div>

              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-950/70 via-amber-900/50 to-amber-950/70"></div>

              {/* Animated gradient border */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-[hsl(30,50%,40%,0.3)] via-transparent to-[hsl(30,50%,40%,0.3)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Floating orbs */}
              <div className="absolute top-6 right-6 w-3 h-3 bg-[hsl(30,50%,50%)] rounded-full animate-pulse opacity-60 z-10"></div>
              <div className="absolute bottom-6 left-6 w-2 h-2 bg-amber-300 rounded-full animate-pulse opacity-40 delay-300 z-10"></div>

              {/* Subtle glass effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(30,25%,25%,0.08)] to-[hsl(30,30%,35%,0.03)] rounded-lg backdrop-blur-sm"></div>

              <div className="text-center relative z-10 pb-6">
                <h3 className="text-2xl font-playfair text-white mb-2 group-hover:text-[hsl(30,60%,60%)] transition-colors duration-300">
                  {t('betterThanModel.modelOutfits')}
                </h3>
                <p className="text-white/70 text-base font-light">
                  {t('betterThanModel.selectModelOutfit')}
                </p>
              </div>

              <div className="space-y-6 relative z-10 px-6">
                <div
                  onClick={() => clothingInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:border-[hsl(30,50%,50%)] transition-colors bg-white/5 backdrop-blur-sm"
                >
                  {clothingPreview ? (
                    <img
                      src={clothingPreview}
                      alt="Clothing"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                  ) : (
                    <div className="space-y-2">
                      <p className="text-white/60">{t('betterThanModel.clickToUpload')}</p>
                    </div>
                  )}
                </div>

                <input
                  ref={clothingInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleClothingUpload}
                  className="hidden"
                />

                <Button
                  variant="outline"
                  className="w-full bg-gradient-to-r from-gray-700/90 to-gray-600/90 border-gray-500/50 text-white hover:bg-gradient-to-r hover:from-gray-600/90 hover:to-gray-500/90 hover:border-gray-400/60 hover:text-white backdrop-blur-xl h-14 text-lg font-medium transition-all duration-500 rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(100,100,100,0.3)] group"
                  onClick={() => clothingInputRef.current?.click()}
                >
                  {t('betterThanModel.selectModelOutfit')}
                </Button>
              </div>
            </div>

          </div>

          {/* Start Try-On Section */}
          <div className="text-center mb-20">
            <Button
              size="lg"
              onClick={handleVirtualTryOn}
              disabled={!bodyPhoto || !clothingPhoto || isProcessing}
              className="w-full text-lg px-8 py-4 bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-white rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all duration-300 border-none"
            >
              {isProcessing ? (
                <div className="flex flex-col items-center py-2 gap-1">
                  <span className="font-semibold">{t('betterThanModel.transforming')} {Math.floor(progress)}%</span>
                  <span className="text-sm font-normal">{t('betterThanModel.estimatedTime')}</span>
                </div>
              ) : (
                <span>{t('betterThanModel.transformNewStyle')}</span>
              )}
            </Button>

            {resultImage && (
              <div className="mt-8">
                <Button
                  variant="outline"
                  className="bg-gray-700/70 border-gray-500/40 text-white hover:bg-gray-600/80 hover:border-gray-400/50 backdrop-blur-sm h-12 px-8 text-base font-medium transition-all duration-300"
                  onClick={downloadResult}
                >
                  {t('tryOn.downloadWork')}
                </Button>
              </div>
            )}
          </div>

          {/* Result Section - moved here */}
          {resultImage && (
            <div className="mb-12 md:mb-20">
              <div className="relative bg-gradient-to-br from-white/3 to-white/1 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-12 border border-white/5 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.4)]">
                <div className="text-center mb-6 md:mb-12">
                  <h3 className="font-playfair text-2xl md:text-5xl font-bold text-white mb-3 md:mb-6">
                    {t('virtualTryOn.result')}
                  </h3>
                  <p className="text-base md:text-xl text-white/60 max-w-2xl mx-auto">
                    {t('tryOn.perfectResult')}
                  </p>
                </div>

                <div className="max-w-none w-full mx-auto">
                  <div className="relative group rounded-2xl md:rounded-3xl overflow-hidden">
                    <img
                      src={resultImage}
                      alt="Virtual try-on result"
                      className="w-full max-h-[75vh] md:max-h-[70vh] object-contain rounded-xl md:rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-xl md:rounded-2xl pointer-events-none"></div>

                    {/* RSS Logo Watermark - bottom right */}
                    <img
                      src={rssWatermark}
                      alt="RSS"
                      className="absolute bottom-3 right-3 md:bottom-6 md:right-6 w-10 h-auto md:w-14 opacity-70"
                    />
                  </div>

                  <div className="mt-8 text-center">
                    <Button
                      variant="outline"
                      className="bg-gradient-to-r from-[hsl(45,60%,50%)] to-[hsl(45,80%,60%)] border-none text-black hover:bg-gradient-to-r hover:from-[hsl(45,60%,60%)] hover:to-[hsl(45,80%,70%)] h-12 px-8 font-medium transition-all duration-300"
                      onClick={downloadResult}
                    >
                      {t('tryOn.downloadWork')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;
