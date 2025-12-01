import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Auth from '@/components/Auth';
import { useLanguage } from '@/hooks/useLanguage';

interface Conversation {
  id: string;
  updated_at: string;
  other_user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  last_message: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface Profile {
  user_id: string;
  name: string;
  avatar_url: string | null;
}

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation && user) {
      fetchMessages(selectedConversation);
      markMessagesAsRead(selectedConversation);
      
      // Subscribe to new messages
      const channel = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation}`
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all conversations user is part of
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const conversationIds = participantData.map(p => p.conversation_id);
      
      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get conversation details
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Get other participants for each conversation
      const conversationsWithDetails = await Promise.all(
        convData.map(async (conv) => {
          // Get other user in conversation
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id)
            .single();

          if (!otherParticipant) return null;

          // Get other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, name, avatar_url')
            .eq('user_id', otherParticipant.user_id)
            .single();

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            id: conv.id,
            updated_at: conv.updated_at,
            other_user: profile || { id: otherParticipant.user_id, name: 'Unknown', avatar_url: null },
            last_message: lastMsg?.content || null,
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithDetails.filter(Boolean) as Conversation[]);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error(t('toast.conversationsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Fetch profiles for all unique senders
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const profilePromises = senderIds.map(id =>
        supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .eq('user_id', id)
          .single()
      );

      const profileResults = await Promise.all(profilePromises);
      const profileMap: Record<string, Profile> = {};
      profileResults.forEach(result => {
        if (result.data) {
          profileMap[result.data.user_id] = result.data;
        }
      });
      setProfiles(profileMap);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('toast.messageSendError'));
    }
  };

  if (!user) {
    return <Auth />;
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <Card className={`md:col-span-1 ${selectedConversation ? 'hidden md:block' : ''}`}>
            <CardContent className="p-0">
              <div className="p-6 border-b border-border/50">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" />
                  訊息
                </h2>
              </div>
              <ScrollArea className="h-[calc(100vh-14rem)]">
                {loading ? (
                  <div className="p-6 text-center text-muted-foreground">載入中...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-12 text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">還沒有對話</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full p-4 hover:bg-accent/50 transition-colors text-left ${
                          selectedConversation === conv.id ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={conv.other_user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {conv.other_user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold truncate">{conv.other_user.name}</h3>
                              {conv.unread_count > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                            {conv.last_message && (
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.last_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className={`md:col-span-2 ${!selectedConversation ? 'hidden md:block' : ''}`}>
            {selectedConversation && selectedConv ? (
              <CardContent className="p-0 flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-border/50 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConv.other_user.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedConv.other_user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{selectedConv.other_user.name}</h3>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user.id;
                      const sender = profiles[msg.sender_id];
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                        >
                          {!isOwn && (
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={sender?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {sender?.name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <span className={`text-xs mt-1 block ${
                              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {new Date(msg.created_at).toLocaleTimeString('zh-TW', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="輸入訊息..."
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            ) : (
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                  <p>選擇一個對話開始聊天</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
