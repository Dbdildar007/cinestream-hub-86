import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check current hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/", { replace: true }), 2000);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-display text-foreground mb-2">Invalid Link</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This link is invalid or has expired. Please request a new password reset.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="text-primary hover:underline text-sm font-medium"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">Password Updated!</h2>
          <p className="text-sm text-muted-foreground">Redirecting you home...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex items-center justify-center px-4 pt-16 pb-24"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display tracking-wider text-primary mb-2">
            RESET PASSWORD
          </h1>
          <p className="text-muted-foreground text-sm">Enter your new password</p>
        </div>

        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-card rounded-xl p-6 border border-border space-y-4"
        >
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>

          <PasswordStrengthIndicator password={password} />

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </motion.form>
      </div>
    </motion.div>
  );
}
