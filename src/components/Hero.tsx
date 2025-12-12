import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import heroImage from "@/assets/fashion-hero.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <section data-section="virtual-tryon" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Fashion Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-luxury-black/70 via-luxury-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container text-center text-white fashion-enter">
        <h1 className="font-sans text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">
          {t('hero.title1')}
        </h1>

        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto leading-relaxed text-hermes">
          {t('hero.subtitle')}
        </p>

        {/* Enhanced Virtual Try-On Section - Card Style */}
        <div className="flex flex-col items-center mb-12 space-y-8">
          {/* Main CTA Card */}
          <div className="relative group max-w-md w-full">
            {/* Background card */}
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]">
              {/* Floating orbs */}
              <div className="absolute top-4 right-6 w-3 h-3 bg-primary rounded-full animate-pulse opacity-60"></div>
              <div className="absolute bottom-6 left-6 w-2 h-2 bg-orange-400 rounded-full animate-pulse opacity-40 delay-300"></div>

              {/* Icon section */}
              <div className="text-center mb-6">
                <h3 className="font-playfair text-2xl font-bold text-white mb-2">
                  {t('hero.onlineTryOn')}
                </h3>
                <p className="text-white/70 text-sm">
                  {t('hero.tagline')}
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full text-lg px-8 py-4 bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-white rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all duration-300 border-none"
                  onClick={() => navigate('/style-trying')}
                >
                  {t('hero.tryNewStyle')}
                </Button>
                <Button
                  size="lg"
                  className="w-full text-lg px-8 py-4 bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-white rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all duration-300 border-none"
                  onClick={() => navigate('/better-than-model')}
                >
                  {t('hero.experience')}
                </Button>
                <Button
                  size="lg"
                  className="w-full text-lg px-8 py-4 bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-white rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all duration-300 border-none"
                  onClick={() => navigate('/community')}
                >
                  {t('hero.community')}
                </Button>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;