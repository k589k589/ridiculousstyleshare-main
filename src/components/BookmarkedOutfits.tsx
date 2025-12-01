import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

interface UserOutfit {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  style_tags: string[] | null;
  likes_count: number;
  created_at: string;
}

interface VipSubscription {
  id: string;
  status: string;
}

interface BookmarkedOutfitsProps {
  userId: string;
  vipSubscription: VipSubscription | null;
}

const BookmarkedOutfits: React.FC<BookmarkedOutfitsProps> = ({ userId, vipSubscription }) => {
  const [bookmarkedOutfits, setBookmarkedOutfits] = useState<UserOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchBookmarkedOutfits();
  }, [userId]);

  const fetchBookmarkedOutfits = async () => {
    try {
      setLoading(true);
      
      // Get bookmarked outfit IDs
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('outfit_bookmarks')
        .select('outfit_id')
        .eq('user_id', userId);

      if (bookmarksError) throw bookmarksError;

      if (!bookmarks || bookmarks.length === 0) {
        setBookmarkedOutfits([]);
        setLoading(false);
        return;
      }

      const outfitIds = bookmarks.map(b => b.outfit_id);

      // Get outfit details
      const { data: outfits, error: outfitsError } = await supabase
        .from('outfits')
        .select('*')
        .in('id', outfitIds)
        .order('created_at', { ascending: false });

      if (outfitsError) throw outfitsError;

      setBookmarkedOutfits(outfits || []);
    } catch (error) {
      console.error('Error fetching bookmarked outfits:', error);
      toast.error(t('toast.bookmarksLoadError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">載入中...</p>
        </CardContent>
      </Card>
    );
  }

  if (bookmarkedOutfits.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">還沒有收藏</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            開始收藏你喜歡的穿搭吧
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookmarkedOutfits.map((outfit) => (
        <Card key={outfit.id} className={`overflow-hidden transition-all duration-300 border-border/50 ${
          vipSubscription 
            ? 'hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30' 
            : 'hover:shadow-lg hover:-translate-y-1'
        }`}>
          <div className="relative aspect-square group">
            <img 
              src={outfit.image_url} 
              alt={outfit.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-lg leading-tight">{outfit.title}</h3>
            {outfit.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {outfit.description}
              </p>
            )}
            
            {outfit.style_tags && outfit.style_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {outfit.style_tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs font-normal bg-primary/5 text-primary border-primary/20">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Heart className="w-4 h-4" />
                {outfit.likes_count}
              </span>
              <span className="text-muted-foreground text-xs">
                {new Date(outfit.created_at).toLocaleDateString('zh-TW')}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BookmarkedOutfits;
