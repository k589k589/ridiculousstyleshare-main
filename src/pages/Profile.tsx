// Profile page component
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import OutfitDetailDialog from '@/components/OutfitDetailDialog';
import { useAppleIAP } from '@/hooks/useAppleIAP';
import { Capacitor } from '@capacitor/core';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  trending_count: number;
  instagram_username: string | null;
}

interface UserOutfit {
  id: string;
  user_id: string;
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
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { purchase, isAvailable: isIapAvailable, product: iapProduct, error: iapError } = useAppleIAP();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [outfits, setOutfits] = useState<UserOutfit[]>([]);
  const [editProfile, setEditProfile] = useState({
    name: '',
    bio: '',
    avatar_url: '',
    instagram_username: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tryonsCount, setTryonsCount] = useState(0);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [vipSubscription, setVipSubscription] = useState<VipSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('outfits');
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const MAX_TRYONS = 10;

  const loadProfileData = useCallback(async () => {
    if (!user) return;

    setIsLoadingData(true);
    try {
      // 1. Fetch Profile
      const profilePromise = supabase
        .from('profiles')
        .select('id, user_id, name, avatar_url, bio, followers_count, following_count, trending_count')
        .eq('user_id', user.id)
        .single();

      // 2. Fetch Outfits (optimized for mobile - limit 30)
      const outfitsPromise = supabase
        .from('outfits')
        .select('id, user_id, title, description, image_url, style_tags, likes_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      // 3. Fetch Tryon Count
      const tryonPromise = supabase
        .from('user_tryons')
        .select('tryons_count')
        .eq('user_id', user.id)
        .maybeSingle();

      // 4. Fetch VIP Subscription
      const vipPromise = supabase
        .from('vip_subscriptions')
        .select('id, status, next_billing_date, paypal_subscription_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const [profileResult, outfitsResult, tryonResult, vipResult] = await Promise.all([
        profilePromise,
        outfitsPromise,
        tryonPromise,
        vipPromise
      ]);

      // Handle Profile
      if (profileResult.data) {
        setProfile(profileResult.data as unknown as UserProfile);
        setEditProfile({
          name: profileResult.data.name || '',
          bio: profileResult.data.bio || '',
          avatar_url: profileResult.data.avatar_url || '',
          instagram_username: (profileResult.data as any).instagram_username || ''
        });
      } else if (profileResult.error && profileResult.error.code === 'PGRST116') {
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
        setProfile(newProfile as unknown as UserProfile);
        setEditProfile({
          name: newProfile.name || '',
          bio: newProfile.bio || '',
          avatar_url: newProfile.avatar_url || '',
          instagram_username: ''
        });
      } else if (profileResult.error) {
        throw profileResult.error;
      }

      // Handle Outfits
      if (outfitsResult.error) throw outfitsResult.error;
      setOutfits(outfitsResult.data || []);

      // Handle Tryon Count
      if (tryonResult.error) throw tryonResult.error;
      setTryonsCount(tryonResult.data?.tryons_count || 0);

      // Handle VIP
      if (vipResult.error) throw vipResult.error;
      setVipSubscription(vipResult.data);

    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error(t('toast.profileLoadError'));
    } finally {
      setIsLoadingData(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (user) {
      window.scrollTo(0, 0);
      loadProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user to avoid infinite loop

  useEffect(() => {
    // Check for PayPal return
    const urlParams = new URLSearchParams(window.location.search);
    const subscription = urlParams.get('subscription');

    if (subscription === 'success') {
      toast.success(t('toast.subscriptionSuccess'));
      // Clean URL
      window.history.replaceState({}, '', '/profile');
      loadProfileData(); // Reload data to get updated subscription status
    } else if (subscription === 'cancelled') {
      toast.error(t('toast.subscriptionCancelled'));
      window.history.replaceState({}, '', '/profile');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]); // Remove loadProfileData to avoid re-renders on every data load

  const updateProfile = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editProfile.name,
          bio: editProfile.bio,
          avatar_url: editProfile.avatar_url,
          instagram_username: editProfile.instagram_username
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setProfile({
        ...profile,
        name: editProfile.name,
        bio: editProfile.bio,
        avatar_url: editProfile.avatar_url,
        instagram_username: editProfile.instagram_username
      });

      // Sync with Supabase Auth for Header update
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: editProfile.name,
          avatar_url: editProfile.avatar_url
        }
      });

      if (authError) console.error('Error syncing auth metadata:', authError);

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

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setEditProfile({
        ...editProfile,
        avatar_url: urlData.publicUrl
      });

      if (profile) {
        setProfile({
          ...profile,
          avatar_url: urlData.publicUrl
        });
      }

      // Sync with Supabase Auth for Header update
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: urlData.publicUrl }
      });

      if (authError) console.error('Error syncing auth metadata:', authError);

      toast.success(t('toast.avatarUploadSuccess'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('toast.avatarUploadError'));
    } finally {
      setUploading(false);
    }
  };



  const handleSubscribe = async () => {
    if (!user) return;

    setIsSubscribing(true);

    try {
      // Platform check: Native iOS uses Apple IAP
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        // DEBUG: Show IAP state
        toast.info(`IAP Debug: isAvailable=${isIapAvailable}, product=${iapProduct ? iapProduct.id : 'null'}, canPurchase=${iapProduct?.canPurchase || 'N/A'}`);

        if (!isIapAvailable) {
          toast.error('IAP store not available. Check: 1) IAP capability in Xcode 2) Product in App Store Connect');
          setIsSubscribing(false);
          return;
        }

        if (!iapProduct) {
          toast.error('Product "vip_monthly_subscription" not found. Check App Store Connect.');
          setIsSubscribing(false);
          return;
        }

        const { success, error } = await purchase();
        if (success) {
          toast.success(t('toast.subscriptionSuccess'));
          await loadProfileData();
        } else if (error) {
          toast.error(error);
        }
        setIsSubscribing(false);
        return;
      }

      // Web fallback: PayPal Subscription
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
      console.log('Calling cancel-paypal-subscription...');
      const { data, error } = await supabase.functions.invoke('cancel-paypal-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        }
      });

      console.log('Response data:', data);
      console.log('Response error:', error);

      if (error) {
        console.error('Invoke error:', error);
        throw new Error(error.message || 'Failed to invoke function');
      }

      if (data && !data.success) {
        console.error('Backend returned error:', data.error);
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      toast.success(t('toast.subscriptionCancelSuccess'));
      setVipSubscription(null);
      setCancelDialogOpen(false);
      loadProfileData(); // Reload data
    } catch (error: any) {
      console.error('Full error details:', {
        message: error.message,
        error: error,
        stack: error.stack
      });

      // Show specific error message if available
      const errorMessage = error.message || t('toast.subscriptionCancelError');
      toast.error(errorMessage);
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

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeletingAccount(true);
    try {
      // Use the Edge Function for comprehensive deletion (Auth + Storage + DB)
      const { error } = await supabase.functions.invoke('delete-user');

      if (error) throw error;

      await supabase.auth.signOut();

      toast.success(t('toast.accountDeleted'));
      navigate('/');

    } catch (error: any) {
      console.error('Error deleting account:', error);
      // Show more specific error if possible
      toast.error(error.message || t('toast.accountDeleteError'));
    } finally {
      setIsDeletingAccount(false);
      setDeleteAccountDialogOpen(false);
    }
  };


  if (loading || isLoadingData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">{t('common.loading') || 'Loading...'}</p>
        </div>
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

      <div className="container mx-auto px-4 pt-32 pb-12 max-w-5xl relative z-10">
        {/* Instagram-Style Profile Header */}
        <div className="border-b border-border pb-8 mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-8 md:gap-12">
              {/* Avatar - Instagram Style (Left Side) */}
              <div className="flex-shrink-0">
                <div className="relative group/avatar">
                  <Avatar className={`w-20 h-20 md:w-36 md:h-36 border-2 ${vipSubscription ? 'border-yellow-500' : 'border-gray-200'}`}>
                    <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="text-2xl md:text-4xl bg-gradient-to-br from-muted to-muted/50">
                      {profile?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full cursor-pointer shadow-md opacity-0 group-hover/avatar:opacity-100 transition-opacity border border-gray-200 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
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
              </div>

              {/* User Info - Instagram Style (Right Side) */}
              <div className="flex-1 min-w-0">
                {/* Username and Actions */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-8">
                  <h1 className="text-3xl md:text-4xl font-playfair font-bold tracking-tight">
                    {profile?.name || '用戶'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="rounded-full px-6 h-9 text-xs font-semibold tracking-wide uppercase border-muted-foreground/30 hover:border-black transition-colors"
                    >
                      {t('profile.editProfile')}
                    </Button>
                    {vipSubscription && (
                      <Badge className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-black border-none px-3 py-1 shadow-sm">
                        <span className="mr-1.5 font-bold">VIP</span> 👑
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats - Instagram Style (Horizontal) */}
                {/* Stats - Premium Style */}
                <div className="flex gap-8 md:gap-12 mb-6">
                  <div className="flex flex-col">
                    <span className="font-playfair text-2xl font-bold">{outfits.length}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('profile.outfits')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-playfair text-2xl font-bold">{profile?.followers_count || 0}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('profile.followers')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-playfair text-2xl font-bold">{profile?.trending_count || 0}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('profile.trending')}</span>
                  </div>
                </div>

                {/* Bio */}
                {profile?.bio && (
                  <p className="text-sm mb-2">
                    {profile.bio}
                  </p>
                )}

                {/* Instagram Link */}
                {profile?.instagram_username && (
                  <a
                    href={`https://instagram.com/${profile.instagram_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm flex items-center gap-1.5 text-primary hover:underline mb-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                    @{profile.instagram_username}
                  </a>
                )}

                {/* Try-ons & VIP Status Compact */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={vipSubscription ? 'text-yellow-600 font-semibold' : ''}>
                    {vipSubscription ? '∞' : MAX_TRYONS - tryonsCount} {t('profile.remainingTryons')}
                  </span>
                  {!vipSubscription && tryonsCount >= MAX_TRYONS * 0.8 && (
                    <span className="text-xs text-red-500">({t('profile.lowTryons')})</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIP Subscription Card - Luxury Dark Theme */}
        <div className="mb-12">
          {vipSubscription && vipSubscription.status === 'active' ? (
            // Active VIP State
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-xl p-6 md:p-8 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <span className="text-xl">👑</span>
                    </div>
                    <span className="text-amber-500 font-medium tracking-widest text-xs uppercase">VIP Member</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-playfair font-bold mb-2">
                    {t('profile.goldMember')}
                  </h3>
                  <p className="text-slate-300 text-sm max-w-md">
                    {t('profile.vipUnlimited')} • {t('profile.vipBadge')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCancelDialogOpen(true)}
                    className="border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all rounded-full px-6"
                  >
                    {isCancelling ? t('profile.processing') : t('profile.manageSubscription')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Inactive VIP State (Upgrade Prompt)
            <div className="relative overflow-hidden group rounded-3xl bg-[#0F172A] text-white shadow-2xl transition-all duration-500 hover:shadow-amber-500/5">
              {/* Background Gradients */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-amber-600/20 to-transparent rounded-full blur-[100px] opacity-60 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row gap-8 md:items-center justify-between">
                <div className="space-y-6 max-w-xl">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                        <span className="font-playfair font-bold text-lg">V</span>
                      </div>
                      <span className="text-white/60 tracking-[0.2em] text-xs font-medium">RIDICULOUS STYLE SHARE</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-playfair font-bold text-white tracking-tight leading-tight">
                      {t('profile.vipPlan')}
                    </h3>
                    <p className="text-lg text-white/60 font-light">
                      {t('profile.standardBenefits')}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="bg-white/10 hover:bg-white/15 text-white border-none px-4 py-1.5 h-auto text-sm backdrop-blur-sm">
                      ∞ {t('profile.tryOns')}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/10 hover:bg-white/15 text-white border-none px-4 py-1.5 h-auto text-sm backdrop-blur-sm">
                      ★ {t('profile.vipBadge')}
                    </Badge>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold text-amber-400">$5</span>
                      <span className="text-sm text-white/60">/mo</span>
                      <span className="text-lg text-white/40 line-through decoration-white/30 ml-2">$20</span>
                      <Badge className="ml-3 bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30">LIMITED OFFER</Badge>
                    </div>
                    <p className="text-xs text-white/40">
                      Cancel anytime
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto flex flex-col gap-4">
                  <Button
                    size="lg"
                    className="w-full md:w-64 h-14 rounded-xl text-lg font-semibold bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? t('profile.processing') : (
                      <>
                        {t('profile.joinVip')}
                        <span className="ml-2">→</span>
                      </>
                    )}
                  </Button>

                  {/* Legal Links - With updated translations */}
                  <div className="flex items-center justify-center gap-4 text-[10px] text-white/30">
                    <a
                      href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white/60 transition-colors underline decoration-white/10 underline-offset-2"
                    >
                      {t('auth.terms') || 'Terms of Use (EULA)'}
                    </a>
                    <span className="w-px h-3 bg-white/10"></span>
                    <Link
                      to="/privacy-policy"
                      className="hover:text-white/60 transition-colors underline decoration-white/10 underline-offset-2"
                    >
                      {t('auth.privacy') || 'Privacy Policy'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="outfits" className="space-y-8" onValueChange={setActiveTab}>
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
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {outfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    className="relative aspect-square cursor-pointer group overflow-hidden bg-muted"
                    onClick={() => {
                      setSelectedOutfit({
                        ...outfit,
                        comments_count: 0,
                        profiles: {
                          name: profile?.name || '',
                          avatar_url: profile?.avatar_url || null
                        }
                      });
                      setDetailDialogOpen(true);
                    }}
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
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          <span className="font-semibold">{outfit.likes_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked">
            <BookmarkedOutfits userId={user.id} vipSubscription={vipSubscription} isActive={activeTab === 'liked'} />
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
            <div className="space-y-2">
              <Label htmlFor="instagram">{t('profile.instagram')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                <Input
                  id="instagram"
                  value={editProfile.instagram_username}
                  onChange={(e) => setEditProfile({ ...editProfile, instagram_username: e.target.value })}
                  className="rounded-xl pl-8"
                  placeholder={t('profile.enterInstagram')}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 rounded-xl">
                {t('profile.cancel')}
              </Button>
              <Button onClick={updateProfile} className="flex-1 rounded-xl">
                {t('profile.saveChanges')}
              </Button>
            </div>

            {/* Delete Account Section */}
            <div className="border-t border-destructive/20 mt-6 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setDeleteAccountDialogOpen(true);
                }}
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
              >
                {t('profile.deleteAccount')}
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

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-destructive">
              {t('profile.confirmDeleteAccount')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t('profile.deleteAccountWarning')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('profile.deleteAccountData1')}</li>
                <li>{t('profile.deleteAccountData2')}</li>
                <li>{t('profile.deleteAccountData3')}</li>
                <li>{t('profile.deleteAccountData4')}</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('profile.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {isDeletingAccount ? t('profile.processing') : t('profile.confirmDeleteAccount')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Outfit Detail Dialog */}
      <OutfitDetailDialog
        isOpen={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedOutfit(null);
        }}
        outfit={selectedOutfit}
        isLiked={false} // We can implement this if needed, but for now basic view is fine
      />
    </div>
  );
};

export default Profile;