import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import rssLogo from "@/assets/rss-logo-transparent.png";
import { supabase } from '@/lib/supabase';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

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

          <div className="w-12 h-[1px] bg-white/20 my-2"></div>

          <Link to="/notifications" onClick={() => setIsMenuOpen(false)} className="text-lg font-light tracking-widest hover:text-gray-300 transition-colors">
            通知中心
          </Link>
          <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="text-lg font-light tracking-widest hover:text-gray-300 transition-colors">
            個人頁面
          </Link>

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

  // Dynamic text color: White for Home & Community, Black for others
  const textColorClass = (isHomePage || isCommunityPage) ? 'text-white hover:text-white/80' : 'text-black hover:text-black/80';
  const menuIconColorClass = (isHomePage || isCommunityPage) ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10';
  const logoFilterClass = (isHomePage || isCommunityPage) ? 'brightness-0 invert' : '';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full pt-[env(safe-area-inset-top)] bg-gradient-to-b from-black/20 to-transparent pointer-events-none">
      <div className="container flex h-16 items-center justify-between pointer-events-auto">
        {/* Logo or "Real Community" Text */}
        <div className="flex items-center space-x-2">
          {isCommunityPage ? (
            <Link to="/" className="block">
              <span className="text-2xl font-serif italic tracking-wide text-white drop-shadow-md">
                Real Community
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