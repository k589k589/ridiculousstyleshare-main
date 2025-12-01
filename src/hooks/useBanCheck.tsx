import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';

interface BanInfo {
  id: string;
  reason: string;
  ban_type: 'temporary' | 'permanent';
  ban_until: string | null;
  created_at: string;
}

export const useBanCheck = () => {
  const { user } = useAuth();
  const [isBanned, setIsBanned] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    checkBanStatus();
  }, [user]);

  const checkBanStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const now = new Date();
        const isCurrentlyBanned = 
          data.ban_type === 'permanent' || 
          (data.ban_type === 'temporary' && data.ban_until && new Date(data.ban_until) > now);

        if (isCurrentlyBanned) {
          setIsBanned(true);
          setBanInfo(data);
          
          const banMessage = data.ban_type === 'permanent'
            ? '您的帳號已被永久封禁'
            : `您的帳號已被暫時封禁至 ${new Date(data.ban_until!).toLocaleString('zh-TW')}`;

          toast({
            title: '帳號已封禁',
            description: `${banMessage}\n原因：${data.reason}`,
            variant: 'destructive',
            duration: 10000,
          });
        } else {
          setIsBanned(false);
          setBanInfo(null);
        }
      } else {
        setIsBanned(false);
        setBanInfo(null);
      }
    } catch (error: any) {
      console.error('Error checking ban status:', error);
    } finally {
      setLoading(false);
    }
  };

  return { isBanned, banInfo, loading, checkBanStatus };
};
