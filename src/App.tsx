import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { useEffect } from "react";
import { trackVisit } from "@/lib/visitTracker";
import Index from "./pages/Index";
import VirtualTryOn from "./pages/VirtualTryOn";
import BetterThanModel from "./pages/BetterThanModel";
import StyleTrying from "./pages/StyleTrying";
import OutfitRating from "./pages/OutfitRating";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Messages from "./pages/Messages";
import Brands from "./pages/Brands";
import Celebrities from "./pages/Celebrities";
import Admin from "./pages/Admin";
import AdminAnalytics from "./pages/AdminAnalytics";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Auth from "./components/Auth";
import NotFound from "./pages/NotFound";
import UploadOfficialOutfits from "./pages/UploadOfficialOutfits";
import Notifications from "./pages/Notifications";
import CreatePost from "./pages/CreatePost";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingBottomNav from "./components/FloatingBottomNav";
import { WelcomeDialogManager } from "./components/WelcomeDialogManager";

const App = () => {
  useEffect(() => {
    // Track visit on app mount
    trackVisit();
  }, []);

  return (
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <WelcomeDialogManager />
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/virtual-tryron" element={<VirtualTryOn />} />
                  <Route path="/better-than-model" element={<BetterThanModel />} />
                  <Route path="/style-trying" element={<StyleTrying />} />
                  <Route path="/outfit-rating" element={<OutfitRating />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/user/:userId" element={<UserProfile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/celebrities" element={<Celebrities />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/upload-official-outfits" element={<UploadOfficialOutfits />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/create-post" element={<CreatePost />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/auth" element={<Auth />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <FloatingBottomNav />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  );
};

export default App;
