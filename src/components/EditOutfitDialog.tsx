import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Tag, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EditOutfitDialogProps {
    isOpen: boolean;
    onClose: () => void;
    outfit: {
        id: string;
        title: string;
        description: string | null;
        style_tags: string[] | null;
    };
    onSuccess: () => void;
}

const EditOutfitDialog = ({ isOpen, onClose, outfit, onSuccess }: EditOutfitDialogProps) => {
    const [title, setTitle] = useState(outfit.title);
    const [description, setDescription] = useState(outfit.description || '');
    const [tags, setTags] = useState<string[]>(outfit.style_tags || []);
    const [currentTag, setCurrentTag] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setTitle(outfit.title);
            setDescription(outfit.description || '');
            setTags(outfit.style_tags || []);
        }
    }, [isOpen, outfit]);

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
        setLoading(true);

        try {
            const { error } = await supabase
                .from('outfits')
                .update({
                    title,
                    description,
                    style_tags: tags,
                })
                .eq('id', outfit.id);

            if (error) throw error;

            toast({
                title: t('community.updateSuccess'),
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error updating outfit:', error);
            toast({
                title: t('community.updateFail'),
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="font-playfair text-2xl text-center">{t('community.editOutfit')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">{t('community.formTitle')}</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('community.formTitlePlaceholder')}
                            required
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">{t('community.formDescription')}</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('community.formDescriptionPlaceholder')}
                            rows={3}
                            className="rounded-xl resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>{t('community.formStyleTags')}</Label>
                        <div className="flex gap-2">
                            <Input
                                value={currentTag}
                                onChange={(e) => setCurrentTag(e.target.value)}
                                placeholder={t('community.formAddStyleTag')}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                className="rounded-xl"
                            />
                            <Button type="button" onClick={addTag} variant="outline" className="rounded-xl">
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

                    <DialogFooter className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                            {t('profile.cancel')}
                        </Button>
                        <Button type="submit" className="flex-1 rounded-xl" disabled={loading}>
                            {loading ? t('profile.processing') : t('community.updateOutfit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditOutfitDialog;
