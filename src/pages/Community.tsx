import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles } from 'lucide-react';
import ShareOutfit from '@/components/ShareOutfit';
import CommunityFeed from '@/components/CommunityFeed';
import TrendingPosts from '@/components/TrendingPosts';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

const Community = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTabChange = (value: string) => {
    if (value === 'share' && !user) {
      toast({
        title: t('auth.loginRequired'),
        description: t('auth.loginToShare'),
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="container relative h-full mx-auto px-4 flex flex-col justify-center items-center text-center z-10">
          <Badge className="mb-4 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md transition-all">
            <Sparkles className="w-3 h-3 mr-1 text-yellow-400" />
            {t('community.title')}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent font-bebas tracking-wider drop-shadow-2xl">
            RSS Community
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8 font-light leading-relaxed">
            {t('community.subtitle')}
          </p>

          <div className="flex gap-4">
            <Button
              size="lg"
              className="rounded-full bg-white text-black hover:bg-gray-100 font-bold px-8 shadow-xl shadow-white/10 transition-all hover:scale-105"
              onClick={() => document.getElementById('feed-content')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('community.feed')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/20 text-white hover:bg-white/10 backdrop-blur-sm px-8 transition-all hover:scale-105"
              onClick={() => handleTabChange('share')}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('community.shareOutfit')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12" id="feed-content">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
          <div className="flex justify-center sticky top-20 z-30 bg-background/80 backdrop-blur-xl py-4 rounded-full border border-white/5 shadow-2xl max-w-md mx-auto">
            <TabsList className="grid w-full grid-cols-2 bg-transparent p-1">
              <TabsTrigger
                value="feed"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                {t('community.feed')}
              </TabsTrigger>
              <TabsTrigger
                value="share"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('community.shareOutfit')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feed" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section>
              <TrendingPosts />
            </section>
            <section>
              <CommunityFeed />
            </section>
          </TabsContent>

          <TabsContent value="share" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {user ? <ShareOutfit /> : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;