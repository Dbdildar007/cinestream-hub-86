import { motion } from "framer-motion";
import { ChevronLeft, Moon, Sun, Bell, Shield, HelpCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const sections = [
    {
      title: "Preferences",
      items: [
        {
          icon: isDark ? Moon : Sun,
          label: "Dark Mode",
          toggle: true,
          value: isDark,
          onChange: toggleTheme,
        },
        {
          icon: Bell,
          label: "Push Notifications",
          toggle: true,
          value: notifications,
          onChange: () => setNotifications(!notifications),
        },
      ],
    },
    {
      title: "About",
      items: [
        { icon: Shield, label: "Privacy Policy", action: () => setShowPrivacy(!showPrivacy) },
        { icon: HelpCircle, label: "Help & Support", action: () => setShowHelp(!showHelp) },
        { icon: Info, label: "App Version", subtitle: "1.0.0" },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-6 md:pt-24 px-4 md:px-12 pb-24"
    >
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/profile")} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display tracking-wider text-foreground">SETTINGS</h1>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">{section.title}</h2>
          <div className="space-y-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={'action' in item ? item.action : 'onChange' in item ? item.onChange : undefined}
                  className="w-full flex items-center gap-4 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
                  {'subtitle' in item && item.subtitle && (
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  )}
                  {'toggle' in item && item.toggle && (
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${item.value ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${item.value ? 'left-5 bg-primary-foreground' : 'left-1 bg-foreground'}`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Privacy Policy Content */}
      {showPrivacy && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 p-4 rounded-lg bg-secondary">
          <h3 className="text-sm font-semibold text-foreground mb-2">Privacy Policy</h3>
          <div className="text-xs text-muted-foreground space-y-2">
            <p>CineStream respects your privacy and is committed to protecting your personal data. This policy explains how we collect, use, and share your information.</p>
            <p><strong>Data We Collect:</strong> Account info (email, name), watch history, ratings, preferences, and device information.</p>
            <p><strong>How We Use It:</strong> To provide personalized recommendations, improve our service, and communicate with you about your account.</p>
            <p><strong>Data Sharing:</strong> We do not sell your personal data. We may share anonymized analytics with partners.</p>
            <p><strong>Your Rights:</strong> You can request data deletion, export your data, or update your preferences at any time from your profile settings.</p>
            <p><strong>Security:</strong> We use industry-standard encryption and secure storage to protect your data.</p>
            <p>Last updated: March 2026. Contact us at privacy@cinestream.app for questions.</p>
          </div>
        </motion.div>
      )}

      {/* Help & Support Content */}
      {showHelp && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 p-4 rounded-lg bg-secondary">
          <h3 className="text-sm font-semibold text-foreground mb-2">Help & Support</h3>
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Playback Issues:</strong> Try refreshing the page or clearing your browser cache. Ensure you have a stable internet connection.</p>
            <p><strong>Account Problems:</strong> If you can't log in, use the "Forgot Password" option on the login page to reset your credentials.</p>
            <p><strong>Downloads:</strong> Downloads are available for offline viewing. Check the Downloads page to manage your saved content.</p>
            <p><strong>Watchlist:</strong> Add movies and series to your watchlist by clicking the "My List" button on any card or modal.</p>
            <p><strong>Ratings:</strong> Rate content by clicking the stars on any movie or series card. Your ratings help improve recommendations.</p>
            <p><strong>Contact Us:</strong> Email support@cinestream.app or reach out via the in-app feedback option.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
