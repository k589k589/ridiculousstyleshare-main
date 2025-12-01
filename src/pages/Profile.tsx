// Profile page component
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import Auth from '@/components/Auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import BookmarkedOutfits from '@/components/BookmarkedOutfits';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  trending_count: number;
}

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
  next_billing_date: string | null;
  paypal_subscription_id: string | null;
}

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [outfits, setOutfits] = useState<UserOutfit[]>([]);
  const [editProfile, setEditProfile] = useState({
    name: '',
    bio: '',
    avatar_url: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tryonsCount, setTryonsCount] = useState(0);
  const [isLoadingTryons, setIsLoadingTryons] = useState(true);
  const [vipSubscription, setVipSubscription] = useState<VipSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const MAX_TRYONS = 10;

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserOutfits();
      fetchTryonCount();
      fetchVipSubscription();
    }
  }, [user]);

  useEffect(() => {
    // Check for PayPal return
    const urlParams = new URLSearchParams(window.location.search);
    const subscription = urlParams.get('subscription');

    if (subscription === 'success') {
      toast.success(t('toast.subscriptionSuccess'));
      // Clean URL
      window.history.replaceState({}, '', '/profile');
      fetchVipSubscription();
    } else if (subscription === 'cancelled') {
      toast.error(t('toast.subscriptionCancelled'));
      window.history.replaceState({}, '', '/profile');
    }
  }, []);

  const fetchTryonCount = async () => {
    if (!user) {
      setIsLoadingTryons(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_tryons')
        .select('tryons_count')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setTryonsCount(data?.tryons_count || 0);
    } catch (error) {
      console.error('Error fetching tryon count:', error);
    } finally {
      setIsLoadingTryons(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setEditProfile({
          name: data.name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        });
      } else {
        // Create profile if doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            name: user.email?.split('@')[0] || '用戶',
            bio: null,
            avatar_url: null
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        setEditProfile({
          name: newProfile.name || '',
          bio: newProfile.bio || '',
          avatar_url: newProfile.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(t('toast.profileLoadError'));
    }
  };

  const fetchUserOutfits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOutfits(data || []);
    } catch (error) {
      console.error('Error fetching user outfits:', error);
      toast.error(t('toast.outfitsLoadError'));
    }
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editProfile.name,
          bio: editProfile.bio,
          avatar_url: editProfile.avatar_url
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({
        ...profile,
        name: editProfile.name,
        bio: editProfile.bio,
        avatar_url: editProfile.avatar_url
      });
      setIsEditing(false);
      toast.success(t('toast.profileUpdateSuccess'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('toast.profileUpdateError'));
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file || !user) return;

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('outfit-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('outfit-images')
        .getPublicUrl(filePath);

      setEditProfile({
        ...editProfile,
        avatar_url: urlData.publicUrl
      });

      toast.success(t('toast.avatarUploadSuccess'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('toast.avatarUploadError'));
    } finally {
      setUploading(false);
    }
  };

  const fetchVipSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vip_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      setVipSubscription(data);
    } catch (error) {
      console.error('Error fetching VIP subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;

    setIsSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-paypal-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        }
      });

      if (error) throw error;

      if (data.approvalUrl) {
        // Redirect to PayPal for approval
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('No approval URL received');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error(t('toast.subscriptionCreateError'));
      setIsSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !vipSubscription) return;

    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-paypal-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        }
      });

      if (error) throw error;

      toast.success(t('toast.subscriptionCancelSuccess'));
      setVipSubscription(null);
      setCancelDialogOpen(false);
      fetchVipSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(t('toast.subscriptionCancelError'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteClick = (outfitId: string) => {
    setOutfitToDelete(outfitId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteOutfit = async () => {
    if (!outfitToDelete) return;

    try {
      const { error } = await supabase
        .from('outfits')
        .delete()
        .eq('id', outfitToDelete);

      if (error) throw error;

      setOutfits(outfits.filter(outfit => outfit.id !== outfitToDelete));
      toast.success(t('toast.outfitDeleted'));
    } catch (error) {
      console.error('Error deleting outfit:', error);
      toast.error(t('toast.outfitDeleteError'));
    } finally {
      setDeleteDialogOpen(false);
      setOutfitToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl relative z-10">
        {/* Profile Header */}
        <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
          <div className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden">

            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
              {/* Avatar Section */}
              <div className="relative group/avatar">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-md opacity-50 group-hover/avatar:opacity-100 transition-opacity duration-500" />
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-2xl relative">
                  <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="text-4xl font-playfair bg-gradient-to-br from-muted to-muted/50">
                    {profile?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-2 bg-background/80 backdrop-blur-sm rounded-full cursor-pointer shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 hover:bg-background">
                  <span className="text-xs font-bold px-2">Edit</span>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={uploadAvatar}
                    disabled={uploading}
                  />
                </Label>
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold tracking-tight">
                      {profile?.name || '用戶'}
                    </h1>
                    {vipSubscription && (
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3 py-1">
                        VIP
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground font-light tracking-wide">{user.email}</p>
                </div>

                {profile?.bio && (
                  <p className="text-lg text-muted-foreground/80 max-w-2xl font-light leading-relaxed">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full px-6 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    {t('profile.editProfile')}
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full px-6 hover:bg-secondary/5"
                  >
                    Share Profile
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 min-w-[200px]">
                <div className="text-center p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-colors">
                  <div className="text-2xl font-bold font-playfair">{outfits.length}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t('profile.outfits')}</div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-colors">
                  <div className="text-2xl font-bold font-playfair">{profile?.followers_count || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t('profile.followers')}</div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-colors">
                  <div className="text-2xl font-bold font-playfair">{profile?.following_count || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t('profile.following')}</div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-colors">
                  <div className="text-2xl font-bold font-playfair">{profile?.trending_count || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t('profile.trending')}</div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-colors col-span-2 lg:col-span-1">
                  {isLoadingTryons ? (
                    <div className="text-2xl font-bold">...</div>
                  ) : (
                    <div className={`text-2xl font-bold font-playfair ${vipSubscription
                      ? 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'
                      : tryonsCount >= MAX_TRYONS
                        ? 'text-red-500'
                        : tryonsCount >= MAX_TRYONS * 0.8
                          ? 'text-yellow-500'
                          : ''
                      }`}>
                      {vipSubscription ? t('profile.unlimited') : MAX_TRYONS - tryonsCount}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t('profile.remainingTryons')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIP Subscription Card - Premium Redesign */}
        <div className="mb-16">
          <div className={`relative overflow-hidden rounded-3xl transition-all duration-500 ${vipSubscription
            ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white shadow-2xl shadow-black/40 border border-white/10'
            : 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white shadow-2xl shadow-black/20 border border-white/5'
            }`}>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            {vipSubscription && (
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            )}

            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl ${vipSubscription
                  ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black'
                  : 'bg-white/10 backdrop-blur-md border border-white/10'
                  }`}>
                  <span className="text-3xl font-black tracking-tighter">VIP</span>
                </div>
                <div>
                  <h3 className="text-3xl font-playfair font-bold mb-2 text-white tracking-wide">
                    {vipSubscription ? t('profile.vipMember') : t('profile.vipPlan')}
                  </h3>
                  <p className="text-gray-300 text-lg font-light">
                    {vipSubscription ? t('profile.vipUnlimited') : t('profile.vipPrice')}
                  </p>
                  {!vipSubscription && (
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">Premium</Badge>
                      <Badge variant="outline" className="border-white/20 text-gray-300">Unlimited Access</Badge>
                    </div>
                  )}
                </div>
              </div>

              <Button
                size="lg"
                onClick={vipSubscription ? () => setCancelDialogOpen(true) : handleSubscribe}
                className={`rounded-full px-10 h-14 text-lg font-bold tracking-wide transition-all duration-300 shadow-xl hover:scale-105 ${vipSubscription
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500 border-none'
                  }`}
              >
                {vipSubscription ? (
                  <>
                    {t('profile.cancelSubscription')}
                  </>
                ) : (
                  <>
                    {t('profile.subscribe')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="outfits" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="bg-transparent border-b border-border/50 w-full justify-center gap-8 rounded-none h-auto p-0">
              <TabsTrigger
                value="outfits"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-8 py-4 text-lg font-playfair text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                {t('profile.myOutfits')}
              </TabsTrigger>
              <TabsTrigger
                value="liked"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-8 py-4 text-lg font-playfair text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                {t('profile.bookmarkedOutfits')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="outfits" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            {outfits.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
                  <span className="text-4xl">📷</span>
                </div>
                <h3 className="text-2xl font-playfair font-bold mb-3">{t('profile.noOutfits')}</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {t('profile.firstOutfit')}
                </p>
                <Button size="lg" onClick={() => window.location.href = '/community'} className="rounded-full">
                  {t('profile.publishOutfit')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {outfits.map((outfit) => (
                  <div key={outfit.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
                    <img
                      src={outfit.image_url}
                      alt={outfit.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="font-playfair text-xl font-bold mb-2">{outfit.title}</h3>
                        {outfit.description && (
                          <p className="text-white/80 text-sm line-clamp-2 mb-4 font-light">
                            {outfit.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-red-500">♥</span>
                            <span>{outfit.likes_count}</span>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/20 hover:bg-red-500/80 backdrop-blur-sm border-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(outfit.id);
                            }}
                          >
                            <span className="text-xs">Del</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked">
            <BookmarkedOutfits userId={user.id} vipSubscription={vipSubscription} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl text-center">{t('profile.editProfile')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.nickname')}</Label>
              <Input
                id="name"
                value={editProfile.name}
                onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">{t('profile.bio')}</Label>
              <Textarea
                id="bio"
                value={editProfile.bio}
                onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                className="rounded-xl resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 rounded-xl">
                {t('profile.cancel')}
              </Button>
              <Button onClick={updateProfile} className="flex-1 rounded-xl">
                {t('profile.saveChanges')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair">{t('profile.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.confirmDeleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('profile.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOutfit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              {t('profile.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair">{t('profile.confirmCancelSub')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t('profile.cancelSubDesc')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('profile.cancelSubFeature1')}</li>
                <li>{t('profile.cancelSubFeature2')}</li>
              </ul>
              <p className="pt-2">{t('profile.cancelSubConfirm')}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('profile.keepSubscription')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {isCancelling ? t('profile.processing') : t('profile.confirmCancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;