import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: '垃圾訊息或廣告' },
  { value: 'harassment', label: '騷擾或霸凌' },
  { value: 'inappropriate', label: '不當內容' },
  { value: 'impersonation', label: '冒充他人' },
  { value: 'other', label: '其他' },
];

export const ReportUserDialog = ({ open, onOpenChange, userId, userName }: ReportUserDialogProps) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast({
        title: '請選擇檢舉原因',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: '請先登入',
          variant: 'destructive',
        });
        return;
      }

      // Since there's no user_reports table, we'll use outfit_reports with a null outfit_id
      // Or you could create a new table for user reports
      const { error } = await supabase
        .from('outfit_reports')
        .insert({
          outfit_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID for user reports
          reporter_id: user.id,
          reason: `USER_REPORT: ${reason}`,
          description: `檢舉用戶: ${userName} (${userId})\n原因: ${REPORT_REASONS.find(r => r.value === reason)?.label}\n詳細說明: ${description || '無'}`,
        });

      if (error) throw error;

      toast({
        title: '檢舉已提交',
        description: '感謝您的回報，我們將會盡快處理',
      });

      onOpenChange(false);
      setReason('');
      setDescription('');
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast({
        title: '提交失敗',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>檢舉用戶</DialogTitle>
          <DialogDescription>
            檢舉用戶：{userName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>請選擇檢舉原因</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={`user-${r.value}`} />
                  <Label htmlFor={`user-${r.value}`} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-description">詳細說明（選填）</Label>
            <Textarea
              id="user-description"
              placeholder="請提供更多資訊協助我們了解問題..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={!reason || isSubmitting}>
              {isSubmitting ? '提交中...' : '提交檢舉'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
