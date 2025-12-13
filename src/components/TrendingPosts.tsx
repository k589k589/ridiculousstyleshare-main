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
          // Temporarily disabled to debug crash
          // setShowTryGuide(true);
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
    <Card className="mb-8 bg-gradient-to-br from-primary/5 to-orange-400/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {t('community.trendingWeek')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('community.trendingWeekSubtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendingOutfits.map((outfit, index) => (
            <div key={outfit.id} className="relative">
              {/* Trending badge */}
              <Badge
                className="absolute top-2 right-2 z-10 bg-gradient-to-r from-primary to-orange-400 text-white border-0"
                variant="default"
              >
                #{index + 1}
              </Badge>

              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div
                  className="relative cursor-pointer group"
                  onClick={() => handleOpenDetail(outfit)}
                >
                  <AspectRatio ratio={4 / 5}>
                    <img
                      src={outfit.image_url}
                      alt={`${outfit.title} ${t('virtualTryOn.fashionItems')}`}
                      className="w-full h-full object-contain bg-muted transition-transform group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.src = '/placeholder.svg';
                      }}
                    />
                  </AspectRatio>
                </div>

                <CardContent className="p-3">
                  {/* User Info */}
                  <div
                    className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/user/${outfit.user_id}`);
                    }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={outfit.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">
                      {outfit.profiles?.name || t('community.anonymousUser')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                    {outfit.title}
                  </h3>

                  {/* Tags */}
                  {outfit.style_tags && outfit.style_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {outfit.style_tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {outfit.style_tags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          +{outfit.style_tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2"
                        onClick={(e) => handleLike(outfit.id, e)}
                      >
                        <Heart className={`h-3 w-3 ${outfit.is_liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                        <span className="text-xs">{outfit.likes_count}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(outfit);
                        }}
                      >
                        <MessageCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{outfit.comments_count || 0}</span>
                      </Button>
                      {(() => {
                        const count = outfit.try_count || 0;
                        let bgColor, textColor, borderColor;
                        if (count === 0) {
                          bgColor = 'from-blue-500/20 to-blue-400/10';
                          textColor = 'text-blue-400';
                          borderColor = 'border-blue-400/30';
                        } else if (count < 5) {
                          bgColor = 'from-cyan-500/20 to-cyan-400/10';
                          textColor = 'text-cyan-400';
                          borderColor = 'border-cyan-400/30';
                        } else if (count < 10) {
                          bgColor = 'from-green-500/20 to-green-400/10';
                          textColor = 'text-green-400';
                          borderColor = 'border-green-400/30';
                        } else if (count < 20) {
                          bgColor = 'from-yellow-500/20 to-yellow-400/10';
                          textColor = 'text-yellow-400';
                          borderColor = 'border-yellow-400/30';
                        } else if (count < 50) {
                          bgColor = 'from-orange-500/20 to-orange-400/10';
                          textColor = 'text-orange-400';
                          borderColor = 'border-orange-400/30';
                        } else {
                          bgColor = 'from-red-500/20 to-red-400/10';
                          textColor = 'text-red-400';
                          borderColor = 'border-red-400/30';
                        }
                        return (
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${bgColor} border ${borderColor}`}>
                            <Shirt className={`h-3 w-3 ${textColor}`} />
                            <span className={`text-xs font-medium ${textColor}`}>{count}</span>
                          </div>
                        );
                      })()}

                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-7 px-3 border-2 font-semibold text-xs transition-all duration-200 ${showTryGuide && index === 0
                            ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,107,53,0.5)] z-20 relative animate-bounce'
                            : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTryClick(outfit);
                          }}
                          title={t('community.tryTooltip')}
                        >
                          {t('community.try')}
                        </Button>

                        {/* Guide Tooltip */}
                        {showTryGuide && index === 0 && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-30 animate-in fade-in zoom-in duration-300">
                            {t('community.tryGuide')}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span>
                      {new Date(outfit.created_at).toLocaleDateString('zh-TW', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </CardContent>

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
                // Increment try count
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
    </Card>
  );
};

export default TrendingPosts;