import { Camera, Users, Heart, TrendingUp, Sparkles, Award } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const Features = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: Camera,
      titleKey: "features.easyShare",
      descriptionKey: "features.easyShareDesc"
    },
    {
      icon: Users,
      titleKey: "features.fashionCommunity",
      descriptionKey: "features.fashionCommunityDesc"
    },
    {
      icon: Heart,
      titleKey: "features.inspirationCollection",
      descriptionKey: "features.inspirationCollectionDesc"
    },
    {
      icon: TrendingUp,
      titleKey: "features.trendTracking",
      descriptionKey: "features.trendTrackingDesc"
    },
    {
      icon: Sparkles,
      titleKey: "features.personalRecommendation",
      descriptionKey: "features.personalRecommendationDesc"
    },
    {
      icon: Award,
      titleKey: "features.tasteRecognition",
      descriptionKey: "features.tasteRecognitionDesc"
    }
  ];

  return (
    <section className="py-20 bg-muted/20">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient">{t('features.title')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-8 bg-card rounded-2xl shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-2 fashion-enter"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="font-playfair text-xl font-semibold mb-4 group-hover:text-primary transition-colors">
                {t(feature.titleKey)}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {t(feature.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;