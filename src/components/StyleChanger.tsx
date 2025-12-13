import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import bgImage from "@/assets/luxury-closet-bg.jpg";
import missionVideo from "@/assets/mission-bg.mov";

// Parallax showcase images
import parallaxOriginal3 from "@/assets/parallax-original-3.png";
import parallaxResult3 from "@/assets/parallax-result-3.png";
import parallaxOriginal4 from "@/assets/parallax-original-4.jpg";
import parallaxResult4 from "@/assets/parallax-result-4.png";

const ParallaxShowcase = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const originalRef3 = useRef<HTMLImageElement>(null);
  const resultRef3 = useRef<HTMLImageElement>(null);
  const originalRef4 = useRef<HTMLImageElement>(null);
  const resultRef4 = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const distance = -rect.top;
      const height = rect.height - viewportHeight;
      let progress = distance / height;

      progress = Math.max(0, Math.min(1, progress));

      // Helper for animation
      const animatePair = (orig: HTMLImageElement | null, res: HTMLImageElement | null) => {
        if (orig) {
          orig.style.transform = `translateY(${progress * -50}px) scale(${1 - progress * 0.05})`;
          orig.style.opacity = `${1 - Math.pow(progress, 3)}`;
        }
        if (res) {
          const slideUp = 100 - (progress * 100);
          const scale = 0.9 + (progress * 0.1);
          res.style.transform = `translateY(${slideUp}px) scale(${scale})`;
          res.style.opacity = `${Math.pow(progress, 1.5)}`;
        }
      };

      // Animate 2 pairs
      animatePair(originalRef3.current, resultRef3.current);
      animatePair(originalRef4.current, resultRef4.current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[180vh] z-20 pointer-events-none">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        {/* Single row of 2 transformation cases */}
        <div className="flex items-center justify-center gap-2 md:gap-4 w-full h-[70vh] p-2 md:p-4">

          {/* CASE 1 (Left - Mountain guy) */}
          <div className="relative w-1/2 h-full">
            <div className="absolute inset-0 flex items-center justify-center z-10 transition-transform duration-100 ease-out will-change-transform">
              <img
                ref={originalRef3}
                src={parallaxOriginal3}
                alt="Original Style 1"
                className="w-full h-full object-contain rounded-sm shadow-2xl brightness-[0.8] filter will-change-transform"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-20 transition-transform duration-100 ease-out will-change-transform">
              <img
                ref={resultRef3}
                src={parallaxResult3}
                alt="Transformed Style 1"
                className="w-full h-full object-contain rounded-sm shadow-[0_35px_60px_-15px_rgba(0,0,0,0.9)] opacity-0 will-change-transform"
              />
            </div>
          </div>

          {/* CASE 2 (Right - Model blazer to blouse) */}
          <div className="relative w-1/2 h-full">
            <div className="absolute inset-0 flex items-center justify-center z-10 transition-transform duration-100 ease-out will-change-transform">
              <img
                ref={originalRef4}
                src={parallaxOriginal4}
                alt="Original Style 2"
                className="w-full h-full object-contain rounded-sm shadow-2xl brightness-[0.8] filter will-change-transform"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-20 transition-transform duration-100 ease-out will-change-transform">
              <img
                ref={resultRef4}
                src={parallaxResult4}
                alt="Transformed Style 2"
                className="w-full h-full object-contain rounded-sm shadow-[0_35px_60px_-15px_rgba(0,0,0,0.9)] opacity-0 will-change-transform"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const StyleChanger = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [resultImage, setResultImage] = useState<string>("");
  const [resultText, setResultText] = useState<string>("");
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openTryOnRoom = () => {
    const tryOnSection = document.querySelector('[data-section="virtual-tryon"]');
    if (tryOnSection) {
      tryOnSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      toast({
        title: "Coming Soon",
        description: "Virtual Try-On Room is under construction.",
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage || !gender) {
      toast({
        title: "Missing Information",
        description: "Please upload a photo and select your gender.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setProgressMessage("正在分析大家穿什麼");

    // Simulate progress - 減慢速度
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        const newProgress = prev + Math.random() * 2 + 0.5; // 每次增加 0.5-2.5%

        // 根據進度更新訊息
        if (newProgress < 33) {
          setProgressMessage("正在分析大家穿什麼");
        } else if (newProgress < 70) {
          setProgressMessage("正在互相搭配找出最佳搭配");
        } else {
          setProgressMessage("正在幫你換上新風格");
        }

        return newProgress;
      });
    }, 500); // 從 200ms 改為 500ms

    try {
      const formData = new FormData();
      formData.append("photo", selectedImage);
      formData.append("gender", gender === "male" ? "男性" : "女性");

      const response = await fetch(
        "https://ryann8n.zeabur.app/webhook/6aded9da-584c-4a3e-b922-1513435e9aa3",
        {
          method: "POST",
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const result = await response.json();

        // Assuming the response contains a photo URL or base64 image
        if (result.photo || result.image || result.url) {
          setResultImage(result.photo || result.image || result.url);
        }

        // Extract text from response
        if (result.text || result.description || result.message) {
          setResultText(result.text || result.description || result.message);
        }

        toast({
          title: "Success!",
          description: "Your style transformation is ready!",
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      clearInterval(progressInterval);
      toast({
        title: "Error",
        description: "Failed to upload your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <>
      {/* Mission Section */}
      <section className="relative h-[150vh] overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={missionVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl space-y-8 animate-fade-in">
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-white tracking-wider whitespace-nowrap">
              {t('styleChanger.missionTitle')}
            </h2>
            <Button
              onClick={() => document.getElementById('style-changer-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-8 bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              {t('styleChanger.startJourney')}
            </Button>
            <div className="flex gap-4 justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/community'}
                className="bg-orange-500 border-orange-500 text-white hover:bg-orange-600 hover:border-orange-600"
              >
                {t('styleChanger.communityButton')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Style Changer Section with Shared Background */}
      <section id="style-changer-section" className="relative min-h-screen bg-black">
        {/* Content Container */}
        <div className="relative z-10">
          {/* Header */}
          <div className="relative pt-8 pb-0 px-4 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white leading-tight">
              {t('styleChanger.title')}
            </h1>
            <p className="text-lg text-hermes mb-2">
              {t('styleChanger.subtitle')}
            </p>
          </div>

          {/* Parallax Showcase inserted between Header and Upload */}
          <ParallaxShowcase />

          {/* Upload Section */}
          <div className="relative pb-20 pt-2">
            {/* Upload Card */}
            <div className="relative group mx-2 mb-8">
              <div className="group relative overflow-hidden bg-gradient-to-br from-white/4 to-white/1 backdrop-blur-2xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] hover:shadow-[0_50px_150px_-20px_rgba(197,149,96,0.4)] transition-all duration-700 hover:-translate-y-3 hover:scale-[1.02] rounded-lg">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(45,60%,50%,0.08)] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[hsl(220,60%,50%,0.06)] rounded-full blur-2xl"></div>

                <div className="relative p-8">
                  <div className="space-y-6">
                    {/* Upload Area */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Label className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-white leading-tight">{t('styleChanger.uploadPhoto')}</Label>
                        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
                          <DialogTrigger asChild>
                            <button type="button" className="inline-flex items-center">
                              <Info className="w-7 h-7 text-white/70 hover:text-white cursor-pointer transition-colors" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>使用說明 / Instructions</DialogTitle>
                            </DialogHeader>
                            <ul className="space-y-4 text-sm">
                              <li>
                                <div className="font-medium">1. 盡量上傳清晰的個人獨照並且是全身照片</div>
                                <div className="text-muted-foreground mt-1">Please upload a clear solo full-body photo</div>
                              </li>
                              <li>
                                <div className="font-medium">2. 出現的結果不一定是最好看的，但一定是完整不同風格</div>
                                <div className="text-muted-foreground mt-1">Results may vary but will always show a complete style transformation</div>
                              </li>
                              <li>
                                <div className="font-medium">3. 每次出現的結果都會不一樣，所以可以盡量嘗試</div>
                                <div className="text-muted-foreground mt-1">Each result will be different, so feel free to try multiple times</div>
                              </li>
                              <li>
                                <div className="font-medium">4. 如果等太久有可能是模型跑失敗了</div>
                                <div className="text-muted-foreground mt-1">If it takes too long, the model may have failed</div>
                              </li>
                            </ul>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:border-[hsl(45,60%,50%)] transition-colors bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center"
                        >
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-h-64 mx-auto rounded-lg"
                            />
                          ) : (
                            <div className="space-y-2">
                              <p className="text-white/60">點擊上傳照片</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Gender Selection */}
                    <div>
                      <Label className="text-base font-semibold mb-3 block text-white">{t('styleChanger.selectGender')}</Label>
                      <RadioGroup value={gender} onValueChange={setGender} className="space-y-3">
                        <div className="flex items-center space-x-3 p-4 rounded-xl border border-white/20 hover:border-hermes transition-colors cursor-pointer bg-black/30">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male" className="cursor-pointer flex-1 text-white">{t('styleChanger.male')}</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 rounded-xl border border-white/20 hover:border-hermes transition-colors cursor-pointer bg-black/30">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female" className="cursor-pointer flex-1 text-white">{t('styleChanger.female')}</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Submit Button */}
                    <Button
                      id="transform-style-button"
                      onClick={handleSubmit}
                      disabled={!selectedImage || !gender || isLoading}
                      className="w-full h-auto min-h-12 text-base bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-white rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      {isLoading ? (
                        <div className="flex flex-col items-center py-2 gap-1">
                          <span className="font-semibold">We are changing you. {Math.floor(progress)}%</span>
                          <span className="text-sm font-normal">(Estimated time: 1 min 30 sec)</span>
                          <span className="text-sm font-normal animate-pulse mt-1">✨ {progressMessage}</span>
                        </div>
                      ) : "Transform My Style"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Display */}
            {resultImage && (
              <div className="mt-12 relative group">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                    Your New Style
                  </h3>
                  <p className="text-muted-foreground mt-2">Here's your transformed look!</p>
                </div>
                <div className="w-full">
                  <img
                    src={resultImage}
                    alt="Style transformation result"
                    className="w-full h-auto shadow-2xl"
                  />
                  {resultText && (
                    <div className="mt-6 p-6 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md">
                      <p className="text-white text-center text-lg">{resultText}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => {
                        document.getElementById('transform-style-button')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-white rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-300"
                      size="lg"
                    >
                      {t('styleChanger.tryAgain')}
                    </Button>
                    <Button
                      onClick={() => {
                        const tryOnSection = document.querySelector('[data-section="virtual-tryon"]');
                        tryOnSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-white rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-300"
                      size="lg"
                    >
                      {t('styleChanger.trySpecific')}
                    </Button>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = resultImage;
                        link.download = 'style-transformation.jpg';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-white rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-300"
                      size="lg"
                    >
                      {t('styleChanger.downloadShare')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default StyleChanger;
