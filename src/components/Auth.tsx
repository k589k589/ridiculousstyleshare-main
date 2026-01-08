import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLanguage } from '@/hooks/useLanguage';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Capacitor } from '@capacitor/core';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Check if this is a password recovery callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
      setIsRecoveryMode(true);
    }
  }, []);

  // Redirect authenticated users back to where they came from
  useEffect(() => {
    if (user && !isRecoveryMode) {
      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    }
  }, [user, isRecoveryMode, location, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!isSupabaseConfigured) {
      toast({
        title: "尚未設定 Supabase",
        description: "請在右上角連接 Supabase 後再試。",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "登入成功！",
        description: "歡迎回到 StyleShare 社群",
      });
    } catch (error: any) {
      toast({
        title: "登入失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!isSupabaseConfigured) {
      toast({
        title: "尚未設定 Supabase",
        description: "請在右上角連接 Supabase 後再試。",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const gender = formData.get('gender') as string;
    const birthday = formData.get('birthday') as string;
    const country = formData.get('country') as string;

    // Terms agreement validation
    if (!agreedToTerms) {
      toast({
        title: language === 'zh' ? "註冊失敗" : "Registration Failed",
        description: t('auth.termsRequired'),
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Basic input validation
    if (!email || !email.includes('@')) {
      toast({
        title: "註冊失敗",
        description: "請輸入有效的電子信箱",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Password validation
    if (!password || password.length < 8) {
      toast({
        title: "註冊失敗",
        description: "密碼至少需要8個字元",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Check password complexity
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      toast({
        title: "註冊失敗",
        description: "密碼必須包含大寫字母、小寫字母和數字",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!name || name.trim().length === 0) {
      toast({
        title: "註冊失敗",
        description: "請輸入您的姓名",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name, gender, birthday, country },
        }
      });

      if (error) throw error;

      // Check if user already exists (Supabase security feature)
      // When a user already exists, identities array will be empty
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        toast({
          title: "此信箱已註冊",
          description: "此電子信箱已經註冊過了。如果您忘記密碼，請使用「忘記密碼」功能。",
          variant: "destructive",
        });
      } else {
        // Set flag for new user welcome dialog
        localStorage.setItem('newUserWelcome', 'true');

        toast({
          title: "註冊成功！",
          description: "我們已經發送驗證信到您的信箱，請查看信箱以完成註冊。如果沒有收到，請檢查垃圾郵件匣。",
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);

      let errorMessage = error.message;

      // Provide more user-friendly error messages
      if (error.message.includes('already registered')) {
        errorMessage = "此電子信箱已經註冊過了";
      } else if (error.message.includes('invalid email')) {
        errorMessage = "請輸入有效的電子信箱";
      } else if (error.message.includes('password')) {
        errorMessage = "密碼格式不正確，請確保至少6個字元";
      }

      toast({
        title: "註冊失敗",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      toast({
        title: "尚未設定 Supabase",
        description: "請在右上角連接 Supabase 後再試。",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google 登入失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAppleLogin = async () => {
    if (!isSupabaseConfigured) {
      toast({
        title: language === 'zh' ? "尚未設定 Supabase" : "Supabase not configured",
        description: language === 'zh' ? "請在右上角連接 Supabase 後再試。" : "Please connect Supabase first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if we're on native iOS
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        // Use native Apple Sign-In
        const SignInWithApple = (await import('@capacitor-community/apple-sign-in')).SignInWithApple;

        const result = await SignInWithApple.authorize({
          clientId: 'app.lovable.6c6b5a62d63045ac916473df130fc101',
          redirectURI: 'https://ridiculousstyleshare.online',
          scopes: 'email name',
          state: '12345',
          nonce: 'nonce',
        });

        if (result.response && result.response.identityToken) {
          // Sign in with Supabase using the Apple ID token
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: result.response.identityToken,
          });

          if (error) throw error;

          toast({
            title: language === 'zh' ? "登入成功！" : "Login successful!",
            description: language === 'zh' ? "歡迎回到 StyleShare 社群" : "Welcome to StyleShare",
          });
        }
      } else {
        // Web fallback - use OAuth
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: `${window.location.origin}/`,
          }
        });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Apple login error:', error);
      toast({
        title: language === 'zh' ? "Apple 登入失敗" : "Apple login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({
        title: "請輸入信箱",
        description: "請輸入您註冊時使用的電子信箱",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "重設密碼信件已發送",
        description: "請檢查您的電子信箱並點擊連結重設密碼",
      });
      setResetDialogOpen(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: "發送失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "密碼太短",
        description: "密碼至少需要6個字元",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "密碼更新成功！",
        description: "您現在可以使用新密碼登入",
      });

      // Clear recovery mode and redirect to main page
      setIsRecoveryMode(false);
      setNewPassword('');
      window.location.hash = '';
      navigate('/');
    } catch (error: any) {
      toast({
        title: "更新失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If in recovery mode, show password reset form
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 p-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,53,0.12),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,107,53,0.08),transparent_50%)]"></div>

        <Card className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border-gray-800 shadow-2xl relative z-10">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent"></div>

          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-white">重設密碼</CardTitle>
            <CardDescription className="text-gray-400">
              請輸入您的新密碼
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-300">新密碼</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="輸入至少6個字元"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] hover:from-[#FF5520] hover:to-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/20 transition-all duration-300"
                disabled={loading}
              >
                {loading ? '更新中...' : '更新密碼'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 p-4 relative overflow-hidden">
      {/* Background effects with Hermès orange */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,53,0.12),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,107,53,0.08),transparent_50%)]"></div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-[#FF6B35]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#FF6B35]/10 rounded-full blur-3xl"></div>

      <Card className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border-gray-800 shadow-2xl relative z-10 overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent"></div>

        <CardHeader className="text-center space-y-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-[#FF6B35] to-white bg-clip-text text-transparent flex-1">
              StyleShare
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="ml-2 text-gray-400 hover:text-[#FF6B35] hover:bg-gray-800/50 transition-colors"
            >
              <Globe className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription className="text-gray-400">
            {t('auth.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B35] data-[state=active]:to-[#FF8C5A] data-[state=active]:text-white"
              >
                {t('auth.login')}
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B35] data-[state=active]:to-[#FF8C5A] data-[state=active]:text-white"
              >
                {t('auth.signup')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="space-y-4 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 border-gray-300 font-medium"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t('auth.continueWithGoogle')}
                </Button>

                {/* Apple Sign-In Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-black hover:bg-gray-900 text-white border-gray-700 font-medium"
                  onClick={handleAppleLogin}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  {language === 'zh' ? '使用 Apple 登入' : 'Sign in with Apple'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-900 px-2 text-gray-500">{t('auth.orDivider')}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-300">{t('auth.password')}</Label>
                    <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="link"
                          className="text-[#FF6B35] hover:text-[#FF8C5A] p-0 h-auto text-sm"
                        >
                          忘記密碼？
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-800">
                        <DialogHeader>
                          <DialogTitle className="text-white">重設密碼</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            輸入您的電子信箱，我們將發送重設密碼的連結給您
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email" className="text-gray-300">電子信箱</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="your@email.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                            />
                          </div>
                          <Button
                            onClick={handleResetPassword}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] hover:from-[#FF5520] hover:to-[#FF6B35] text-white"
                          >
                            {loading ? '發送中...' : '發送重設連結'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] hover:from-[#FF5520] hover:to-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/20 transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? t('auth.loggingIn') : t('auth.login')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <div className="space-y-4 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 border-gray-300 font-medium"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t('auth.continueWithGoogle')}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-900 px-2 text-gray-500">{t('auth.orDivider')}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">{t('auth.name')}</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder={t('auth.namePlaceholder')}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t('auth.setPassword')}
                    required
                    minLength={6}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">{t('auth.gender')}</Label>
                  <RadioGroup name="gender" defaultValue="male" required className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" className="border-gray-600 text-[#FF6B35]" />
                      <Label htmlFor="male" className="font-normal text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">{t('auth.male')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" className="border-gray-600 text-[#FF6B35]" />
                      <Label htmlFor="female" className="font-normal text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">{t('auth.female')}</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday" className="text-gray-300">{t('auth.birthday')}</Label>
                  <Input
                    id="birthday"
                    name="birthday"
                    type="date"
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-gray-300">{t('auth.country')}</Label>
                  <Select name="country" required>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white focus:border-[#FF6B35] focus:ring-[#FF6B35]/20">
                      <SelectValue placeholder={t('auth.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 max-h-[300px]">
                      <SelectItem value="AF" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Afghanistan</SelectItem>
                      <SelectItem value="AL" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Albania</SelectItem>
                      <SelectItem value="DZ" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Algeria</SelectItem>
                      <SelectItem value="AR" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Argentina</SelectItem>
                      <SelectItem value="AU" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">{language === 'zh' ? '澳洲' : 'Australia'}</SelectItem>
                      <SelectItem value="AT" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Austria</SelectItem>
                      <SelectItem value="BD" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Bangladesh</SelectItem>
                      <SelectItem value="BE" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Belgium</SelectItem>
                      <SelectItem value="BR" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Brazil</SelectItem>
                      <SelectItem value="BG" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Bulgaria</SelectItem>
                      <SelectItem value="CA" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">{language === 'zh' ? '加拿大' : 'Canada'}</SelectItem>
                      <SelectItem value="CL" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Chile</SelectItem>
                      <SelectItem value="CN" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">{language === 'zh' ? '中國' : 'China'}</SelectItem>
                      <SelectItem value="CO" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Colombia</SelectItem>
                      <SelectItem value="CR" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Costa Rica</SelectItem>
                      <SelectItem value="HR" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Croatia</SelectItem>
                      <SelectItem value="CZ" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Czech Republic</SelectItem>
                      <SelectItem value="DK" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Denmark</SelectItem>
                      <SelectItem value="EG" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Egypt</SelectItem>
                      <SelectItem value="EE" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Estonia</SelectItem>
                      <SelectItem value="FI" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Finland</SelectItem>
                      <SelectItem value="FR" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">France</SelectItem>
                      <SelectItem value="DE" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Germany</SelectItem>
                      <SelectItem value="GR" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Greece</SelectItem>
                      <SelectItem value="HK" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">{language === 'zh' ? '香港' : 'Hong Kong'}</SelectItem>
                      <SelectItem value="HU" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Hungary</SelectItem>
                      <SelectItem value="IS" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Iceland</SelectItem>
                      <SelectItem value="IN" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">India</SelectItem>
                      <SelectItem value="ID" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Indonesia</SelectItem>
                      <SelectItem value="IE" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Ireland</SelectItem>
                      <SelectItem value="IL" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Israel</SelectItem>
                      <SelectItem value="IT" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Italy</SelectItem>
                      <SelectItem value="JP" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">{language === 'zh' ? '日本' : 'Japan'}</SelectItem>
                      <SelectItem value="KZ" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Kazakhstan</SelectItem>
                      <SelectItem value="KR" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">{language === 'zh' ? '韓國' : 'South Korea'}</SelectItem>
                      <SelectItem value="LV" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Latvia</SelectItem>
                      <SelectItem value="LT" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Lithuania</SelectItem>
                      <SelectItem value="MY" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">{language === 'zh' ? '馬來西亞' : 'Malaysia'}</SelectItem>
                      <SelectItem value="MX" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Mexico</SelectItem>
                      <SelectItem value="NL" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Netherlands</SelectItem>
                      <SelectItem value="NZ" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">New Zealand</SelectItem>
                      <SelectItem value="NO" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Norway</SelectItem>
                      <SelectItem value="PK" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Pakistan</SelectItem>
                      <SelectItem value="PE" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Peru</SelectItem>
                      <SelectItem value="PH" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Philippines</SelectItem>
                      <SelectItem value="PL" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Poland</SelectItem>
                      <SelectItem value="PT" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Portugal</SelectItem>
                      <SelectItem value="RO" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Romania</SelectItem>
                      <SelectItem value="RU" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Russia</SelectItem>
                      <SelectItem value="SA" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Saudi Arabia</SelectItem>
                      <SelectItem value="RS" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Serbia</SelectItem>
                      <SelectItem value="SG" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">{language === 'zh' ? '新加坡' : 'Singapore'}</SelectItem>
                      <SelectItem value="SK" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Slovakia</SelectItem>
                      <SelectItem value="SI" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Slovenia</SelectItem>
                      <SelectItem value="ZA" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">South Africa</SelectItem>
                      <SelectItem value="ES" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Spain</SelectItem>
                      <SelectItem value="SE" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Sweden</SelectItem>
                      <SelectItem value="CH" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Switzerland</SelectItem>
                      <SelectItem value="TW" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">{language === 'zh' ? '台灣' : 'Taiwan'}</SelectItem>
                      <SelectItem value="TH" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Thailand</SelectItem>
                      <SelectItem value="TR" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Turkey</SelectItem>
                      <SelectItem value="UA" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Ukraine</SelectItem>
                      <SelectItem value="AE" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">United Arab Emirates</SelectItem>
                      <SelectItem value="GB" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">{language === 'zh' ? '英國' : 'United Kingdom'}</SelectItem>
                      <SelectItem value="US" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">{language === 'zh' ? '美國' : 'United States'}</SelectItem>
                      <SelectItem value="VN" className="text-white hover:bg-gray-800 focus:bg-[#FF6B35]/20">Vietnam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Terms of Service Agreement */}
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-[#FF6B35] focus:ring-[#FF6B35]/20"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-400">
                    {t('auth.agreeToTerms')}{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF6B35] hover:text-[#FF8C5A] underline"
                    >
                      {t('auth.termsLink')}
                    </a>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] hover:from-[#FF5520] hover:to-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/20 transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? t('auth.signingUp') : t('auth.signup')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;