import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import StartConversationButton from '@/components/StartConversationButton';
import {
  UserPlus,
  UserMinus,
  Settings,
  Grid,
  Bookmark,
  Heart,
  MessageCircle,
  ArrowLeft,
  Ban,
  Trash
} from 'lucide-react';

interface UserProfile {
  user_id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  trending_count: number;
}

interface Outfit {
  id: string;
  title: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [bookmarkedOutfits, setBookmarkedOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  const isOwnProfile = user?.id === userId;

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-user');

      if (error) throw error;

      await supabase.auth.signOut();
      toast({
        title: '帳號已刪除',
        description: '您的帳號已被永久刪除',
      });
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: '刪除失敗',
        description: error.message || '請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setDeleteAccountDialogOpen(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchOutfits();
      if (user && !isOwnProfile) {
        checkFollowStatus();
        checkBlockStatus();
      }
      if (isOwnProfile) {
        fetchBookmarkedOutfits();
      }
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: '載入失敗',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOutfits = async () => {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('id, title, image_url, likes_count, comments_count, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOutfits(data || []);
    } catch (error: any) {
      console.error('Error fetching outfits:', error);
    }
  };

  const fetchBookmarkedOutfits = async () => {
    if (!user) return;

    try {
      const { data: bookmarks, error } = await supabase
        .from('outfit_bookmarks')
        .select('outfit_id')
        .eq('user_id', user.id);

      if (error) throw error;

      if (bookmarks && bookmarks.length > 0) {
        const outfitIds = bookmarks.map(b => b.outfit_id);

        const { data: outfitsData, error: outfitsError } = await supabase
          .from('outfits')
          .select('id, title, image_url, likes_count, comments_count, created_at')
          .in('id', outfitIds)
          .order('created_at', { ascending: false });

        if (outfitsError) throw outfitsError;

        setBookmarkedOutfits(outfitsData || []);
      }
    } catch (error: any) {
      console.error('Error fetching bookmarked outfits:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !userId) return;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();

      if (error) throw error;

      setIsFollowing(!!data);
    } catch (error: any) {
      console.error('Error checking follow status:', error);
    }
  };

  const checkBlockStatus = async () => {
    if (!user || !userId) return;

    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .maybeSingle();

      if (error) throw error;

      setIsBlocked(!!data);
    } catch (error: any) {
      console.error('Error checking block status:', error);
    }
  };

  const handleBlockUser = async () => {
    if (!user || !userId) return;

    try {
      if (isBlocked) {
        // Unblock
        const { error } = await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', user.id)
          .eq('blocked_id', userId);

        if (error) throw error;

        setIsBlocked(false);
        toast({ title: t('toast.userUnblocked') });
      } else {
        // Block
        const { error } = await supabase
          .from('user_blocks')
          .insert({
            blocker_id: user.id,
            blocked_id: userId,
            reason: blockReason || null,
          });

        if (error) throw error;

        setIsBlocked(true);
        toast({ title: t('toast.userBlocked') });
      }
    } catch (error: any) {
      console.error('Error toggling block:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setBlockDialogOpen(false);
      setBlockReason('');
    }
  };

  const handleFollow = async () => {
    if (!user || !userId) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;

        setIsFollowing(false);
        setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count - 1 } : null);

        toast({
          title: '已取消追蹤',
        });
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
          });

        if (error) throw error;

        setIsFollowing(true);
        setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);

        toast({
          title: '追蹤成功',
        });
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast({
        title: '操作失敗',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <Skeleton className="h-48 w-full mb-8" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8 text-center">
        <p className="text-muted-foreground">找不到此用戶</p>
      </div>
    );
  }

  const renderOutfitGrid = (outfitsList: Outfit[]) => (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {outfitsList.length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          暫無貼文
        </div>
      ) : (
        outfitsList.map((outfit) => (
          <div
            key={outfit.id}
            className="relative aspect-square cursor-pointer group overflow-hidden bg-muted"
            onClick={() => navigate('/community')}
          >
            <img
              src={outfit.image_url}
              alt={outfit.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-4 text-white">
                <div className="flex items-center gap-1">
                  <Heart className="h-5 w-5" fill="white" />
                  <span className="font-semibold">{outfit.likes_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-5 w-5" fill="white" />
                  <span className="font-semibold">{outfit.comments_count}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        {/* Profile Header - Instagram Style */}
        <div className="border-b border-border pb-8 mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-8 md:gap-12">
              {/* Avatar - Left */}
              <div className="flex-shrink-0">
                <Avatar className="w-20 h-20 md:w-36 md:h-36 border-2 border-gray-200">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl md:text-4xl">
                    {profile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* User Info - Right */}
              <div className="flex-1 min-w-0">
                {/* Username and Actions */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-5">
                  <h1 className="text-xl md:text-2xl font-normal">{profile.name}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    {isOwnProfile ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/profile')}
                          className="rounded-md px-4 h-8 text-sm font-semibold"
                        >
                          編輯個人資料
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteAccountDialogOpen(true)}
                          className="rounded-md px-3 h-8 text-sm text-muted-foreground hover:text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          刪除帳號
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant={isFollowing ? 'outline' : 'default'}
                          size="sm"
                          onClick={handleFollow}
                          className="rounded-md px-4 h-8 text-sm font-semibold"
                        >
                          {isFollowing ? '取消追蹤' : '追蹤'}
                        </Button>
                        <StartConversationButton otherUserId={userId!} variant="outline" size="sm" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => isBlocked ? handleBlockUser() : setBlockDialogOpen(true)}
                          className={`rounded-md px-3 h-8 text-sm ${isBlocked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          {isBlocked ? t('userProfile.unblockUser') : t('userProfile.blockUser')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats - Instagram Style (Horizontal) */}
                <div className="flex gap-6 md:gap-10 mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold">{outfits.length}</span>
                    <span className="text-sm text-muted-foreground">貼文</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold">{profile.followers_count}</span>
                    <span className="text-sm text-muted-foreground">粉絲</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold">{profile.trending_count || 0}</span>
                    <span className="text-sm text-muted-foreground">最火穿搭</span>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              貼文
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="bookmarks" className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                收藏
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {renderOutfitGrid(outfits)}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="bookmarks" className="mt-6">
              {renderOutfitGrid(bookmarkedOutfits)}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Block User Confirmation Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {t('userProfile.confirmBlock')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t('userProfile.blockDescription')}</p>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('userProfile.blockReason')}</label>
                <Textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder={t('userProfile.blockReasonPlaceholder')}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {t('userProfile.blockUser')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {t('userProfile.deleteAccountTitle') || '刪除帳號'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('userProfile.deleteAccountDescription') || '確定要刪除您的帳號嗎？此操作無法復原，您的所有資料將會被永久刪除。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {t('userProfile.confirmDelete') || '確認刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserProfile;
