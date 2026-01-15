import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNativeCamera } from "@/hooks/useNativeCamera";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import rssWatermark from "@/assets/rss-watermark.png";
import GridTransformationShowcase from "@/components/GridTransformationShowcase";
import styleTryingOriginal from "@/assets/style-trying-original.png";
import styleTryingResult1 from "@/assets/style-trying-result-1.png";
import styleTryingResult2 from "@/assets/style-trying-result-2.png";
import styleTryingResult3 from "@/assets/style-trying-result-3.png";
import styleTryingResult4 from "@/assets/style-trying-result-4.png";
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
  const [selectedStyle, setSelectedStyle] = useState<string>("");

  // Style options by gender
  const maleStyles = [
    { value: 'Minimalist', label: '極簡風' },
    { value: 'Italian Classic', label: '經典義式紳裝' },
    { value: 'Mediterranean', label: '南歐渡假風' },
    { value: 'British Gentleman', label: '英倫紳士 / 薩佛街風格' },
    { value: 'Streetwear', label: '街頭潮流' },
    { value: 'Business Casual', label: '商務休閒' },
    { value: 'Smart Casual', label: '體面休閒' },
    { value: 'City Boy', label: '日系 City Boy' },
    { value: 'Gorpcore', label: '戶外機能 / 山系' },
    { value: 'Ivy League', label: '學院風' },
    { value: 'Vintage', label: '復古古著' },
    { value: 'Old Money', label: '老錢風 / 靜奢' },
    { value: 'Workwear', label: '工裝風格' },
    { value: 'Techwear', label: '賽博龐克 / 機能' },
    { value: 'Athleisure', label: '運動休閒' },
    { value: 'Grunge', label: '頹廢搖滾' },
    { value: 'American Casual', label: '美式休閒' },
    { value: 'Military', label: '軍事風格' },
  ];

  const femaleStyles = [
    { value: 'Coquette', label: '甜美少女風' },
    { value: 'Minimalist', label: '極簡風' },
    { value: 'Streetwear', label: '街頭潮流' },
    { value: 'Business Casual', label: '商務休閒' },
    { value: 'French Chic', label: '法式慵懶' },
    { value: 'Bohemian', label: '波西米亞' },
    { value: 'Cottagecore', label: '田園風' },
    { value: 'Preppy', label: '學院風' },
    { value: 'Vintage', label: '復古古著' },
    { value: 'Old Money', label: '老錢風 / 靜奢' },
    { value: 'Y2K', label: 'Y2K 千禧風' },
    { value: 'Balletcore', label: '芭蕾風' },
    { value: 'Athleisure', label: '運動休閒' },
    { value: 'Boyish', label: '中性風' },
    { value: 'Mori Girl', label: '森林系' },
  ];

  // Get styles based on selected gender
  const currentStyles = selectedGender === 'Male' ? maleStyles : selectedGender === 'Female' ? femaleStyles : [];
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

  // Reset style when gender changes
  useEffect(() => {
    setSelectedStyle("");
  }, [selectedGender]);

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

      // 轉換風格值 - 直接使用英文值傳給 API
      const styleValue = selectedStyle;

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

    <div className="min-h-screen relative bg-[#050505]">

      <div className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto px-0">
          {/* Premium Header */}
          {/* Premium Header */}
          <div className="text-center mb-8 mt-12 md:mt-20">
            <div className="inline-block relative">
              <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white relative z-10">
                Try New Style Here
              </h1>
              <div className="absolute -inset-6 bg-gradient-to-r from-[hsl(45,60%,50%,0.1)] to-[hsl(45,80%,60%,0.1)] blur-2xl rounded-full"></div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[hsl(45,60%,50%)] to-transparent"></div>
            </div>
          </div>

          {/* Grid Style Showcase */}
          <div className="mb-20">
            <GridTransformationShowcase
              originalImage={styleTryingOriginal}
              resultImages={[
                styleTryingResult1,
                styleTryingResult2,
                styleTryingResult3,
                styleTryingResult4
              ]}
            />
          </div>

          <div className="max-w-md mx-auto w-full">
            <Button
              className="w-full bg-gradient-to-r from-gray-700/90 to-gray-600/90 border-gray-500/50 text-white hover:bg-gradient-to-r hover:from-gray-600/90 hover:to-gray-500/90 hover:border-gray-400/60 hover:text-white backdrop-blur-xl h-14 text-lg font-medium transition-all duration-500 rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(100,100,100,0.3)] group"
              onClick={() => navigate('/style-transfer-input')}
            >
              {t('styleTrying.uploadBody') || "換你試試"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleTrying;
