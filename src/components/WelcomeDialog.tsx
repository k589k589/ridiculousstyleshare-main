import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

interface WelcomeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const WelcomeDialog = ({ open, onOpenChange }: WelcomeDialogProps) => {
    const { t } = useLanguage();

    const handleGetStarted = () => {
        localStorage.removeItem('newUserWelcome');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-[#0A0A0A] border border-white/10 p-0 overflow-hidden gap-0 rounded-[32px]">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B35]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 px-8 pt-12 pb-8 flex flex-col items-center text-center">
                    <DialogHeader className="mb-8 space-y-4">
                        <DialogTitle className="text-4xl md:text-5xl font-playfair italic font-medium tracking-tight">
                            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                                {t('welcome.title')}
                            </span>
                        </DialogTitle>
                        <p className="text-white/60 text-sm font-light leading-relaxed max-w-xs mx-auto">
                            {t('welcome.intro')}
                        </p>
                    </DialogHeader>

                    <div className="w-full space-y-3 mb-10">
                        {/* Feature 01 */}
                        <div className="group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-500 rounded-2xl p-5 text-left">
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-playfair text-4xl italic font-bold">01</div>
                            <h3 className="text-[#FF6B35] text-xs font-bold tracking-widest uppercase mb-1">Style</h3>
                            <p className="text-white/80 font-medium">{t('welcome.tryNewStyle')}</p>
                        </div>

                        {/* Feature 02 */}
                        <div className="group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-500 rounded-2xl p-5 text-left">
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-playfair text-4xl italic font-bold">02</div>
                            <h3 className="text-purple-400 text-xs font-bold tracking-widest uppercase mb-1">Items</h3>
                            <p className="text-white/80 font-medium">{t('welcome.tryNewItem')}</p>
                        </div>

                        {/* Feature 03 */}
                        <div className="group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-500 rounded-2xl p-5 text-left">
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-playfair text-4xl italic font-bold">03</div>
                            <h3 className="text-pink-400 text-xs font-bold tracking-widest uppercase mb-1">Models</h3>
                            <p className="text-white/80 font-medium">{t('welcome.tryModelOutfit')}</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleGetStarted}
                        className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-full text-base font-bold tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02]"
                    >
                        {t('welcome.getStarted')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
