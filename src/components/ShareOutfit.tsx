import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Upload, X, Tag, Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNativeCamera } from '@/hooks/useNativeCamera';

const ShareOutfit = () => {
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
      // Convert data URL to File for upload
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
      // Convert data URL to File for upload
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
      // Upload image to Supabase Storage
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('outfit-images')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('outfit-images')
        .getPublicUrl(filePath);

      // Save outfit to database
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

      // Reset form
      setTitle('');
      setDescription('');
      setTags([]);
      setImage(null);
      setImagePreview(null);
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
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('community.loginRequired')}</CardTitle>
          <CardDescription>
            {t('community.loginToComment')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t('community.shareMyOutfit')}
        </CardTitle>
        <CardDescription>
          {t('community.shareDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">{t('community.outfitPhoto')}</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-64 object-cover rounded-lg mx-auto"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <div className="space-y-3">
                    {isNative && (
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTakePicture}
                          disabled={cameraLoading}
                          className="flex items-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          {t('community.takePhoto')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePickFromGallery}
                          disabled={cameraLoading}
                          className="flex items-center gap-2"
                        >
                          <ImageIcon className="h-4 w-4" />
                          {t('community.choosePhoto')}
                        </Button>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image')?.click()}
                      className="relative"
                    >
                      {isNative ? t('community.browseFiles') : t('community.formUploadPhoto')}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">{t('community.formSupportFormat')}</p>
                  </div>
                </div>
              )}
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                required
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('community.formTitle')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('community.formTitlePlaceholder')}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('community.formDescription')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('community.formDescriptionPlaceholder')}
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>{t('community.formStyleTags')}</Label>
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder={t('community.formAddStyleTag')}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                    <X
                      className="h-3 w-3 ml-1"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('community.publishing') : t('community.publishOutfit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShareOutfit;