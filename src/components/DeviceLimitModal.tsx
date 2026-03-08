import { Monitor, Smartphone, LogOut, X, Loader2 } from "lucide-react";
import { useState } from "react";

interface DeviceInfo {
  device?: string;
  browser?: string;
  os?: string;
  ip?: string;
  last_login?: string;
}

interface DeviceLimitModalProps {
  deviceInfo: DeviceInfo;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DeviceLimitModal = ({ deviceInfo, onConfirm, onCancel }: DeviceLimitModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md border border-border rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-foreground">Device Limit Reached</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-muted-foreground mb-6 text-sm">
          Your account is currently active on another device. CineStream allows only 1 active session at a time.
        </p>

        <div className="bg-secondary/50 rounded-xl p-4 mb-8 border border-border flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-lg text-primary">
            {deviceInfo.device === "mobile" ? <Smartphone size={24} /> : <Monitor size={24} />}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {deviceInfo.browser || "Unknown"} on {deviceInfo.os || "Unknown"}
            </p>
            <p className="text-xs text-muted-foreground">
              Last active: {deviceInfo.last_login || "Unknown"}
            </p>
            {deviceInfo.ip && (
              <p className="text-xs text-muted-foreground">IP: {deviceInfo.ip}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <LogOut size={20} />
          )}
          {loading ? "Logging out other device..." : "Logout other device & Sign In"}
        </button>
      </div>
    </div>
  );
};
