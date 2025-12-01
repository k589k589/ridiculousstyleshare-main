import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { User, Hash, Image as ImageIcon, Heart, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().trim().max(100, { message: "Search query too long" }),
  type: z.enum(['all', 'users', 'posts', 'tags'])
});

interface SearchResultsProps {
  searchQuery: string;
  searchType: 'all' | 'users' | 'posts' | 'tags';
  onSelectTag?: (tag: string) => void;
}

interface UserResult {
  user_id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
}

interface PostResult {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  } | null;
}

interface TagResult {
  tag: string;
  count: number;
}

const SearchResults = ({ searchQuery, searchType, onSelectTag }: SearchResultsProps) => {
  const navigate = useNavigate();
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [postResults, setPostResults] = useState<PostResult[]>([]);
  const [tagResults, setTagResults] = useState<TagResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      clearResults();
    }
  }, [searchQuery, searchType]);

  const clearResults = () => {
    setUserResults([]);
    setPostResults([]);
    setTagResults([]);
  };

  const performSearch = async () => {
    try {
      // Validate input
      const validated = searchSchema.parse({ query: searchQuery, type: searchType });
      const query = validated.query;

      setLoading(true);

      if (searchType === 'all' || searchType === 'users') {
        await searchUsers(query);
      }

      if (searchType === 'all' || searchType === 'posts') {
        await searchPosts(query);
      }

      if (searchType === 'all' || searchType === 'tags') {
        await searchTags(query);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: t('common.error'),
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error('Search error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, bio, followers_count')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      setUserResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUserResults([]);
    }
  };

  const searchPosts = async (query: string) => {
    try {
      const { data: outfitsData, error } = await supabase
        .from('outfits')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('likes_count', { ascending: false })
        .limit(12);

      if (error) throw error;

      // Fetch related profiles
      let outfitsWithProfiles = outfitsData || [];
      if (outfitsData && outfitsData.length > 0) {
        const userIds = Array.from(new Set(outfitsData.map((o: any) => o.user_id)));
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, { name: p.name, avatar_url: p.avatar_url }]));
        outfitsWithProfiles = outfitsData.map((o: any) => ({
          ...o,
          profiles: profileMap.get(o.user_id) || null,
        }));
      }

      setPostResults(outfitsWithProfiles);
    } catch (error) {
      console.error('Error searching posts:', error);
      setPostResults([]);
    }
  };

  const searchTags = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('style_tags');

      if (error) throw error;

      // Process tags
      const tagCounts = new Map<string, number>();
      data?.forEach((outfit: any) => {
        outfit.style_tags?.forEach((tag: string) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        });
      });

      const results = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      setTagResults(results);
    } catch (error) {
      console.error('Error searching tags:', error);
      setTagResults([]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!searchQuery.trim()) {
    return null;
  }

  const hasResults = userResults.length > 0 || postResults.length > 0 || tagResults.length > 0;

  if (!hasResults) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{t('search.noResults')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Results */}
      {userResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('search.users')} ({userResults.length})
          </h3>
          <div className="space-y-2">
            {userResults.map((user) => (
              <Card
                key={user.user_id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/user/${user.user_id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{user.name}</h4>
                      {user.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.followers_count} {t('profile.followers')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tag Results */}
      {tagResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {t('search.tags')} ({tagResults.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {tagResults.map((tagResult) => (
              <Badge
                key={tagResult.tag}
                variant="secondary"
                className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => onSelectTag?.(tagResult.tag)}
              >
                #{tagResult.tag} ({tagResult.count})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Post Results */}
      {postResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {t('search.posts')} ({postResults.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {postResults.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <AspectRatio ratio={1}>
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      // Navigate to community feed and scroll to this post
                      navigate('/community');
                    }}
                  />
                </AspectRatio>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 line-clamp-1">{post.title}</h4>
                  {post.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/user/${post.user_id}`);
                      }}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground truncate">
                        {post.profiles?.name || t('community.anonymousUser')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {post.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {post.comments_count}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
