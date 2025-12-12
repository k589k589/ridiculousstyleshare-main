import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, MessageCircle, UserPlus, Check, Trash2, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'reply' | 'vip_upgrade';
  outfit_id: string | null;
  comment_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
  actor: {
    name: string;
    avatar_url: string | null;
  };
  outfit?: {
    title: string;
    image_url: string;
  };
}

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationCenter = ({ open, onOpenChange }: NotificationCenterProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchNotifications();
    }
  }, [open, user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          fetchNotifications();
          toast({
            title: '新通知',
            description: '您有新的通知',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (notificationsData && notificationsData.length > 0) {
        // Get actor profiles
        const actorIds = [...new Set(notificationsData.map(n => n.actor_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', actorIds);

        // Get outfit data for outfit-related notifications
        const outfitIds = notificationsData
          .filter(n => n.outfit_id)
          .map(n => n.outfit_id!);

        let outfitsMap = new Map();
        if (outfitIds.length > 0) {
          const { data: outfits } = await supabase
            .from('outfits')
            .select('id, title, image_url')
            .in('id', outfitIds);
          outfitsMap = new Map(outfits?.map(o => [o.id, o]) || []);
        }

        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const enrichedNotifications = notificationsData.map(notification => ({
          ...notification,
          actor: profilesMap.get(notification.actor_id) || { name: '未知用戶', avatar_url: null },
          outfit: notification.outfit_id ? outfitsMap.get(notification.outfit_id) : undefined,
        }));

        setNotifications(enrichedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast({
        title: '載入失敗',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      toast({
        title: '已全部標記為已讀',
      });
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      toast({
        title: '操作失敗',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      toast({
        title: '已刪除通知',
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast({
        title: '刪除失敗',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.outfit_id) {
          navigate('/community');
          onOpenChange(false);
        }
        break;
      case 'follow':
        navigate('/profile');
        onOpenChange(false);
        break;
      case 'vip_upgrade':
        // Just close the notification center for VIP upgrades
        onOpenChange(false);
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'vip_upgrade':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor.name;

    switch (notification.type) {
      case 'like':
        return `${actorName} 讚了您的貼文`;
      case 'comment':
        return `${actorName} 評論了您的貼文`;
      case 'follow':
        return `${actorName} 開始追蹤您`;
      case 'reply':
        return `${actorName} 回覆了您的評論`;
      case 'vip_upgrade':
        return 'VIP 會員升級通知';
      default:
        return '';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>通知中心</span>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            查看您的所有通知
          </SheetDescription>
        </SheetHeader>

        {notifications.length > 0 && unreadCount > 0 && (
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              <Check className="h-4 w-4 mr-2" />
              全部標記為已讀
            </Button>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-200px)] mt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              載入中...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              目前沒有通知
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg cursor-pointer hover:bg-accent transition-colors ${!notification.is_read ? 'bg-accent/50' : ''
                    }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={notification.actor.avatar_url || undefined} />
                      <AvatarFallback>
                        {notification.actor.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getNotificationIcon(notification.type)}
                          <p className="text-sm font-medium">
                            {getNotificationText(notification)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {notification.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                      )}

                      {notification.outfit && (
                        <div className="flex items-center gap-2 mt-2">
                          <img
                            src={notification.outfit.image_url}
                            alt={notification.outfit.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="text-sm text-muted-foreground">
                            {notification.outfit.title}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
