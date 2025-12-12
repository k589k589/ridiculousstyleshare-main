import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/hooks/useLanguage';

interface TrendingOutfit {
    id: string;
    image_url: string;
    title: string;
    likes_count: number;
    user_id: string;
    profiles: {
        name: string;
        avatar_url: string | null;
    } | null;
}

const TrendingPreview = () => {
    const [outfits, setOutfits] = useState<TrendingOutfit[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        fetchTrendingOutfits();
    }, []);

    const fetchTrendingOutfits = async () => {
        try {
            const { data, error } = await supabase
                .from('outfits')
                .select('id, image_url, title, likes_count, user_id, profiles(name, avatar_url)')
                .order('likes_count', { ascending: false })
                .limit(6);

            if (error) throw error;
            setOutfits(data || []);
        } catch (error) {
            console.error('Error fetching trending outfits:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="py-12 bg-muted/30">
                <div className="container">
                    <div className="text-center">
                        <div className="h-8 bg-muted animate-pulse rounded w-48 mx-auto mb-8"></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (outfits.length === 0) {
        return null;
    }

    return (
        <section className="py-16 bg-gradient-to-b from-background to-muted/30">
            <div className="container">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">
                        {t('home.trendingTitle') || '熱門穿搭'}
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {t('home.trendingSubtitle') || '探索社群最受歡迎的時尚靈感'}
                    </p>
                </div>

                {/* Outfit Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    {outfits.map((outfit) => (
                        <div
                            key={outfit.id}
                            className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted"
                            onClick={() => navigate('/community')}
                        >
                            <img
                                src={outfit.image_url}
                                alt={outfit.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                    <p className="text-sm font-semibold line-clamp-1">{outfit.title}</p>
                                    <div className="flex items-center gap-1 text-xs mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                        <span>{outfit.likes_count}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Button
                        onClick={() => navigate('/community')}
                        size="lg"
                        className="rounded-full bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary"
                    >
                        {t('home.exploreCommunity') || '探索更多穿搭'}
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default TrendingPreview;
