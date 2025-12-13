import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Flag,
  User,
  UserPlus,
  UserMinus,
  Sparkles,
  Shirt,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useBanCheck } from '@/hooks/useBanCheck';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { ReportDialog } from './ReportDialog';
import { ShareDialog } from './ShareDialog';
import OutfitDetailDialog from './OutfitDetailDialog';
import SearchResults from './SearchResults';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Outfit {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  style_tags: string[] | null;
  likes_count: number;
  comments_count: number;
  try_count?: number;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  } | null;
  is_liked?: boolean;
  is_following?: boolean;
  is_bookmarked?: boolean;
}

const CommunityFeed = () => {
  const navigate = useNavigate();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hotTags, setHotTags] = useState<string[]>([]);
  const [tryOnConfirmDialog, setTryOnConfirmDialog] = useState<{ open: boolean; outfit: Outfit | null }>({ open: false, outfit: null });
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'following'>('latest');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [detailDialog, setDetailDialog] = useState<{ isOpen: boolean; outfit: Outfit | null }>({
    isOpen: false,
    outfit: null
  });
  const [reportDialog, setReportDialog] = useState<{ isOpen: boolean; outfitId: string; outfitTitle: string }>({
    isOpen: false,
    outfitId: '',
    outfitTitle: ''
  });
  const [shareDialog, setShareDialog] = useState<{ isOpen: boolean; outfitId: string; outfitTitle: string; outfitImage: string }>({
    isOpen: false,
    outfitId: '',
    outfitTitle: '',
    outfitImage: ''
  });
  const { user } = useAuth();
  const { isBanned } = useBanCheck();
  const { t } = useLanguage();
  const { toast } = useToast();
  const observerTarget = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 20;

  // Instant search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleTagSelect = (tag: string) => {
    setFilterTag(tag);
    setSearchInput('');
  };

  useEffect(() => {
    // Reset and fetch when filters change
    setOutfits([]);
    setPage(0);
    setHasMore(true);
    fetchOutfits(0, true);
  }, [user, searchQuery, sortBy, filterTag]);



  useEffect(() => {
    // Fetch all unique tags for filter dropdown
    fetchAllTags();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreOutfits();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page]);

  const fetchAllTags = async () => {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('style_tags');

      if (error) throw error;

      const tagsSet = new Set<string>();
      data?.forEach((outfit: any) => {
        outfit.style_tags?.forEach((tag: string) => tagsSet.add(tag));
      });

      setAllTags(Array.from(tagsSet).sort());
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const loadMoreOutfits = async () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchOutfits(nextPage, false);
  };

  const fetchOutfits = async (currentPage: number = 0, reset: boolean = false) => {
    const isInitialLoad = currentPage === 0;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Build query
      let query = supabase
        .from('outfits')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply tag filter
      if (filterTag !== 'all') {
        query = query.contains('style_tags', [filterTag]);
      }

      // Apply sorting and following filter
      if (sortBy === 'following' && user) {
        const { data: followingData } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = followingData?.map(f => f.following_id) || [];
        if (followingIds.length === 0) {
          // User is not following anyone, return empty
          setOutfits([]);
          setHasMore(false);
          return;
        }
        query = query.in('user_id', followingIds).order('created_at', { ascending: false });
      } else if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('likes_count', { ascending: false });
      }

      // Apply pagination
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: outfitsData, error, count } = await query;

      if (error) throw error;

      // Check if there are more items
      const totalItems = count || 0;
      const loadedItems = (currentPage + 1) * ITEMS_PER_PAGE;
      setHasMore(loadedItems < totalItems);

      // Fetch related profiles without relying on FK relationship
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

      // If user is logged in, check which outfits they've liked and which users they follow
      if (user && outfitsWithProfiles.length > 0) {
        const outfitIds = outfitsWithProfiles.map((o: any) => o.id);
        const outfitUserIds = Array.from(new Set(outfitsWithProfiles.map((o: any) => o.user_id)));

        // Check likes
        const { data: likesData } = await supabase
          .from('outfit_likes')
          .select('outfit_id')
          .eq('user_id', user.id)
          .in('outfit_id', outfitIds);

        const likedOutfitIds = new Set(likesData?.map(like => like.outfit_id) || []);

        // Check follows
        const { data: followsData } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', outfitUserIds);

        const followingUserIds = new Set(followsData?.map(f => f.following_id) || []);

        // Check bookmarks
        const { data: bookmarksData } = await supabase
          .from('outfit_bookmarks')
          .select('outfit_id')
          .eq('user_id', user.id)
          .in('outfit_id', outfitIds);

        const bookmarkedOutfitIds = new Set(bookmarksData?.map(b => b.outfit_id) || []);

        const outfitsWithLikesAndFollows = outfitsWithProfiles.map((outfit: any) => ({
          ...outfit,
          is_liked: likedOutfitIds.has(outfit.id),
          is_following: followingUserIds.has(outfit.user_id),
          is_bookmarked: bookmarkedOutfitIds.has(outfit.id)
        }));

        // Append or replace outfits based on reset flag
        setOutfits(prev => reset ? outfitsWithLikesAndFollows : [...prev, ...outfitsWithLikesAndFollows]);
      } else {
        setOutfits(prev => reset ? outfitsWithProfiles : [...prev, ...outfitsWithProfiles]);
      }
    } catch (error: any) {
      toast({
        title: t('community.loadFail'),
        description: error.message,
        variant: "destructive",
      });
      setHasMore(false);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const handleLike = async (outfitId: string, isCurrentlyLiked: boolean) => {
    if (!user) {
      toast({
        title: t('community.loginRequired'),
        description: t('community.loginToLike'),
        variant: "destructive",
      });
      return;
    }

    if (isBanned) {
      toast({
        title: '帳號已封禁',
        description: '您的帳號已被封禁，無法進行此操作',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isCurrentlyLiked) {
        // Unlike
        await supabase
          .from('outfit_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('outfit_id', outfitId);

        await supabase.rpc('decrement_outfit_likes', { outfit_id: outfitId });
      } else {
        // Like
        await supabase
          .from('outfit_likes')
          .insert({ user_id: user.id, outfit_id: outfitId });

        await supabase.rpc('increment_outfit_likes', { outfit_id: outfitId });
      }

      // Optimistically update UI
      setOutfits(prevOutfits =>
        prevOutfits.map(outfit =>
          outfit.id === outfitId
            ? {
              ...outfit,
              is_liked: !isCurrentlyLiked,
              likes_count: isCurrentlyLiked ? outfit.likes_count - 1 : outfit.likes_count + 1
            }
            : outfit
        )
      );
    } catch (error: any) {
      toast({
        title: t('community.operationFail'),
        description: error.message,
        variant: "destructive",
      });
      // Revert on error
      setOutfits(prevOutfits =>
        prevOutfits.map(outfit =>
          outfit.id === outfitId
            ? {
              ...outfit,
              is_liked: isCurrentlyLiked,
              likes_count: isCurrentlyLiked ? outfit.likes_count + 1 : outfit.likes_count - 1
            }
            : outfit
        )
      );
    }
  };

  const handleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (!user) {
      toast({
        title: t('community.loginRequired'),
        description: '請先登入以追蹤用戶',
        variant: "destructive",
      });
      return;
    }

    if (isBanned) {
      toast({
        title: '帳號已封禁',
        description: '您的帳號已被封禁，無法進行此操作',
        variant: 'destructive',
      });
      return;
    }

    // Optimistically update UI immediately
    setFollowingUsers(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyFollowing) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });

    setOutfits(prevOutfits =>
      prevOutfits.map(outfit =>
        outfit.user_id === userId
          ? { ...outfit, is_following: !isCurrentlyFollowing }
          : outfit
      )
    );

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error: deleteError } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (deleteError) throw deleteError;

        await supabase.rpc('decrement_follower_count', { user_id: userId });
        await supabase.rpc('decrement_following_count', { user_id: user.id });

        toast({
          title: '已取消追蹤',
          description: '成功取消追蹤該用戶',
        });
      } else {
        // Follow
        const { error: insertError } = await supabase
          .from('user_follows')
          .insert({ follower_id: user.id, following_id: userId });

        if (insertError) throw insertError;

        await supabase.rpc('increment_follower_count', { user_id: userId });
        await supabase.rpc('increment_following_count', { user_id: user.id });

        toast({
          title: '追蹤成功',
          description: '您現在可以在「僅追蹤中」查看該用戶的貼文',
        });
      }
    } catch (error: any) {
      console.error('Follow error:', error);
      toast({
        title: '操作失敗',
        description: error.message || '追蹤操作失敗，請稍後再試',
        variant: "destructive",
      });

      // Revert on error
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (!isCurrentlyFollowing) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });

      setOutfits(prevOutfits =>
        prevOutfits.map(outfit =>
          outfit.user_id === userId
            ? { ...outfit, is_following: isCurrentlyFollowing }
            : outfit
        )
      );
    }
  };

  const handleOpenComments = (outfit: Outfit) => {
    setDetailDialog({ isOpen: true, outfit });
  };

  const handleCloseComments = () => {
    setDetailDialog({ isOpen: false, outfit: null });
  };

  const handleOpenReport = (outfitId: string, outfitTitle: string) => {
    if (!user) {
      toast({
        title: '需要登入',
        description: '請先登入以舉報內容',
        variant: 'destructive',
      });
      return;
    }

    if (isBanned) {
      toast({
        title: '帳號已封禁',
        description: '您的帳號已被封禁，無法進行此操作',
        variant: 'destructive',
      });
      return;
    }

    setReportDialog({ isOpen: true, outfitId, outfitTitle });
  };

  const handleOpenImageViewer = (outfit: Outfit) => {
    setDetailDialog({ isOpen: true, outfit });
  };

  const handleBookmark = async (outfitId: string, isCurrentlyBookmarked: boolean) => {
    if (!user) {
      toast({
        title: '需要登入',
        description: '請先登入以收藏貼文',
        variant: 'destructive',
      });
      return;
    }

    if (isBanned) {
      toast({
        title: '帳號已封禁',
        description: '您的帳號已被封禁，無法進行此操作',
        variant: 'destructive',
      });
      return;
    }

    // Optimistically update UI
    setOutfits(prevOutfits =>
      prevOutfits.map(outfit =>
        outfit.id === outfitId
          ? { ...outfit, is_bookmarked: !isCurrentlyBookmarked }
          : outfit
      )
    );

    try {
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('outfit_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('outfit_id', outfitId);

        if (error) throw error;

        toast({
          title: '已取消收藏',
          description: '已從您的收藏中移除',
        });
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('outfit_bookmarks')
          .insert({ user_id: user.id, outfit_id: outfitId });

        if (error) throw error;

        toast({
          title: '收藏成功',
          description: '已加入您的收藏',
        });
      }
    } catch (error: any) {
      console.error('Bookmark error:', error);
      toast({
        title: '操作失敗',
        description: error.message || '收藏操作失敗，請稍後再試',
        variant: 'destructive',
      });

      // Revert on error
      setOutfits(prevOutfits =>
        prevOutfits.map(outfit =>
          outfit.id === outfitId
            ? { ...outfit, is_bookmarked: isCurrentlyBookmarked }
            : outfit
        )
      );
    }
  };

  // Guide state
  const [showTryGuide, setShowTryGuide] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('rss_community_try_guide_shown');
    if (!hasSeenGuide && !loading && outfits.length > 0) {
      // Small delay to ensure render
      const timer = setTimeout(() => {
        setShowTryGuide(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, outfits.length]);

  const handleTryClick = (outfit: Outfit) => {
    if (showTryGuide) {
      setShowTryGuide(false);
      localStorage.setItem('rss_community_try_guide_shown', 'true');
    }
    setTryOnConfirmDialog({ open: true, outfit });
  };

  // ... (keep existing code)

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="bg-card rounded-lg p-6 shadow-md space-y-4" id="search-section">
        {/* ... (existing search section code) ... */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Simplified Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('search.searchPosts')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 text-foreground"
                maxLength={100}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Popular Tags - Quick Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground font-medium">熱門標籤:</span>
            {['街頭', '優雅', '休閒', '運動', '復古', '韓系'].map((tag) => (
              <Badge
                key={tag}
                variant={filterTag === tag ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setFilterTag(filterTag === tag ? 'all' : tag)}
              >
                #{tag}
              </Badge>
            ))}
            {filterTag !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterTag('all')}
                className="h-7 text-xs"
              >
                清除篩選
              </Button>
            )}
          </div>

          {/* Sort Options */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">排序:</span>
              <Select value={sortBy} onValueChange={(value: 'latest' | 'popular') => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">{t('community.latest')}</SelectItem>
                  <SelectItem value="popular">{t('community.popular')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            {!loading && outfits.length > 0 && (
              <span className="text-sm text-muted-foreground">
                找到 {outfits.length} 個結果
              </span>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || filterTag !== 'all') && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">{t('community.activeFilters')}:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                {t('search.search')}: {searchQuery}
                <button onClick={() => setSearchInput('')} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
            {filterTag !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {t('community.tag')}: #{filterTag}
                <button onClick={() => setFilterTag('all')} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Feed */}
      <>

        {outfits.length === 0 ? (
          <Card className="text-center p-8">
            <p className="text-muted-foreground">{t('community.noOutfitsMessage')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('community.firstOutfit')}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfits.map((outfit, index) => (
              <Card key={outfit.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <AspectRatio ratio={4 / 5}>
                    <img
                      src={outfit.image_url}
                      alt={`${outfit.title} 穿搭靈感`}
                      className="w-full h-full object-contain bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                      loading="lazy"
                      decoding="async"
                      onClick={() => handleOpenImageViewer(outfit)}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.src = '/placeholder.svg';
                      }}
                    />
                  </AspectRatio>
                </div>

                <CardContent className="p-4">
                  {/* User Info */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/user/${outfit.user_id}`)}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={outfit.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {outfit.profiles?.name || t('community.anonymousUser')}
                      </span>
                    </div>

                    {/* Follow Button - Always visible for other users' posts */}
                    {user && user.id !== outfit.user_id && (
                      <Button
                        variant={outfit.is_following ? "secondary" : "default"}
                        size="sm"
                        className="h-8 px-4 text-xs flex-shrink-0 font-semibold min-w-[70px]"
                        onClick={() => handleFollow(outfit.user_id, outfit.is_following || false)}
                      >
                        {outfit.is_following ? '✓ 已追蹤' : '+ 追蹤'}
                      </Button>
                    )}
                  </div>

                  {/* Title and Description */}
                  <h3 className="font-semibold mb-2 line-clamp-2">
                    {outfit.title}
                  </h3>
                  {outfit.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {outfit.description}
                    </p>
                  )}

                  {/* Tags */}
                  {outfit.style_tags && outfit.style_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {outfit.style_tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {outfit.style_tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{outfit.style_tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 p-0 h-auto"
                        onClick={() => handleLike(outfit.id, outfit.is_liked || false)}
                      >
                        <Heart
                          className={`h-4 w-4 ${outfit.is_liked ? 'fill-red-500 text-red-500' : ''
                            }`}
                        />
                        <span className="text-sm">{outfit.likes_count}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 p-0 h-auto"
                        onClick={() => handleOpenComments(outfit)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{outfit.comments_count || 0}</span>
                      </Button>

                      {(() => {
                        const count = outfit.try_count || 0;
                        // Heatmap colors
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
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r ${bgColor} border ${borderColor} transition-all duration-300`}>
                            <Shirt className={`h-4 w-4 ${textColor}`} />
                            <span className={`text-sm font-medium ${textColor}`}>{count}</span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex items-center gap-1 px-4 py-1 border-2 font-semibold transition-all duration-200 ${showTryGuide && index === 0
                            ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,107,53,0.5)] z-20 relative animate-bounce'
                            : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                            }`}
                          onClick={() => handleTryClick(outfit)}
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
                        {showTryGuide && index === 0 && (
                          <div className="fixed inset-0 bg-black/10 z-10 pointer-events-none" />
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 p-0 h-auto"
                        onClick={() => handleBookmark(outfit.id, outfit.is_bookmarked || false)}
                        title={outfit.is_bookmarked ? t('community.unbookmarkTooltip') : t('community.bookmarkTooltip')}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${outfit.is_bookmarked ? 'fill-primary text-primary' : ''
                            }`}
                        />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 p-0 h-auto"
                        onClick={() => handleOpenReport(outfit.id, outfit.title)}
                        title={t('community.reportTooltip')}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 p-0 h-auto"
                        onClick={() => setShareDialog({
                          isOpen: true,
                          outfitId: outfit.id,
                          outfitTitle: outfit.title,
                          outfitImage: outfit.image_url
                        })}
                        title={t('community.shareTooltip')}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Infinite Scroll Observer Target */}
        {hasMore && !loading && (
          <div ref={observerTarget} className="flex justify-center py-8">
            {loadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>{t('community.loadMore')}</span>
              </div>
            )}
          </div>
        )}

        {/* End of Results */}
        {!hasMore && outfits.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('community.noMoreContent')}</p>
          </div>
        )}
      </>

      {/* Outfit Detail Dialog */}
      <OutfitDetailDialog
        isOpen={detailDialog.isOpen}
        onClose={handleCloseComments}
        outfit={detailDialog.outfit}
        isLiked={detailDialog.outfit?.is_liked}
        onLikeChange={(outfitId, isLiked) => {
          setOutfits(prev => prev.map(o =>
            o.id === outfitId
              ? { ...o, is_liked: isLiked, likes_count: isLiked ? o.likes_count + 1 : o.likes_count - 1 }
              : o
          ));
        }}
      />

      <ReportDialog
        open={reportDialog.isOpen}
        onOpenChange={(open) => setReportDialog({ ...reportDialog, isOpen: open })}
        outfitId={reportDialog.outfitId}
        outfitTitle={reportDialog.outfitTitle}
      />

      <ShareDialog
        open={shareDialog.isOpen}
        onOpenChange={(open) => setShareDialog({ ...shareDialog, isOpen: open })}
        outfitId={shareDialog.outfitId}
        outfitTitle={shareDialog.outfitTitle}
        outfitImage={shareDialog.outfitImage}
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
    </div>
  );
};

export default CommunityFeed;