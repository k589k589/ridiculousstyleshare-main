import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
}

export const ImageViewerDialog = ({ open, onOpenChange, imageUrl, title }: ImageViewerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent">
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-background/80 hover:bg-background/90 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="w-full h-full flex items-center justify-center p-4">
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              loading="eager"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
