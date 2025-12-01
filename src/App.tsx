import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import Index from "./pages/Index";
import VirtualTryOn from "./pages/VirtualTryOn";
import BetterThanModel from "./pages/BetterThanModel";
import StyleTrying from "./pages/StyleTrying";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Messages from "./pages/Messages";
import Brands from "./pages/Brands";
import Celebrities from "./pages/Celebrities";
import Admin from "./pages/Admin";
import Auth from "./components/Auth";
import NotFound from "./pages/NotFound";
import UploadOfficialOutfits from "./pages/UploadOfficialOutfits";
import Header from "./components/Header";
import Footer from "./components/Footer";

const App = () => (
  <LanguageProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/virtual-tryron" element={<VirtualTryOn />} />
                <Route path="/better-than-model" element={<BetterThanModel />} />
                <Route path="/style-trying" element={<StyleTrying />} />
                <Route path="/community" element={<Community />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/user/:userId" element={<UserProfile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/brands" element={<Brands />} />
                <Route path="/celebrities" element={<Celebrities />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/upload-official-outfits" element={<UploadOfficialOutfits />} />
                <Route path="/auth" element={<Auth />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </LanguageProvider>
);

export default App;
