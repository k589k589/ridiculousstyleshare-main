import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import Hero from "@/components/Hero";
import StyleChanger from "@/components/StyleChanger";
import OutfitGrid from "@/components/OutfitGrid";
import Features from "@/components/Features";

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Check if this is an email confirmation callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    // Handle email confirmation (type might be 'signup' or 'magiclink', or just presence of access_token)
    if (accessToken && type !== 'recovery') {
      // Wait a bit for auth state to update
      const timer = setTimeout(() => {
        if (user) {
          toast({
            title: t('toast.registrationComplete'),
            description: "",
            duration: 5000,
          });
          
          // Clean up the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, toast, navigate, t]);

  return (
    <div className="w-full">
      <StyleChanger />
      <Hero />
      <OutfitGrid />
      <Features />
    </div>
  );
};

export default Index;
