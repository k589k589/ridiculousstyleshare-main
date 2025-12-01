import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, User, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

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

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfitId: string;
  outfitTitle: string;
}

const CommentModal = ({ isOpen, onClose, outfitId, outfitTitle }: CommentModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && outfitId) {
      fetchComments();
    }
  }, [isOpen, outfitId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      // Fetch comments for this outfit
      const { data: commentsData, error } = await supabase
        .from('outfit_comments')
        .select('*')
        .eq('outfit_id', outfitId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch related profiles
      let commentsWithProfiles = commentsData || [];
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

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: t('community.loginRequired'),
        description: t('community.loginToComment'),
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      // Insert the comment
      const { error: insertError } = await supabase
        .from('outfit_comments')
        .insert({
          user_id: user.id,
          outfit_id: outfitId,
          content: newComment.trim(),
        });

      if (insertError) throw insertError;

      // Increment comment count
      await supabase.rpc('increment_outfit_comments', { outfit_id: outfitId });

      // Clear the input
      setNewComment('');

      // Refresh comments
      await fetchComments();
    } catch (error: any) {
      toast({
        title: t('community.operationFail'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingContent.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('outfit_comments')
        .update({ content: editingContent.trim() })
        .eq('id', commentId);

      if (error) throw error;

      // Update local state
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, content: editingContent.trim() } : c
      ));

      setEditingCommentId(null);
      setEditingContent('');

      toast({
        title: '評論已更新',
      });
    } catch (error: any) {
      toast({
        title: t('community.operationFail'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('outfit_comments')
        .delete()
        .eq('id', commentToDelete);

      if (error) throw error;

      // Decrement comment count
      await supabase.rpc('decrement_outfit_comments', { outfit_id: outfitId });

      // Update local state
      setComments(comments.filter(c => c.id !== commentToDelete));

      toast({
        title: '評論已刪除',
      });
    } catch (error: any) {
      toast({
        title: t('community.operationFail'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t('community.comments')}
          </DialogTitle>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {outfitTitle}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comments List */}
          <ScrollArea className="max-h-80">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">還沒有留言，成為第一個留言的人吧！</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <div key={comment.id}>
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-sm truncate">
                              {comment.profiles?.name || t('community.anonymousUser')}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(comment.created_at).toLocaleDateString('zh-TW')}
                            </span>
                          </div>
                          
                          {/* Edit/Delete buttons for comment author */}
                          {user && user.id === comment.user_id && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {editingCommentId !== comment.id && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleStartEdit(comment)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteClick(comment.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2 pt-2">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(comment.id)}
                                disabled={submitting || !editingContent.trim()}
                              >
                                儲存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={submitting}
                              >
                                取消
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground break-words">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    </div>
                    {index < comments.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Comment Input */}
          <div className="space-y-3 pt-3 border-t">
            <Textarea
              placeholder={t('community.writeComment')}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? t('common.loading') : t('community.postComment')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除評論</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法撤銷。您確定要永久刪除此評論嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCommentToDelete(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default CommentModal;