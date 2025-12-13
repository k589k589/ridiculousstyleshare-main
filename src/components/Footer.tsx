import { Camera, Instagram, Linkedin, Mail, Twitter } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-secondary text-secondary-foreground py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Camera className="h-8 w-8 text-primary" />
              <span className="font-playfair text-2xl font-bold text-gradient">
                StyleShare
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/ridiculousstylesharing/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/rsscommunity" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://x.com/Ridiculous26219" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Mail className="h-5 w-5" />
              <a href="mailto:ridiculousstylesharing@gmail.com">ridiculousstylesharing@gmail.com</a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mt-2">
              <Mail className="h-5 w-5" />
              <a href="mailto:k589k589@gmail.com">k589k589@gmail.com</a>
            </div>
          </div>
        </div>

        <hr className="my-8 border-border" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-muted-foreground text-sm">
              {t('footer.copyright')}
            </p>
            <a
              href="/privacy-policy"
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
            >
              {t('footer.privacyPolicy') || '隱私政策 / Privacy Policy'}
            </a>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('footer.tagline')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;