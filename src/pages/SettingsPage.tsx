import { motion } from "framer-motion";
import { ChevronLeft, Moon, Sun, Bell, Shield, HelpCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const sections = [
    {
      title: "Preferences",
      items: [
        {
          icon: darkMode ? Moon : Sun,
          label: "Dark Mode",
          toggle: true,
          value: darkMode,
          onChange: () => setDarkMode(!darkMode),
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
        { icon: Shield, label: "Privacy Policy", action: () => {} },
        { icon: HelpCircle, label: "Help & Support", action: () => {} },
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
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${item.value ? 'bg-primary' : 'bg-muted'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${item.value ? 'left-5' : 'left-1'}`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
