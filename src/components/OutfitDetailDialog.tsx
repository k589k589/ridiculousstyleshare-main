import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Send, User, MoreHorizontal, UserPlus, Bookmark, Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ReportDialog } from '@/components/ReportDialog';
import { ReportUserDialog } from '@/components/ReportUserDialog';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  } | null;
}

interface OutfitDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  outfit: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    image_url: string;
    style_tags: string[] | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    profiles: {
      name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  isLiked?: boolean;
  onLikeChange?: (outfitId: string, isLiked: boolean) => void;
}

const OutfitDetailDialog = ({ isOpen, onClose, outfit, isLiked: initialIsLiked, onLikeChange }: OutfitDetailDialogProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(initialIsLiked || false);
  const [likesCount, setLikesCount] = useState(outfit?.likes_count || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportUserDialogOpen, setReportUserDialogOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && outfit?.id) {
      fetchComments();
      checkLikeStatus();
      checkFollowStatus();
      checkBookmarkStatus();
    }
  }, [isOpen, outfit?.id]);

  useEffect(() => {
    setIsLiked(initialIsLiked || false);
    setLikesCount(outfit?.likes_count || 0);
  }, [initialIsLiked, outfit?.likes_count]);

  const checkLikeStatus = async () => {
    if (!user || !outfit) return;
    
    try {
      const { data, error } = await supabase
        .from('outfit_likes')
        .select('id')
        .eq('outfit_id', outfit.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsLiked(!!data);
    } catch (error: any) {
      console.error('Error checking like status:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !outfit) return;
    
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', outfit.user_id)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error: any) {
      console.error('Error checking follow status:', error);
    }
  };

  const checkBookmarkStatus = async () => {
    if (!user || !outfit) return;
    
    try {
      const { data, error } = await supabase
        .from('outfit_bookmarks')
        .select('id')
        .eq('outfit_id', outfit.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsBookmarked(!!data);
    } catch (error: any) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const fetchComments = async () => {
    if (!outfit) return;
    
    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('outfit_comments')
        .select('*')
        .eq('outfit_id', outfit.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      let commentsWithProfiles: Comment[] = [];
      if (commentsData && commentsData.length > 0) {
        const userIds = Array.from(new Set(commentsData.map((c: any) => c.user_id)));
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id,name,avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, { name: p.name, avatar_url: p.avatar_url }]));
        commentsWithProfiles = commentsData.map((c: any) => ({
          ...c,
          profiles: profileMap.get(c.user_id) || null,
        }));
      }

      setComments(commentsWithProfiles);
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

  const handleLike = async () => {
    if (!user) {
      toast({
        title: t('auth.loginRequired'),
        description: t('auth.loginToLike'),
        variant: "destructive",
      });
      return;
    }

    if (!outfit) return;

    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
    
    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);
    
    if (onLikeChange) {
      onLikeChange(outfit.id, newIsLiked);
    }

    try {
      if (newIsLiked) {
        const { error: insertError } = await supabase
          .from('outfit_likes')
          .insert({ user_id: user.id, outfit_id: outfit.id });
        if (insertError) throw insertError;

        await supabase.rpc('increment_outfit_likes', { outfit_id: outfit.id });
      } else {
        const { error: deleteError } = await supabase
          .from('outfit_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('outfit_id', outfit.id);
        if (deleteError) throw deleteError;

        await supabase.rpc('decrement_outfit_likes', { outfit_id: outfit.id });
      }
    } catch (error: any) {
      setIsLiked(!newIsLiked);
      setLikesCount(likesCount);
      toast({
        title: t('community.operationFailed'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: t('auth.loginRequired'),
        description: t('community.loginToComment'),
        variant: "destructive",
      });
      return;
    }

    if (!outfit || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data: insertedComment, error: insertError } = await supabase
        .from('outfit_comments')
        .insert({
          user_id: user.id,
          outfit_id: outfit.id,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await supabase.rpc('increment_outfit_comments', { outfit_id: outfit.id });

      setNewComment('');
      await fetchComments();
      
      toast({
        title: t('community.commentSuccess'),
      });
    } catch (error: any) {
      console.error('Comment error:', error);
      toast({
        title: t('community.commentFailed'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('outfit_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      if (outfit) {
        await supabase.rpc('decrement_outfit_comments', { outfit_id: outfit.id });
      }

      await fetchComments();
      
      toast({
        title: t('community.deleteSuccess') || '刪除成功',
      });
    } catch (error: any) {
      console.error('Delete comment error:', error);
      toast({
        title: t('community.deleteFailed') || '刪除失敗',
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUserClick = (userId: string) => {
    onClose();
    navigate(`/user/${userId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFollow = async () => {
    if (!user || !outfit) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', outfit.user_id);

        if (error) throw error;
        setIsFollowing(false);
        toast({ title: '已取消追蹤' });
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: outfit.user_id,
          });

        if (error) throw error;
        setIsFollowing(true);
        toast({ title: '追蹤成功' });
      }
    } catch (error: any) {
      toast({
        title: '操作失敗',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBookmark = async () => {
    if (!user || !outfit) return;

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('outfit_bookmarks')
          .delete()
          .eq('outfit_id', outfit.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsBookmarked(false);
        toast({ title: '已取消收藏' });
      } else {
        const { error } = await supabase
          .from('outfit_bookmarks')
          .insert({
            outfit_id: outfit.id,
            user_id: user.id,
          });

        if (error) throw error;
        setIsBookmarked(true);
        toast({ title: '收藏成功' });
      }
    } catch (error: any) {
      toast({
        title: '操作失敗',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!outfit) return null;

  const locale = t('lang') === 'zh' ? zhCN : enUS;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">{outfit.title}</DialogTitle>
        <DialogDescription className="sr-only">{outfit.description || 'Outfit details'}</DialogDescription>
        <div className="flex h-full overflow-hidden">
          {/* Left side - Image */}
          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
            <img
              src={outfit.image_url}
              alt={outfit.title}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Right side - Content and Comments */}
          <div className="w-96 flex flex-col bg-background overflow-hidden">
            {/* Header with user info */}
            <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleUserClick(outfit.user_id)}>
                <Avatar>
                  <AvatarImage src={outfit.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold">{outfit.profiles?.name || 'Unknown'}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user && outfit.user_id !== user.id && (
                    <DropdownMenuItem onClick={handleFollow}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {isFollowing ? '取消追蹤' : '追蹤帳號'}
                    </DropdownMenuItem>
                  )}
                  {user && (
                    <DropdownMenuItem onClick={handleBookmark}>
                      <Bookmark className="h-4 w-4 mr-2" />
                      {isBookmarked ? '取消收藏' : '收藏貼文'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                    <Flag className="h-4 w-4 mr-2" />
                    檢舉貼文
                  </DropdownMenuItem>
                  {user && outfit.user_id !== user.id && (
                    <DropdownMenuItem onClick={() => setReportUserDialogOpen(true)}>
                      <Flag className="h-4 w-4 mr-2" />
                      檢舉帳號
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Post content */}
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Post description */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">{outfit.title}</h3>
                  {outfit.description && (
                    <p className="text-sm text-foreground mb-3">{outfit.description}</p>
                  )}
                  {outfit.style_tags && outfit.style_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {outfit.style_tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(outfit.created_at), { addSuffix: true, locale })}
                  </p>
                </div>

                <Separator />

                {/* Comments section */}
                <div className="space-y-4 pb-4">
                  {loading ? (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      {t('community.loading')}
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      No comments
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 cursor-pointer" onClick={() => handleUserClick(comment.user_id)}>
                          <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-start gap-2">
                                <span 
                                  className="font-semibold text-sm cursor-pointer hover:underline"
                                  onClick={() => handleUserClick(comment.user_id)}
                                >
                                  {comment.profiles?.name || 'Unknown'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale })}
                                </span>
                              </div>
                              <p className="text-sm mt-1">{comment.content}</p>
                            </div>
                            {user && user.id === comment.user_id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Bottom section - Like and comment actions */}
            <div className="border-t bg-background flex-shrink-0">
              <div className="p-4 flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={handleLike}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{likesCount}</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>{comments.length}</span>
                </Button>
              </div>

              <Separator />

              {/* Comment input */}
              <div className="p-4 flex gap-2 bg-background">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Comment"
                  className="min-h-[60px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={submitting || !newComment.trim()}
                  size="icon"
                  className="shrink-0 self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Report dialogs */}
      {outfit && (
        <>
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            outfitId={outfit.id}
            outfitTitle={outfit.title}
          />
          <ReportUserDialog
            open={reportUserDialogOpen}
            onOpenChange={setReportUserDialogOpen}
            userId={outfit.user_id}
            userName={outfit.profiles?.name || 'Unknown'}
          />
        </>
      )}
    </Dialog>
  );
};

export default OutfitDetailDialog;
