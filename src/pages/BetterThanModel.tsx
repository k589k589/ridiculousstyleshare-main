import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";

import btmOriginal from "@/assets/btm-original-v2.png";
import btmTarget from "@/assets/btm-target-v2.png";
import btmResult from "@/assets/btm-result-v2.png";

// 3-Column "Triptych Build" Showcase Component
import TransformationShowcase from "@/components/TransformationShowcase";

const BetterThanModel = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleStartExperience = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate('/better-than-model-input');
  };

  return (
    <div className="min-h-screen relative bg-[#050505]">
      {/* Luxury Dressing Room Background - Deep Black Theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/20 via-black to-black"></div>

      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto px-0">
          {/* Premium Header */}
          <div className="text-center mb-12 mt-12 md:mt-20">
            <div className="inline-block relative mb-8">
              <h1 className="font-playfair text-5xl md:text-7xl font-bold text-white mb-4 relative z-10">
                {t('betterThanModel.title')}
              </h1>
              <div className="absolute -inset-6 bg-gradient-to-r from-[hsl(45,60%,50%,0.1)] to-[hsl(45,80%,60%,0.1)] blur-2xl rounded-full"></div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[hsl(45,60%,50%)] to-transparent"></div>
            </div>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-light">
              {t('betterThanModel.subtitle')}
            </p>
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="h-px w-16 bg-gradient-to-r from-[hsl(45,60%,50%)] to-transparent"></div>
              <div className="text-[hsl(45,60%,50%)] text-sm font-medium tracking-widest">EXCLUSIVE</div>
              <div className="h-px w-16 bg-gradient-to-l from-[hsl(45,60%,50%)] to-transparent"></div>
            </div>
          </div>

          {/* Horizontal Gallery Showcase */}
          <div className="mb-16">
            <TransformationShowcase
              originalImage={btmOriginal}
              targetImage={btmTarget}
              resultImage={btmResult}
            />
          </div>

          {/* Call to Action Button */}
          <div className="flex justify-center pb-20">
            <Button
              onClick={handleStartExperience}
              className="group relative px-12 py-8 bg-transparent overflow-hidden rounded-full border border-white/20 transition-all duration-500 hover:border-[hsl(45,60%,50%)] hover:shadow-[0_0_40px_-10px_rgba(197,149,96,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(45,60%,50%,0.1)] to-[hsl(45,80%,60%,0.1)] translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <span className="relative z-10 text-2xl font-light tracking-[0.2em] text-white uppercase group-hover:text-[hsl(45,60%,50%)] transition-colors duration-300">
                {language === 'zh' ? '換你試試' : 'YOUR TURN'}
              </span>
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BetterThanModel;
