import { Monitor, LogOut } from "lucide-react";

interface EvictedDialogProps {
  onAcknowledge: () => void;
}

export const EvictedDialog = ({ onAcknowledge }: EvictedDialogProps) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
    <div className="bg-card w-full max-w-sm border border-border rounded-2xl p-6 shadow-2xl text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center mb-4">
        <Monitor size={28} className="text-destructive" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Session Ended</h2>
      <p className="text-muted-foreground text-sm mb-6">
        You have been logged out because your account is being used on another device.
      </p>
      <button
        onClick={onAcknowledge}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        <LogOut size={18} /> OK, Sign In Again
      </button>
    </div>
  </div>
);
