import { useState, useEffect } from 'react';
import splashBg from "@/assets/fashion-hero.jpg";

interface SplashScreenProps {
  onEnter: () => void;
}

const SplashScreen = ({ onEnter }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Start showing content shortly after mount
    setTimeout(() => setShowContent(true), 100);

    // Auto-enter after 2 seconds
    const timer = setTimeout(() => {
      handleEnter();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    if (isExiting) return;

    // Start exit animation immediately
    setIsExiting(true);

    // Wait for exit animation to complete before unmounting
    setTimeout(() => {
      setIsVisible(false);
      onEnter();
    }, 1000);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] overflow-hidden bg-black transition-opacity duration-1000 ease-in-out ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Background Image with Ken Burns Effect */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transform transition-transform duration-[20s] ease-linear ${isExiting ? 'scale-110' : 'scale-105'} ${showContent ? 'scale-110' : 'scale-100'}`}
        style={{ backgroundImage: `url(${splashBg})` }}
      />

      {/* Dark Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30 opacity-90" />

      {/* Content Container */}
      <div className={`relative z-10 h-full flex flex-col items-center justify-center py-20 px-8 transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

        {/* Top Title - Vogue Style */}
        <div className="text-center space-y-2">
          <div className="overflow-hidden">
            <h1 className="text-6xl md:text-8xl font-serif text-[#D4AF37] tracking-tighter animate-fade-in-up drop-shadow-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
              RSS
            </h1>
          </div>
          <div className="h-[1px] w-24 bg-[#D4AF37]/60 mx-auto my-4 transition-all duration-1000 delay-500" />
          <p className="text-white/90 text-sm md:text-base tracking-[0.3em] font-light uppercase">
            Ridiculous Style Share
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
