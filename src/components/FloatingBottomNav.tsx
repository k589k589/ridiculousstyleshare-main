import { useState, useEffect } from "react";
import { Home, Search, Plus, Bell, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const FloatingBottomNav = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (!user) return;

        const checkUnread = async () => {
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            setHasUnread(!!count && count > 0);
        };

        checkUnread();

        // Poll every minute
        const interval = setInterval(checkUnread, 60000);
        return () => clearInterval(interval);
    }, [user]);

    // Hide on Home ('/') and Login/Auth pages
    // Show only on: /community, /notifications, /profile, /create-post, /user/*
    const showNav = ['/community', '/notifications', '/profile', '/create-post'].some(path => location.pathname === path) ||
        location.pathname.startsWith('/user/');

    if (!showNav) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl border border-white/20 scale-90">
                <Link to="/" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Home className="w-5 h-5" />
                </Link>

                <Link to="/community" className={`p-2 rounded-full transition-colors ${location.pathname === '/community' ? 'text-black bg-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Search className="w-5 h-5" />
                </Link>

                <Link to="/create-post" className="mx-1">
                    <div className="bg-black text-white p-2.5 rounded-full shadow-lg hover:bg-gray-800 transition-colors">
                        <Plus className="w-5 h-5" />
                    </div>
                </Link>

                <Link to="/notifications" className={`relative p-2 rounded-full transition-colors ${location.pathname === '/notifications' ? 'text-black bg-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Bell className="w-5 h-5" />
                    {hasUnread && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                </Link>

                <Link to={user ? "/profile" : "/auth"} className={`p-2 rounded-full transition-colors ${location.pathname === '/profile' ? 'text-black bg-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
                    <User className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
};

export default FloatingBottomNav;
