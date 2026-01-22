import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ShareOutfit from '@/components/ShareOutfit';
import CommunityFeed from '@/components/CommunityFeed';
import TrendingPosts from '@/components/TrendingPosts';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

const Community = () => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleShareClick = () => {
    if (!user) {
      toast({
        title: t('auth.loginRequired'),
        description: t('auth.loginToShare'),
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    setIsShareOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Spacer */}
      <div className="h-16 md:h-20"></div>

      <div className="container mx-auto px-4 py-8" id="feed-content">
        {/* Premium Header */}
        <div className="mb-10 text-center space-y-3">
        </div>

        {/* Trending Posts */}
        <section className="mb-16">
          <TrendingPosts />
        </section>

        {/* Community Feed */}
        <section>
          <CommunityFeed />
        </section>
      </div>


    </div>
  );
};

export default Community;