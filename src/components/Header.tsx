import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import rssLogo from "@/assets/rss-logo-transparent.png";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for unread notifications
  useEffect(() => {
    if (!user || !isMenuOpen) return;

    const checkUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setHasUnread(!!count && count > 0);
    };

    checkUnread();
  }, [user, isMenuOpen]);

  // Handle profile link click - show reminder if not logged in
  const handleProfileClick = () => {
    setIsMenuOpen(false);
    if (!user) {
      toast({
        title: t('community.loginRequired'),
        description: t('community.loginDesc') || "請先登入以查看個人頁面",
      });
      navigate('/auth');
    } else {
      navigate('/profile');
    }
  };

  // Handle notifications link click - show reminder if not logged in
  const handleNotificationsClick = () => {
    setIsMenuOpen(false);
    if (!user) {
      toast({
        title: t('community.loginRequired'),
        description: t('community.loginDesc') || "請先登入以查看通知",
      });
      navigate('/auth');
    } else {
      navigate('/notifications');
    }
  };

  // Full screen menu overlay
  if (isMenuOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
        <div className="p-6 pt-[calc(env(safe-area-inset-top)+2rem)] flex justify-end">
          <button onClick={() => setIsMenuOpen(false)}>
            <X className="h-8 w-8 text-white" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-light tracking-widest hover:text-gray-300 transition-colors">
            首頁
          </Link>
          <Link to="/community" onClick={() => setIsMenuOpen(false)} className="text-xl font-light tracking-widest hover:text-gray-300 transition-colors">
            社群
          </Link>
          <Link to="/style-trying" onClick={() => setIsMenuOpen(false)} className="text-xl font-light tracking-widest hover:text-gray-300 transition-colors">
            嘗試全新風格
          </Link>
          <Link to="/better-than-model" onClick={() => setIsMenuOpen(false)} className="text-xl font-light tracking-widest hover:text-gray-300 transition-colors">
            體驗模特穿搭
          </Link>
          <Link to="/brands" onClick={() => setIsMenuOpen(false)} className="text-xl font-light tracking-widest hover:text-gray-300 transition-colors">
            品牌
          </Link>

          {/* Only show Profile and Notifications when logged in */}
          {user && (
            <>
              <div className="w-12 h-[1px] bg-white/20 my-2"></div>

              <button
                onClick={handleNotificationsClick}
                className="text-lg font-light tracking-widest hover:text-gray-300 transition-colors relative"
              >
                通知中心
                {hasUnread && (
                  <span className="absolute -top-1 -right-3 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <button
                onClick={handleProfileClick}
                className="text-lg font-light tracking-widest hover:text-gray-300 transition-colors"
              >
                個人頁面
              </button>
            </>
          )}

          <div className="flex flex-col items-center space-y-6 pt-4 opacity-50">
            <div className="flex items-center gap-3">
              <span className="text-xl font-light tracking-widest">美妝</span>
              <span className="text-[10px] border border-white/40 px-1.5 py-0.5 rounded text-white/60 tracking-wider">敬請期待</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-light tracking-widest">居家</span>
              <span className="text-[10px] border border-white/40 px-1.5 py-0.5 rounded text-white/60 tracking-wider">敬請期待</span>
            </div>
          </div>
        </div>

        <div className="p-12 flex justify-center pb-[env(safe-area-inset-bottom)]">
          {user ? (
            <Button
              variant="outline"
              className="w-32 rounded-full bg-white text-black hover:bg-gray-200 border-none h-10 text-base font-medium"
              onClick={() => {
                signOut();
                setIsMenuOpen(false);
              }}
            >
              登出
            </Button>
          ) : (
            <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-32 rounded-full bg-white text-black hover:bg-gray-200 h-10 text-base font-medium">
                登入
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const isHomePage = location.pathname === '/';
  const isCommunityPage = location.pathname === '/community';

  // Pages that need white header text (Dark backgrounds)
  const isDarkPage = isHomePage ||
    location.pathname === '/style-trying' ||
    location.pathname === '/better-than-model' ||
    location.pathname === '/better-than-model-input' || // Assuming it needs header
    location.pathname === '/style-transfer-input';

  // Dynamic text color: 
  // - Dark pages: White icons
  // - Others: Black icons
  const textColorClass = isDarkPage ? 'text-white hover:text-white/80' : 'text-black hover:text-black/80';
  const menuIconColorClass = isDarkPage ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10';

  // Logo: Show original orange on Home, no filter elsewhere
  const logoFilterClass = '';

  // Hide header on create-post for immersive experience
  // (Removed style-transfer-input from hidden list just in case, or keep it if user screenshot imply it exists? 
  // The user screenshot showed "Try New Style Here" title, which is in StyleTrying.tsx.
  // StyleTrying.tsx DOES show header.
  // So I don't need to change the hidden list for style-transfer-input if the user was talking about StyleTrying.tsx.
  // But they might be talking about both. I'll stick to mostly color change).
  if (location.pathname === '/create-post') {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full pt-[env(safe-area-inset-top)] bg-gradient-to-b from-black/20 to-transparent pointer-events-none">
      <div className="container flex h-16 items-center justify-between pointer-events-auto">
        {/* Logo or "Real Community" Text */}
        <div className="flex items-center space-x-2">
          {isCommunityPage ? (
            <Link to="/" className="block">
              <span className="text-3xl font-black font-sans uppercase tracking-tighter text-black drop-shadow-md transform scale-y-110" style={{ fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif' }}>
                REAL COMMUNITY
              </span>
            </Link>
          ) : (
            <Link to="/" className="block">
              <img src={rssLogo} alt="RSS Logo" className={`h-8 md:h-10 w-auto ${logoFilterClass}`} />
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className={`flex items-center gap-1 ${textColorClass} hover:bg-transparent`}
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium">{language === 'zh' ? 'EN' : '中'}</span>
          </Button>

          <button
            onClick={() => setIsMenuOpen(true)}
            className={`p-2 rounded-full transition-colors ${menuIconColorClass}`}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;