import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Upload, X, Tag, Camera, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNativeCamera } from '@/hooks/useNativeCamera';
import { Link, useNavigate } from 'react-router-dom';

interface ShareOutfitProps {
  onSuccess?: () => void;
}

const ShareOutfit = ({ onSuccess }: ShareOutfitProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { takePicture, pickFromGallery, isLoading: cameraLoading, isNative } = useNativeCamera();
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePicture = async () => {
    const imageDataUrl = await takePicture();
    if (imageDataUrl) {
      setImagePreview(imageDataUrl);
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setImage(file);
    }
  };

  const handlePickFromGallery = async () => {
    const imageDataUrl = await pickFromGallery();
    if (imageDataUrl) {
      setImagePreview(imageDataUrl);
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `gallery-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setImage(file);
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
          title,
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

      if (onSuccess) onSuccess();
      // Navigate back to community after success
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

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">{t('community.loginRequired')}</h2>
          <p className="text-muted-foreground">{t('community.loginToComment')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Link to="/community" className="text-gray-400 hover:text-black transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          {t('community.shareMyOutfit')}
        </h1>
        <p className="text-gray-500 pl-9">
          {t('community.shareDesc')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Image Upload (Hero Section) */}
        <div>
          <Label className="text-lg font-medium mb-4 block">{t('community.outfitPhoto')}</Label>
          <div className="bg-gray-50 rounded-[2rem] border border-gray-100 overflow-hidden shadow-inner min-h-[300px] flex items-center justify-center relative group transition-all hover:bg-gray-100/50">
            {imagePreview ? (
              <div className="relative w-full h-full min-h-[300px]">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover min-h-[300px]"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="rounded-full w-12 h-12 bg-white/90 hover:bg-white"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-6 w-6 text-black" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 p-8 w-full">
                <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {/* Native Camera Options */}
                  {isNative && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTakePicture}
                        disabled={cameraLoading}
                        className="w-full h-12 rounded-xl border-gray-200 hover:bg-white hover:shadow-sm text-base font-normal flex items-center justify-center gap-2"
                      >
                        <Camera className="h-5 w-5" />
                        {t('community.takePhoto') || '拍照'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePickFromGallery}
                        disabled={cameraLoading}
                        className="w-full h-12 rounded-xl border-gray-200 hover:bg-white hover:shadow-sm text-base font-normal flex items-center justify-center gap-2"
                      >
                        <ImageIcon className="h-5 w-5" />
                        {t('community.choosePhoto') || '選擇照片'}
                      </Button>
                    </>
                  )}

                  <Button
                    type="button"
                    variant={isNative ? "ghost" : "outline"}
                    onClick={() => document.getElementById('image')?.click()}
                    className={`w-full h-12 rounded-xl ${!isNative && 'border-gray-200 hover:bg-white hover:shadow-sm'} text-base font-normal`}
                  >
                    {isNative ? (t('community.browseFiles') || '瀏覽檔案') : (t('community.formUploadPhoto') || '上傳照片')}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">{t('community.formSupportFormat')}</p>
              </div>
            )}
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              required={!image}
            />
          </div>
        </div>

        {/* Step 2: Details */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-base font-medium">{t('community.formTitle')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('community.formTitlePlaceholder')}
              required
              className="h-12 rounded-xl border-gray-200 bg-transparent focus:ring-1 focus:ring-black focus:border-black transition-all text-base"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-medium">{t('community.formDescription')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('community.formDescriptionPlaceholder')}
              rows={4}
              className="rounded-xl border-gray-200 bg-transparent focus:ring-1 focus:ring-black focus:border-black transition-all resize-none text-base p-4"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">{t('community.formStyleTags')}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder={t('community.formAddStyleTag')}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="h-12 rounded-xl border-gray-200 bg-transparent focus:ring-1 focus:ring-black focus:border-black transition-all pl-10"
                />
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <Button
                type="button"
                onClick={addTag}
                variant="default"
                className="h-12 w-12 rounded-xl p-0 shrink-0 bg-black hover:bg-black/90"
              >
                <Tag className="h-5 w-5" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1.5 rounded-full text-sm font-normal bg-gray-100 hover:bg-gray-200 transition-colors">
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
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full h-14 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all"
            disabled={loading}
          >
            {loading ? t('community.publishing') : t('community.publishOutfit')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ShareOutfit;