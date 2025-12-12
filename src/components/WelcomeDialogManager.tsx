import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { WelcomeDialog } from './WelcomeDialog';

export const WelcomeDialogManager = () => {
    const { user } = useAuth();
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        // Only show welcome dialog if user is logged in and newUserWelcome flag is set
        if (user && localStorage.getItem('newUserWelcome') === 'true') {
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => {
                setShowWelcome(true);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleOpenChange = (open: boolean) => {
        setShowWelcome(open);
        if (!open) {
            localStorage.removeItem('newUserWelcome');
        }
    };

    return <WelcomeDialog open={showWelcome} onOpenChange={handleOpenChange} />;
};
