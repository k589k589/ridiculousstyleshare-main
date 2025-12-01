import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

interface StartConversationButtonProps {
  otherUserId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const StartConversationButton: React.FC<StartConversationButtonProps> = ({ 
  otherUserId, 
  variant = 'outline',
  size = 'default',
  className = ''
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const startConversation = async () => {
    if (!user) {
      toast.error(t('toast.pleaseLogin'));
      navigate('/auth');
      return;
    }

    if (user.id === otherUserId) {
      toast.error(t('toast.cannotMessageSelf'));
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existingParticipants, error: searchError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (searchError) throw searchError;

      // For each conversation user is in, check if the other user is also in it
      let existingConversationId = null;
      
      if (existingParticipants && existingParticipants.length > 0) {
        for (const participant of existingParticipants) {
          const { data: otherUserInConv, error: checkError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', participant.conversation_id)
            .eq('user_id', otherUserId)
            .single();

          if (!checkError && otherUserInConv) {
            existingConversationId = participant.conversation_id;
            break;
          }
        }
      }

      if (existingConversationId) {
        // Navigate to existing conversation
        navigate('/messages');
        return;
      }

      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Add both users as participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: user.id },
          { conversation_id: newConversation.id, user_id: otherUserId }
        ]);

      if (participantsError) throw participantsError;

      toast.success(t('toast.conversationCreated'));
      navigate('/messages');
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error(t('toast.conversationCreateError'));
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={startConversation}
      className={className}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {t('community.share')}
    </Button>
  );
};

export default StartConversationButton;
