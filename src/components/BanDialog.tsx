import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Ban } from 'lucide-react';

interface BanDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBanComplete: () => void;
}

export const BanDialog = ({ userId, userName, open, onOpenChange, onBanComplete }: BanDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary');
  const [reason, setReason] = useState('');
  const [banDays, setBanDays] = useState('7');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: '未登入',
        description: '請先登入',
        variant: 'destructive',
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: '請填寫封禁原因',
        variant: 'destructive',
      });
      return;
    }

    if (banType === 'temporary' && (!banDays || parseInt(banDays) <= 0)) {
      toast({
        title: '請輸入有效的封禁天數',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const banUntil = banType === 'temporary'
        ? new Date(Date.now() + parseInt(banDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase.from('user_bans').insert({
        user_id: userId,
        banned_by: user.id,
        reason: reason.trim(),
        ban_type: banType,
        ban_until: banUntil,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: '封禁成功',
        description: `已成功封禁用戶 ${userName}`,
      });

      setReason('');
      setBanDays('7');
      setBanType('temporary');
      onOpenChange(false);
      onBanComplete();
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast({
        title: '封禁失敗',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            封禁用戶
          </DialogTitle>
          <DialogDescription>
            您正在封禁用戶：<span className="font-semibold">{userName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">封禁類型</Label>
            <RadioGroup value={banType} onValueChange={(value) => setBanType(value as 'temporary' | 'permanent')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="temporary" id="temporary" />
                <Label htmlFor="temporary" className="cursor-pointer">臨時封禁</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="permanent" id="permanent" />
                <Label htmlFor="permanent" className="cursor-pointer">永久封禁</Label>
              </div>
            </RadioGroup>
          </div>

          {banType === 'temporary' && (
            <div>
              <Label htmlFor="banDays">封禁天數</Label>
              <Input
                id="banDays"
                type="number"
                min="1"
                value={banDays}
                onChange={(e) => setBanDays(e.target.value)}
                placeholder="輸入封禁天數"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="reason">封禁原因 *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="請詳細說明封禁原因..."
              className="mt-1"
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? '處理中...' : '確認封禁'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
