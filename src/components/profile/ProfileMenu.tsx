import { ChevronRight, type LucideIcon } from "lucide-react";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  count: string | null;
  action: () => void;
}

export default function ProfileMenu({ menuItems }: { menuItems: MenuItem[] }) {
  return (
    <div className="space-y-1.5">
      {menuItems.map(({ icon: Icon, label, count, action }) => (
        <button
          key={label}
          onClick={action}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-primary" />
          </div>
          <span className="flex-1 text-left text-sm font-medium text-foreground">{label}</span>
          {count && count !== "0" && (
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">{count}</span>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
