import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, TrendingUp, User, Shirt } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import OutfitDetailDialog from '@/components/OutfitDetailDialog';

interface TrendingOutfit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string;
  style_tags: string[] | null;
  likes_count: number;
  comments_count: number;
  try_count: number | null;
  created_at: string;
  is_liked?: boolean;
  profiles: {
    name: string;
    avatar_url: string | null;
  } | null;
}

const TrendingPosts = () => {
  const [trendingOutfits, setTrendingOutfits] = useState<TrendingOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<TrendingOutfit | null>(null);
  const [tryOnConfirmDialog, setTryOnConfirmDialog] = useState<{ open: boolean; outfit: TrendingOutfit | null }>({ open: false, outfit: null });
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingOutfits();
  }, []);

  const fetchTrendingOutfits = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: outfitsData, error } = await supabase
        .from('outfits')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('likes_count', { ascending: false })
        .limit(3);

      if (error) throw error;

      let outfitsWithProfiles = outfitsData || [];
      if (outfitsData && outfitsData.length > 0) {
        const userIds = Array.from(new Set(outfitsData.map((o: any) => o.user_id)));
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id,name,avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, { name: p.name, avatar_url: p.avatar_url }]));
        outfitsWithProfiles = outfitsData.map((o: any) => ({
          ...o,
          profiles: profileMap.get(o.user_id) || null,
        }));
      }

      // Check like status for logged-in users
      if (user && outfitsWithProfiles.length > 0) {
        const outfitIds = outfitsWithProfiles.map((o: any) => o.id);
        const { data: likesData } = await supabase
          .from('outfit_likes')
          .select('outfit_id')
          .eq('user_id', user.id)
          .in('outfit_id', outfitIds);

        const likedOutfitIds = new Set(likesData?.map(l => l.outfit_id) || []);
        outfitsWithProfiles = outfitsWithProfiles.map((o: any) => ({
          ...o,
          is_liked: likedOutfitIds.has(o.id),
        }));
      }

      setTrendingOutfits(outfitsWithProfiles);

      if (outfitsWithProfiles.length > 0) {
        for (const outfit of outfitsWithProfiles) {
          await supabase.rpc('increment_trending_count', {
            p_outfit_id: outfit.id,
            p_user_id: outfit.user_id
          });
        }
      }
    } catch (error: any) {
      toast({
        title: t('community.loadFail'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (outfitId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: t('auth.loginRequired'),
        description: t('auth.loginToLike'),
        variant: "destructive",
      });
      return;
    }

    const outfit = trendingOutfits.find(o => o.id === outfitId);
    if (!outfit) return;

    const newIsLiked = !outfit.is_liked;
    const newLikesCount = newIsLiked ? outfit.likes_count + 1 : outfit.likes_count - 1;

    setTrendingOutfits(prev => prev.map(o =>
      o.id === outfitId
        ? { ...o, is_liked: newIsLiked, likes_count: newLikesCount }
        : o
    ));

    try {
      if (newIsLiked) {
        const { error: insertError } = await supabase
          .from('outfit_likes')
          .insert({ user_id: user.id, outfit_id: outfitId });
        if (insertError) throw insertError;

        await supabase.rpc('increment_outfit_likes', { outfit_id: outfitId });
      } else {
        const { error: deleteError } = await supabase
          .from('outfit_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('outfit_id', outfitId);
        if (deleteError) throw deleteError;

        await supabase.rpc('decrement_outfit_likes', { outfit_id: outfitId });
      }
    } catch (error: any) {
      setTrendingOutfits(prev => prev.map(o =>
        o.id === outfitId
          ? { ...o, is_liked: !newIsLiked, likes_count: outfit.likes_count }
          : o
      ));
      toast({
        title: t('community.operationFailed'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenDetail = (outfit: TrendingOutfit) => {
    setSelectedOutfit(outfit);
    setDetailOpen(true);
  };

  const handleLikeChange = (outfitId: string, isLiked: boolean) => {
    setTrendingOutfits(prev => prev.map(o =>
      o.id === outfitId
        ? { ...o, is_liked: isLiked, likes_count: isLiked ? o.likes_count + 1 : o.likes_count - 1 }
        : o
    ));
  };

  // Guide state - shares the same localStorage key with CommunityFeed
  const [showTryGuide, setShowTryGuide] = useState(false);

  useEffect(() => {
    try {
      const hasSeenGuide = localStorage.getItem('rss_community_try_guide_shown');
      // Only show if data is loaded and there are items
      if (!hasSeenGuide && !loading && trendingOutfits.length > 0) {
        // Small delay to ensure render
        const timer = setTimeout(() => {
          setShowTryGuide(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error('LocalStorage error:', e);
    }
  }, [loading, trendingOutfits.length]);

  const handleTryClick = (outfit: TrendingOutfit) => {
    if (showTryGuide) {
      setShowTryGuide(false);
      try {
        localStorage.setItem('rss_community_try_guide_shown', 'true');
      } catch (e) {
        console.error('LocalStorage error:', e);
      }
    }
    setTryOnConfirmDialog({ open: true, outfit });
  };

  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trendingOutfits.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 relative">
      {/* Section Header with Gradient Line */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <div className="flex flex-col items-center">
          <Badge variant="outline" className="mb-2 border-primary/20 text-primary bg-primary/5 uppercase tracking-widest text-[10px]">
            Weekly Top 3
          </Badge>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-playfair font-bold text-foreground">
              {t('community.trendingWeek')}
            </h2>
          </div>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trendingOutfits.map((outfit, index) => (
          <div key={outfit.id} className="group relative">
            {/* Rank Badge - Abstract Shape */}
            <div className="absolute -top-3 -left-3 z-20 w-12 h-12 flex items-center justify-center font-playfair font-bold text-xl text-white">
              <div className={`absolute inset-0 transform rotate-12 rounded-xl shadow-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-slate-500' :
                    'bg-gradient-to-br from-amber-700 to-amber-900'
                }`}></div>
              <span className="relative z-10 text-shadow-sm">#{index + 1}</span>
            </div>

            <Card className="overflow-hidden border-0 bg-card/50 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
              <div
                className="relative cursor-pointer aspect-[3/4] overflow-hidden"
                onClick={() => handleOpenDetail(outfit)}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10" />
                <img
                  src={outfit.image_url}
                  alt={outfit.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.src = '/placeholder.svg';
                  }}
                />

                {/* Overlay Info (Visible on hover on desktop, always on mobile) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-100 transition-opacity z-10">
                  <h3 className="font-playfair font-bold text-white text-lg line-clamp-1 mb-1 shadow-black/50 drop-shadow-md">
                    {outfit.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/90">
                      <Avatar className="h-5 w-5 border border-white/20">
                        <AvatarImage src={outfit.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {outfit.profiles?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-white/90 truncate max-w-[80px]">
                        {outfit.profiles?.name || t('community.anonymousUser')}
                      </span>
                    </div>
                    <div className="flex gap-3 text-white/90">
                      <div className="flex items-center gap-1">
                        <Heart className={`h-3.5 w-3.5 ${outfit.is_liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        <span className="text-xs font-medium">{outfit.likes_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <OutfitDetailDialog
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        outfit={selectedOutfit}
        isLiked={selectedOutfit?.is_liked}
        onLikeChange={handleLikeChange}
      />

      <AlertDialog open={tryOnConfirmDialog.open} onOpenChange={(open) => setTryOnConfirmDialog({ ...tryOnConfirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('community.tryOnConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('community.tryOnConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('community.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (tryOnConfirmDialog.outfit) {
                try {
                  await supabase.rpc('increment_outfit_tries', { outfit_id: tryOnConfirmDialog.outfit.id });
                } catch (error) {
                  console.error('Error incrementing try count:', error);
                }
                navigate('/better-than-model', {
                  state: {
                    preloadedClothingImage: tryOnConfirmDialog.outfit.image_url
                  }
                });
              }
              setTryOnConfirmDialog({ open: false, outfit: null });
            }}>
              {t('community.yes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrendingPosts;