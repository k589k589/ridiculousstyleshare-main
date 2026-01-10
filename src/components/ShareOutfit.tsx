import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { X, Tag, Camera, ChevronLeft, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNativeCamera } from '@/hooks/useNativeCamera';
import { Link, useNavigate } from 'react-router-dom';

interface ShareOutfitProps {
  onSuccess?: () => void;
}

const ShareOutfit = ({ onSuccess }: ShareOutfitProps) => {
  const [step, setStep] = useState<'capture' | 'details'>('capture');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { takePicture, isLoading: cameraLoading, isNative } = useNativeCamera();
  const navigate = useNavigate();

  const handleTakePicture = async () => {
    const imageDataUrl = await takePicture();
    if (imageDataUrl) {
      setImagePreview(imageDataUrl);
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setImage(file);
      // Auto-advance to details step after capture
      setStep('details');
    }
  };

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !image) return;

    setLoading(true);
    try {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('outfit-images')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('outfit-images')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('outfits')
        .insert({
          user_id: user.id,
          title: title || (language === 'zh' ? '我的穿搭' : 'My Outfit'),
          description,
          image_url: urlData.publicUrl,
          style_tags: tags,
        });

      if (insertError) throw insertError;

      toast({
        title: t('community.shareSuccess'),
        description: t('community.shareSuccessDesc'),
      });

      // Clear state
      setTitle('');
      setDescription('');
      setTags([]);
      setImage(null);
      setImagePreview(null);
      setStep('capture');

      if (onSuccess) onSuccess();
      navigate('/community');
    } catch (error: any) {
      toast({
        title: t('community.shareFail'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Not logged in state
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">{t('community.loginRequired')}</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {language === 'zh' ? '加入時尚社群，分享你的穿搭' : 'Join our fashion community and share your style'}
          </p>
        </div>
        <Link to="/auth">
          <Button className="rounded-full px-10 py-6 text-lg bg-[#FF6B35] hover:bg-[#FF5520]">
            {language === 'zh' ? '登入加入社群' : 'Login to join the community'}
          </Button>
        </Link>
      </div>
    );
  }

  // Step 1: Capture Photo (Instagram-style full screen camera trigger)
  if (step === 'capture') {
    // Use fixed inset-0 to ensure full screen coverage over any layout bounds
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black text-white overflow-hidden">
        {/* Top Header with Close Button */}
        <div className="absolute top-0 left-0 p-4 z-50 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <Link to="/community">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-12 w-12">
              <X className="w-8 h-8" />
            </Button>
          </Link>
        </div>

        {/* Main Camera Area - Full height center alignment */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {imagePreview ? (
            // Preview captured photo
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full max-h-[85vh] object-contain"
              />
              <button
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-20 right-4 p-2 bg-black/50 rounded-full backdrop-blur-sm z-20"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          ) : (
            // Camera trigger UI without the box
            <div className="flex flex-col items-center space-y-12 translate-y-[-10%]">
              <p className="text-neutral-400 text-xl font-light tracking-wide text-center max-w-xs drop-shadow-md px-4">
                {language === 'zh'
                  ? '今天想分享什麼？'
                  : 'What do you want to share today?'}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions Area */}
        <div className="flex justify-center bg-transparent z-10 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
          {imagePreview ? (
            <Button
              onClick={() => setStep('details')}
              className="rounded-full px-8 py-6 text-lg bg-white text-black hover:bg-gray-200 font-medium tracking-wide shadow-lg transform transition-transform active:scale-95"
            >
              <Check className="w-5 h-5 mr-2" />
              {language === 'zh' ? '下一步' : 'Next'}
            </Button>
          ) : (
            <button
              onClick={handleTakePicture}
              disabled={cameraLoading}
              className="group relative flex items-center justify-center"
            >
              {/* Outer ring */}
              <div className="w-24 h-24 rounded-full border-[6px] border-white/30 transition-all duration-300 group-hover:border-white/50 group-active:scale-95"></div>
              {/* Inner circle */}
              <div className="absolute w-20 h-20 rounded-full bg-white transition-all duration-300 group-active:scale-90 shadow-[0_0_20px_rgba(255,255,255,0.3)]"></div>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Add Details (simplified Instagram-style)
  return (
    <div className="min-h-screen px-4 pb-32 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between py-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <button onClick={() => setStep('capture')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold tracking-wide">
          {language === 'zh' ? '新增描述' : 'Add Details'}
        </h1>
        <div className="w-10"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {/* Photo Preview - Thumbnail */}
        {imagePreview && (
          <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title Input */}
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={language === 'zh' ? '標題（選填）' : 'Title (optional)'}
            className="h-12 rounded-xl border-gray-200 text-base bg-transparent focus:ring-1 focus:ring-black"
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={language === 'zh' ? '說點什麼...' : 'Write something...'}
            rows={3}
            className="rounded-xl border-gray-200 resize-none text-base bg-transparent focus:ring-1 focus:ring-black px-4 py-3"
          />
        </div>

        {/* Tags Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder={language === 'zh' ? '添加標籤' : 'Add tag'}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="h-10 rounded-xl border-gray-200 pl-9 text-sm focus:ring-1 focus:ring-black"
              />
            </div>
            <Button
              type="button"
              onClick={addTag}
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 rounded-xl flex items-center justify-center shrink-0"
            >
              +
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-100 hover:bg-gray-200 transition-colors font-normal"
                >
                  #{tag}
                  <X
                    className="h-3 w-3 ml-2 cursor-pointer opacity-50 hover:opacity-100"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-8 left-4 right-4 pb-[env(safe-area-inset-bottom)]">
          <Button
            type="submit"
            className="w-full h-14 rounded-full text-lg font-medium bg-black hover:bg-gray-800 shadow-xl transition-all"
            disabled={loading}
          >
            {loading
              ? (language === 'zh' ? '發布中...' : 'Publishing...')
              : (language === 'zh' ? '發布' : 'Publish')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ShareOutfit;