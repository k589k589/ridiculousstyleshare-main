import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  isActive?: boolean; // Only load when tab is active
}

const BookmarkedOutfits: React.FC<BookmarkedOutfitsProps> = ({ userId, isActive = false }) => {
  const [bookmarkedOutfits, setBookmarkedOutfits] = useState<UserOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false); // Track if we've loaded once
  const { t } = useLanguage();

  useEffect(() => {
    // Only fetch when tab becomes active AND we haven't loaded yet
    if (isActive && !hasLoaded) {
      fetchBookmarkedOutfits();
    }
  }, [userId, isActive, hasLoaded]);

  const fetchBookmarkedOutfits = async () => {
    try {
      setLoading(true);

      // Get bookmarked outfit IDs first (simpler query that's more reliable)
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('outfit_bookmarks')
        .select('outfit_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20); // Limit for mobile performance

      if (bookmarksError) throw bookmarksError;

      if (!bookmarks || bookmarks.length === 0) {
        setBookmarkedOutfits([]);
        setLoading(false);
        setHasLoaded(true);
        return;
      }

      const outfitIds = bookmarks.map(b => b.outfit_id);

      // Get outfit details
      const { data: outfits, error: outfitsError } = await supabase
        .from('outfits')
        .select('id, title, description, image_url, style_tags, likes_count, created_at')
        .in('id', outfitIds);

      if (outfitsError) throw outfitsError;

      setBookmarkedOutfits(outfits || []);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error fetching bookmarked outfits:', error);
      toast.error(t('toast.bookmarksLoadError'));
    } finally {
      setLoading(false);
    }
  };

  // Show nothing if not active and never loaded
  if (!isActive && !hasLoaded) {
    return null;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (bookmarkedOutfits.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
          <Heart className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-playfair font-bold mb-3">還沒有收藏</h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          開始收藏你喜歡的穿搭吧
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {bookmarkedOutfits.map((outfit) => (
        <div
          key={outfit.id}
          className="relative aspect-square cursor-pointer group overflow-hidden bg-muted"
        >
          <img
            src={outfit.image_url}
            alt={outfit.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-4 text-white">
              <div className="flex items-center gap-1">
                <Heart className="w-5 h-5" fill="white" />
                <span className="font-semibold">{outfit.likes_count}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookmarkedOutfits;
