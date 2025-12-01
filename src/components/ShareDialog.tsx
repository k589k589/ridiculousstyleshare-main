import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LineShareButton,
  FacebookIcon,
  XIcon,
  LineIcon
} from 'react-share';

interface ShareDialogProps {
  outfitId: string;
  outfitTitle?: string;
  outfitImage?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareDialog = ({ outfitId, outfitTitle, outfitImage, open, onOpenChange }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/community?outfit=${outfitId}`;
  const title = outfitTitle || '精彩穿搭分享';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "已複製連結",
        description: "分享連結已複製到剪貼簿",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "複製失敗",
        description: "無法複製連結",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `查看這個精彩的穿搭分享！`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享穿搭</DialogTitle>
          <DialogDescription>
            選擇分享方式
          </DialogDescription>
        </DialogHeader>

        {/* Social Share Buttons */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-3">分享到社交平台</p>
            <div className="flex gap-3 justify-center">
              <FacebookShareButton url={shareUrl} hashtag="#穿搭分享">
                <FacebookIcon size={48} round />
              </FacebookShareButton>
              
              <TwitterShareButton url={shareUrl} title={title}>
                <XIcon size={48} round />
              </TwitterShareButton>
              
              <LineShareButton url={shareUrl} title={title}>
                <LineIcon size={48} round />
              </LineShareButton>
            </div>
          </div>

          {/* Native Share (Mobile) */}
          {navigator.share && (
            <Button onClick={handleNativeShare} variant="outline" className="w-full">
              更多分享選項
            </Button>
          )}

          {/* Copy Link */}
          <div>
            <p className="text-sm font-medium mb-2">或複製連結</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
              />
              <Button onClick={handleCopy} size="icon" variant="secondary">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
