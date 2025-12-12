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
      <div className="h-8"></div>

      <div className="container mx-auto px-4 py-8" id="feed-content">
        {/* Trending Posts */}
        <section className="mb-12">
          <TrendingPosts />
        </section>

        {/* Community Feed */}
        <section>
          <CommunityFeed />
        </section>
      </div>

      {/* Floating Action Button */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogTrigger asChild>
          <button
            onClick={handleShareClick}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-primary/30 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
            aria-label={t('community.shareOutfit')}
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <ShareOutfit onSuccess={() => setIsShareOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;