import OutfitCard from "./OutfitCard";
import outfit1 from "@/assets/outfit-1.jpg";
import outfit2 from "@/assets/outfit-2.jpg";
import outfit3 from "@/assets/outfit-3.jpg";
import outfitAsian1 from "@/assets/outfit-asian-1.jpg";
import outfitAsian2 from "@/assets/outfit-asian-2.jpg";
import outfitEuropean1 from "@/assets/outfit-european-1.jpg";
import outfitBohemian from "@/assets/outfit-bohemian.jpg";
import outfitMinimalist from "@/assets/outfit-minimalist.jpg";
import outfitStreetwear from "@/assets/outfit-streetwear.jpg";
import { useLanguage } from "@/hooks/useLanguage";

const OutfitGrid = () => {
  const { t } = useLanguage();
  
  const outfits = [
    {
      id: 1,
      image: outfitAsian1,
      titleKey: "outfitGrid.outfits.asianSweet",
      username: "asian_fashion",
      likes: 324,
      comments: 28,
      tagsKeys: ["outfitGrid.tags.asian", "outfitGrid.tags.sweet", "outfitGrid.tags.floral", "outfitGrid.tags.fresh"]
    },
    {
      id: 2,
      image: outfitEuropean1,
      titleKey: "outfitGrid.outfits.europeanClassic",
      username: "paris_chic",
      likes: 456,
      comments: 35,
      tagsKeys: ["outfitGrid.tags.european", "outfitGrid.tags.classic", "outfitGrid.tags.trenchCoat", "outfitGrid.tags.elegant"]
    },
    {
      id: 3,
      image: outfitAsian2,
      titleKey: "outfitGrid.outfits.koreanModern",
      username: "korean_style",
      likes: 389,
      comments: 42,
      tagsKeys: ["outfitGrid.tags.korean", "outfitGrid.tags.modern", "outfitGrid.tags.hanbok", "outfitGrid.tags.gentle"]
    },
    {
      id: 4,
      image: outfitBohemian,
      titleKey: "outfitGrid.outfits.bohemian",
      username: "boho_queen",
      likes: 267,
      comments: 19,
      tagsKeys: ["outfitGrid.tags.bohemian", "outfitGrid.tags.free", "outfitGrid.tags.layered", "outfitGrid.tags.retro"]
    },
    {
      id: 5,
      image: outfitMinimalist,
      titleKey: "outfitGrid.outfits.nordicMinimal",
      username: "minimal_nordic",
      likes: 198,
      comments: 14,
      tagsKeys: ["outfitGrid.tags.nordic", "outfitGrid.tags.minimal", "outfitGrid.tags.quality", "outfitGrid.tags.modern"]
    },
    {
      id: 6,
      image: outfitStreetwear,
      titleKey: "outfitGrid.outfits.urbanStreet",
      username: "urban_style",
      likes: 534,
      comments: 67,
      tagsKeys: ["outfitGrid.tags.street", "outfitGrid.tags.trendy", "outfitGrid.tags.personality", "outfitGrid.tags.urban"]
    },
    {
      id: 7,
      image: outfit1,
      titleKey: "outfitGrid.outfits.businessElegant",
      username: "business_chic",
      likes: 234,
      comments: 18,
      tagsKeys: ["outfitGrid.tags.business", "outfitGrid.tags.elegant", "outfitGrid.tags.professional", "outfitGrid.tags.fashion"]
    },
    {
      id: 8,
      image: outfit2,
      titleKey: "outfitGrid.outfits.casualComfort",
      username: "comfort_style",
      likes: 189,
      comments: 12,
      tagsKeys: ["outfitGrid.tags.casual", "outfitGrid.tags.comfortable", "outfitGrid.tags.daily", "outfitGrid.tags.relaxed"]
    },
    {
      id: 9,
      image: outfit3,
      titleKey: "outfitGrid.outfits.eveningElegant",
      username: "evening_elegance",
      likes: 345,
      comments: 25,
      tagsKeys: ["outfitGrid.tags.evening", "outfitGrid.tags.elegant", "outfitGrid.tags.formal", "outfitGrid.tags.luxury"]
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
            {t('outfitGrid.title')}
            <span className="text-gradient">{t('outfitGrid.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('outfitGrid.subtitle')}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {outfits.map((outfit, index) => (
            <div 
              key={outfit.id} 
              className="fashion-enter"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <OutfitCard 
                {...outfit} 
                title={t(outfit.titleKey)}
                tags={outfit.tagsKeys.map(key => t(key))}
              />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-gradient-to-r from-primary to-orange-400 text-white rounded-full font-medium hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            {t('outfitGrid.loadMore')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default OutfitGrid;