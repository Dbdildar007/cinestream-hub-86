import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Eye, EyeOff, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

export default function ChangePasswordSection({ user }: { user: User }) {
  const [show, setShow] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const reset = () => {
    setShow(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    if (!currentPassword.trim()) return setError("Enter your current password.");
    if (newPassword.length < 6) return setError("Min 6 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords don't match.");
    if (currentPassword === newPassword) return setError("Must be different from current.");

    setLoading(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email || "", password: currentPassword,
    });
    if (signInErr) { setLoading(false); return setError("Current password is incorrect."); }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateErr) return setError(updateErr.message);
    toast.success("Password changed!");
    reset();
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <KeyRound className="w-4.5 h-4.5 text-primary" />
        </div>
        <span className="flex-1 text-left text-sm font-medium text-foreground">Change Password</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  const PasswordInput = ({
    value, onChange, placeholder, visible, toggleVisible
  }: { value: string; onChange: (v: string) => void; placeholder: string; visible: boolean; toggleVisible: () => void }) => (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => { onChange(e.target.value); setError(""); }}
        placeholder={placeholder}
        className="w-full bg-background text-foreground placeholder:text-muted-foreground rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border"
      />
      <button
        type="button"
        onClick={toggleVisible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="bg-secondary rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
      </div>
      <PasswordInput value={currentPassword} onChange={setCurrentPassword} placeholder="Current password" visible={showCurrent} toggleVisible={() => setShowCurrent(!showCurrent)} />
      <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="New password (min 6)" visible={showNew} toggleVisible={() => setShowNew(!showNew)} />
      <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm new password" visible={showConfirm} toggleVisible={() => setShowConfirm(!showConfirm)} />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50">
          {loading ? "Changing..." : "Change Password"}
        </button>
        <button onClick={reset} className="px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-sm">Cancel</button>
      </div>
    </motion.div>
  );
}
