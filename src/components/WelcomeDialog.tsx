import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { Sparkles, Wand2, Shirt, Users } from 'lucide-react';

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
            <DialogContent className="max-w-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-700">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] rounded-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-white via-[#FF6B35] to-white bg-clip-text text-transparent">
                            {t('welcome.title')}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Community Introduction */}
                    <div className="flex gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex-shrink-0">
                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                <Users className="h-6 w-6 text-blue-400" />
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-200 leading-relaxed">
                                {t('welcome.intro')}
                            </p>
                        </div>
                    </div>

                    {/* Virtual Try-On Features */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                            {t('header.virtualTryOn')}
                        </p>

                        <div className="flex gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <Wand2 className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {t('welcome.tryNewStyle')}
                            </p>
                        </div>

                        <div className="flex gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                            <Shirt className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {t('welcome.tryNewItem')}
                            </p>
                        </div>

                        <div className="flex gap-3 p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                            <Sparkles className="h-5 w-5 text-pink-400 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {t('welcome.tryModelOutfit')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                    <Button
                        onClick={handleGetStarted}
                        className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] hover:from-[#FF5520] hover:to-[#FF6B35] text-white text-lg py-6 shadow-lg shadow-[#FF6B35]/20 transition-all duration-300"
                    >
                        {t('welcome.getStarted')} ✨
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
