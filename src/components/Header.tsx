import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, User, Heart, Camera, LogOut, Users, Globe, Settings, Award, Star, Shield, Bell, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useLanguage } from "@/hooks/useLanguage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import rssLogo from "@/assets/rss-logo-transparent.png";
import { NotificationCenter } from './NotificationCenter';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-zinc-700/80 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-700/70">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2 flex-shrink min-w-0">
          <Link to="/" className="block flex-shrink-0">
            <img src={rssLogo} alt="RSS Logo" className="h-10 md:h-12 w-auto" />
          </Link>
          <span className="font-playfair text-2xl md:text-4xl font-bold text-gradient italic truncate">
            StyleShare
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
            {t('header.home')}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              {t('header.virtualTryOn')}
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-background z-50">
              <DropdownMenuItem asChild>
                <Link to="/style-trying" className="cursor-pointer">
                  {t('header.tryNewStyle')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/virtual-tryron" className="cursor-pointer">
                  {t('header.tryNewItem')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/better-than-model" className="cursor-pointer">
                  {t('header.tryModelOutfit')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/community" className="text-sm font-medium hover:text-primary transition-colors">
            {t('header.community')}
          </Link>
          <Link to="/brands" className="text-sm font-medium hover:text-primary transition-colors">
            {t('header.brands')}
          </Link>
          <Link to="/celebrities" className="text-sm font-medium hover:text-primary transition-colors">
            {t('header.celebrities')}
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            {language === 'zh' ? 'EN' : '中'}
          </Button>
          
          {user ? (
            <div className="flex items-center gap-3">
              {/* Notification Button */}
               <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotificationOpen(true)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Messages Button */}
              <Link to="/messages">
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline">{user.user_metadata?.name || user.email?.split('@')[0] || t('header.user')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      {t('header.profile')}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center cursor-pointer">
                          <Shield className="h-4 w-4 mr-2" />
                          {t('header.adminDashboard')}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('header.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link to="/auth" state={{ from: location.pathname }}>
              <Button variant="outline" size="sm" className="text-black border-black hover:bg-black hover:text-white">
                <User className="h-4 w-4 mr-2" />
                {t('header.login')}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button and Language Toggle */}
        <div className="md:hidden flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="flex items-center gap-1 px-2"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium">{language === 'zh' ? 'EN' : '中'}</span>
          </Button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-4">
            <nav className="space-y-3">
              <Link to="/" className="block text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                {t('header.home')}
              </Link>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {t('header.virtualTryOn')}
                </div>
                <div className="pl-4 space-y-2">
                  <Link to="/virtual-tryron" className="block text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                    {t('header.tryNewItem')}
                  </Link>
                  <Link to="/style-trying" className="block text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                    {t('header.tryNewStyle')}
                  </Link>
                  <Link to="/better-than-model" className="block text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                    {t('header.tryModelOutfit')}
                  </Link>
                </div>
              </div>
              <Link to="/community" className="block text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                {t('header.community')}
              </Link>
              <Link to="/brands" className="block text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                {t('header.brands')}
              </Link>
              <Link to="/celebrities" className="block text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                {t('header.celebrities')}
              </Link>
            </nav>
            <div className="flex flex-col space-y-2">
              
              {user ? (
                <div className="space-y-2">
                  {/* Notification Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setNotificationOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start relative"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {t('header.notificationCenter')}
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>

                  <Link to="/profile" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      {t('header.profile')}
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="block">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Shield className="h-4 w-4 mr-2" />
                        {t('header.adminDashboard')}
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" size="sm" onClick={signOut} className="w-full justify-start">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('header.logout')}
                  </Button>
                </div>
              ) : (
                <Link to="/auth" state={{ from: location.pathname }}>
                  <Button variant="outline" size="sm" className="text-black border-black hover:bg-black hover:text-white">
                    <User className="h-4 w-4 mr-2" />
                    {t('header.login')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Center */}
      <NotificationCenter 
        open={notificationOpen} 
        onOpenChange={(open) => {
          setNotificationOpen(open);
          if (!open) {
            fetchUnreadCount();
          }
        }} 
      />
    </header>
  );
};

export default Header;