import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useNativeCamera } from "@/hooks/useNativeCamera";
import { Globe } from "lucide-react";
import neonDancer from "@/assets/neon-dancer.png";

const StyleTransferInput = () => {
    const navigate = useNavigate();
    const { language, setLanguage } = useLanguage();
    const { takePicture } = useNativeCamera();

    const [selectedGender, setSelectedGender] = useState<string>("Male");

    // Hardcoded for UI match
    const remainingTries = 10;

    const handleBack = () => {
        navigate(-1);
    };

    const handleSelectPhoto = async () => {
        // Basic camera implementation - in real app would handle file/blob
        const image = await takePicture();
        if (image) {
            console.log("Photo selected:", image);
            // Logic to proceed would go here
        }
    };

    return (
        <div className="h-screen bg-black text-white flex flex-col relative overflow-hidden">
            {/* Top Bar with Cancel and Credits */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between items-center z-20">
                <button
                    onClick={handleBack}
                    className="text-white/80 hover:text-white text-lg font-light tracking-wider"
                >
                    {language === 'zh' ? '取消' : 'Cancel'}
                </button>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                        className="flex items-center gap-1 text-white/80 hover:text-white"
                    >
                        <Globe className="h-4 w-4" />
                        <span className="text-xs">{language === 'zh' ? 'EN' : '中'}</span>
                    </button>
                    <span className="text-white/60 text-sm">
                        {language === 'zh' ? `剩餘次數: ${remainingTries}` : `Credits: ${remainingTries}`} / 10
                    </span>
                </div>
            </div>

            {/* Main Content Area - Centered Neon Image */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-20">
                <div className="relative w-72 h-72 cursor-pointer" onClick={handleSelectPhoto}>
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse"></div>
                    <img
                        src={neonDancer}
                        alt="Select Photo"
                        className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(255,0,255,0.6)]"
                    />
                </div>

                {/* Select Photo Text */}
                <button
                    onClick={handleSelectPhoto}
                    className="mt-8 text-2xl font-light tracking-[0.2em] uppercase text-white hover:text-white/80 border-b border-white/30 pb-1"
                >
                    {language === 'zh' ? '選擇照片' : 'SELECT PHOTO'}
                </button>
            </div>

            {/* Bottom Controls Area */}
            <div className="w-full pb-[calc(env(safe-area-inset-bottom)+2rem)] px-6 z-20 flex flex-col items-center space-y-8 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
                {/* Gender Toggle */}
                <div className="flex bg-white/10 rounded-full p-1 backdrop-blur-sm border border-white/10 w-fit">
                    <button
                        onClick={() => setSelectedGender("Male")}
                        className={`px-8 py-3 rounded-full text-base font-medium transition-all duration-300 ${selectedGender === "Male"
                                ? "bg-white/20 text-white shadow-lg"
                                : "text-white/50 hover:text-white/80"
                            }`}
                    >
                        {language === 'zh' ? '男性' : 'Male'}
                    </button>
                    <button
                        onClick={() => setSelectedGender("Female")}
                        className={`px-8 py-3 rounded-full text-base font-medium transition-all duration-300 ${selectedGender === "Female"
                                ? "bg-white/20 text-white shadow-lg"
                                : "text-white/50 hover:text-white/80"
                            }`}
                    >
                        {language === 'zh' ? '女性' : 'Female'}
                    </button>
                </div>

                {/* Action Button */}
                <Button
                    className="w-full max-w-sm h-14 text-xl font-medium tracking-wide rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
                    style={{ backgroundColor: '#A0522D', color: '#fff' }}
                    onClick={() => {
                        console.log("Different You clicked");
                        // Trigger Generation or Check if photo is selected
                        if (!takePicture) handleSelectPhoto();
                    }}
                >
                    {language === 'zh' ? '不一樣的你' : 'Different You'}
                </Button>
            </div>
        </div>
    );
};

export default StyleTransferInput;
