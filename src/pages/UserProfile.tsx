import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import StartConversationButton from '@/components/StartConversationButton';
import { 
  UserPlus, 
  UserMinus, 
  Settings, 
  Grid, 
  Bookmark,
  Heart,
  MessageCircle,
  ArrowLeft
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
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [bookmarkedOutfits, setBookmarkedOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchOutfits();
      if (user && !isOwnProfile) {
        checkFollowStatus();
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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {outfitsList.length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          暫無貼文
        </div>
      ) : (
        outfitsList.map((outfit) => (
          <Card
            key={outfit.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/community')}
          >
            <AspectRatio ratio={1}>
              <img
                src={outfit.image_url}
                alt={outfit.title}
                className="w-full h-full object-cover"
              />
            </AspectRatio>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm mb-2 line-clamp-1">{outfit.title}</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {outfit.likes_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {outfit.comments_count}
                </span>
              </div>
            </CardContent>
          </Card>
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

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
                  
                  {isOwnProfile ? (
                    <Button
                      variant="outline"
                      onClick={() => navigate('/profile')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      編輯個人資料
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant={isFollowing ? 'outline' : 'default'}
                        onClick={handleFollow}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            取消追蹤
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            追蹤
                          </>
                        )}
                      </Button>
                      <StartConversationButton otherUserId={userId!} variant="outline" />
                    </div>
                  )}
                </div>

                <div className="flex gap-6 mb-4">
                  <div className="text-center">
                    <p className="font-bold text-xl">{outfits.length}</p>
                    <p className="text-sm text-muted-foreground">貼文</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xl">{profile.followers_count}</p>
                    <p className="text-sm text-muted-foreground">追蹤者</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xl">{profile.following_count}</p>
                    <p className="text-sm text-muted-foreground">追蹤中</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xl">{profile.trending_count || 0}</p>
                    <p className="text-sm text-muted-foreground">最火穿搭</p>
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-muted-foreground">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
    </div>
  );
};

export default UserProfile;
