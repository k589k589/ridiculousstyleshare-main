import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outfitId: string;
  outfitTitle: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: '垃圾訊息或廣告' },
  { value: 'inappropriate', label: '不當內容' },
  { value: 'copyright', label: '侵犯版權' },
  { value: 'harassment', label: '騷擾或霸凌' },
  { value: 'misinformation', label: '虛假資訊' },
  { value: 'other', label: '其他原因' },
];

export const ReportDialog = ({ open, onOpenChange, outfitId, outfitTitle }: ReportDialogProps) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast({
        title: '請選擇原因',
        description: '請選擇舉報原因',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: '需要登入',
          description: '請先登入以舉報內容',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('outfit_reports')
        .insert({
          outfit_id: outfitId,
          reporter_id: user.id,
          reason,
          description: description.trim() || null,
        });

      if (error) throw error;

      toast({
        title: '舉報已提交',
        description: '感謝您的回報，我們會盡快審核此內容',
      });

      // Reset form
      setReason('');
      setDescription('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Report error:', error);
      toast({
        title: '舉報失敗',
        description: error.message || '提交失敗，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            舉報貼文
          </DialogTitle>
          <DialogDescription>
            舉報：{outfitTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>請選擇舉報原因 *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((item) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={item.value} id={item.value} />
                  <Label htmlFor={item.value} className="font-normal cursor-pointer">
                    {item.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">詳細說明（選填）</Label>
            <Textarea
              id="description"
              placeholder="請提供更多詳細資訊，幫助我們更快處理..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || !reason}
            >
              {isSubmitting ? '提交中...' : '提交舉報'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
