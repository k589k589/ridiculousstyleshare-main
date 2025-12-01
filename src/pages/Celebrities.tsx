import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import celebritiesShowcase from "@/assets/celebrities-showcase.jpg";
import { Star, Sparkles } from "lucide-react";

const Celebrities = () => {
  const { t } = useLanguage();

  const categories = [
    { name: t('celebrities.models'), icon: "👗" },
    { name: t('celebrities.influencers'), icon: "📸" },
    { name: t('celebrities.stylists'), icon: "✨" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block relative mb-6">
            <h1 className="font-playfair text-5xl md:text-7xl font-bold text-white mb-4">
              {t('celebrities.title')}
            </h1>
            <div className="absolute -inset-6 bg-gradient-to-r from-[#FF6600]/20 to-[#FF6600]/10 blur-2xl rounded-full"></div>
          </div>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            {t('celebrities.subtitle')}
          </p>
        </div>

        {/* Categories with Blur */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {categories.map((category, index) => (
            <div key={index} className="relative">
              <Card className="hover:shadow-lg transition-shadow bg-black/80 border-[#FF6600]/30 backdrop-blur-sm">
                <CardContent className="p-8 text-center blur-sm">
                  <div className="text-5xl mb-4">{category.icon}</div>
                  <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Celebrities Showcase Image with Blur */}
        <div className="relative mb-12">
          <Card className="overflow-hidden shadow-2xl bg-black/50 border-[#FF6600]/30">
            <div className="relative aspect-video">
              <img 
                src={celebritiesShowcase} 
                alt="Fashion Models and Celebrities" 
                className="w-full h-full object-cover blur-md"
              />
              <div className="absolute inset-0 bg-black/60"></div>
              
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-6 z-10">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#FF6600]/20 backdrop-blur-sm mb-4 border-2 border-[#FF6600]/50">
                    <Sparkles className="w-12 h-12 text-[#FF6600] animate-pulse" />
                  </div>
                  <h2 className="text-5xl md:text-7xl font-playfair font-bold text-white">
                    Coming Soon
                  </h2>
                  <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-[#FF6600] to-transparent"></div>
                  <div className="flex items-center gap-2 text-[#FF6600]">
                    <Star className="w-6 h-6 fill-[#FF6600]" />
                    <span className="text-lg font-semibold">{t('celebrities.featured')}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <Card className="bg-black/80 border-[#FF6600]/30 backdrop-blur-sm">
          <CardContent className="p-16 text-center">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="space-y-4 text-white/70">
                <p className="text-xl">
                  {t('celebrities.comingSoonDesc')}
                </p>
                <p className="text-lg blur-sm">
                  {t('celebrities.comingSoonDetails')}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 mt-12">
                <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Celebrities;
