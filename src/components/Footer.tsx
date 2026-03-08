import { Github, Twitter, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-background/80 backdrop-blur-md border-t border-border py-8 sm:py-12 mt-auto mb-16 md:mb-0">
      <div className="container mx-auto px-4 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-2">
              Flicker
            </h2>
            <p className="text-muted-foreground text-sm text-center md:text-left max-w-xs">
              Your ultimate destination for the best movies and TV shows streaming online.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <h3 className="font-semibold text-foreground">Follow Us</h3>
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Github size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Youtube size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Flicker. All rights reserved.</p>
          <div className="flex gap-6 sm:gap-8">
            <a href="#" className="hover:text-foreground transition-colors py-1 min-h-[44px] flex items-center">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors py-1 min-h-[44px] flex items-center">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
