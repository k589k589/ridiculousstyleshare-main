import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, PlusSquare, Heart, User, Camera, Image, Bell, PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ShareOutfit from "@/components/ShareOutfit";
import { NotificationCenter } from "./NotificationCenter";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const { t } = useLanguage();

    const [isShareOpen, setIsShareOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const isActive = (path: string) => location.pathname === path;

    // Only show on specific pages: Profile and Community
    // Can extend to include others if needed, but user specified these contextually
    const shouldShow = ['/profile', '/community'].some(path => location.pathname === path || location.pathname.startsWith(path + '/'));

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
        }
    }, [user, notificationOpen]); // Refresh when notification center closes

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            if (!error) setUnreadCount(count || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const handlePostClick = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault();
            toast({
                title: t('auth.loginRequired'),
                description: t('auth.loginToShare'),
                variant: "destructive",
            });
            navigate('/auth');
            return;
        }
        // Let the DialogTrigger handle opening, or we control state:
        // Since we wrapped it in Dialog, state control is handled by onOpenChange
    };

    if (!shouldShow) return null;

    return (
        <>
            <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
                {/* Light Transparent Background (Glassmorphism) container */}
                <div className="bg-white/90 backdrop-blur-xl rounded-full border border-gray-200/50 px-6 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)]">

                    {/* 1. Home */}
                    <Link to="/" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Home className="w-6 h-6" strokeWidth={isActive('/') ? 3 : 2} />
                    </Link>

                    {/* 2. Search (Community) */}
                    <Link to="/community" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/community') ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Search className="w-6 h-6" strokeWidth={isActive('/community') ? 3 : 2} />
                    </Link>

                    {/* 3. Post Article (Center) */}
                    <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                        <DialogTrigger asChild>
                            <button onClick={handlePostClick} className="flex flex-col items-center gap-1 text-black hover:text-gray-700 transition-colors">
                                <PlusSquare className="w-7 h-7" strokeWidth={2.5} />
                            </button>
                        </DialogTrigger>
                        {user && (
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                                <ShareOutfit onSuccess={() => setIsShareOpen(false)} />
                            </DialogContent>
                        )}
                    </Dialog>

                    {/* 4. Notifications */}
                    <button
                        onClick={() => setNotificationOpen(true)}
                        className={`flex flex-col items-center gap-1 transition-colors relative ${notificationOpen ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Bell className="w-6 h-6" strokeWidth={notificationOpen ? 3 : 2} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* 5. Profile */}
                    <Link to="/profile" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                        {user ? (
                            <Avatar className={`w-6 h-6 ${isActive('/profile') ? 'ring-2 ring-black ring-offset-2' : ''}`}>
                                <AvatarImage src={user.user_metadata?.avatar_url} />
                                <AvatarFallback className="text-[10px] bg-gray-100 text-black">
                                    {user.email?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <User className="w-6 h-6" strokeWidth={isActive('/profile') ? 3 : 2} />
                        )}
                    </Link>

                </div>
            </div>

            {/* Global Notification Center for Bottom Nav */}
            <NotificationCenter
                open={notificationOpen}
                onOpenChange={(open) => {
                    setNotificationOpen(open);
                    if (!open) fetchUnreadCount();
                }}
            />
        </>
    );
};

export default BottomNav;
