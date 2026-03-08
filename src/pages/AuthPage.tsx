import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, MailOpen, Loader2, CheckCircle, XCircle } from "lucide-react";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { useAuth } from "@/hooks/useAuth";
import { useDeviceSession } from "@/hooks/useDeviceSession";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DeviceLimitModal } from "@/components/DeviceLimitModal";
import { supabase } from "@/integrations/supabase/client";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [deviceConflict, setDeviceConflict] = useState<any>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { signIn, signUp, user, signOut } = useAuth();
  const navigate = useNavigate();

  const { registerDevice } = useDeviceSession(pendingUserId || user?.id, useCallback(() => {}, []));

  useEffect(() => {
    if (user && !deviceConflict && !loading && !pendingUserId) {
      navigate("/", { replace: true });
    }
  }, [user, navigate, deviceConflict, loading, pendingUserId]);

  const handleDeviceCheck = async (userId: string) => {
    setPendingUserId(userId);
    const result = await registerDevice(false, userId);

    if (result.status === "conflict") {
      setDeviceConflict(result.existing_device);
      return false;
    }

    if (result.status !== "ok") {
      toast.error("Unable to verify active session. Please try again.");
      await signOut();
      setPendingUserId(null);
      return false;
    }

    setPendingUserId(null);
    return true;
  };

  const handleForceLogin = async () => {
    if (!pendingUserId) return;

    const result = await registerDevice(true, pendingUserId);
    if (result.status !== "ok") {
      toast.error("Couldn't switch active device. Please try again.");
      return;
    }

    setDeviceConflict(null);
    setPendingUserId(null);
    toast.success("Welcome back! Other device has been logged out.");
    navigate("/");
  };

  const handleCancelConflict = async () => {
    setDeviceConflict(null);
    setPendingUserId(null);
    // Only sign out locally — do NOT clear active_session_id in DB (Device 1 owns it)
    await supabase.auth.signOut({ scope: 'local' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { data, error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast.error("Please verify your email first.");
          setShowVerification(true);
        } else {
          toast.error(error.message);
        }
      } else if (data?.user) {
        const canProceed = await handleDeviceCheck(data.user.id);
        if (canProceed) {
          toast.success("Welcome back!");
          navigate("/");
        }
      }
    } else {
      if (usernameStatus === "taken") {
        toast.error("This username is already taken. Please choose another.");
        setLoading(false);
        return;
      }
      if (usernameStatus !== "available") {
        toast.error("Please wait for username availability check.");
        setLoading(false);
        return;
      }
      const { data, error } = await signUp(email, password, displayName);
      if (error) {
        toast.error(error.message);
      } else if (data?.user && data.user.identities && data.user.identities.length === 0) {
        toast.error("This email is already registered. Please sign in instead.", { duration: 5000 });
        setIsLogin(true);
      } else {
        setShowVerification(true);
      }
    }
    setLoading(false);
  };

  // Device conflict modal
  if (deviceConflict) {
    return (
      <DeviceLimitModal
        deviceInfo={deviceConflict}
        onConfirm={handleForceLogin}
        onCancel={handleCancelConflict}
      />
    );
  }

  // Email verification screen
  if (showVerification) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background flex items-center justify-center px-4 pt-16 pb-24"
      >
        <div className="w-full max-w-sm text-center">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
            className="mx-auto w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-6"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <MailOpen className="w-10 h-10 text-primary" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-display tracking-wider text-foreground mb-3"
          >
            CHECK YOUR EMAIL
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground mb-2 leading-relaxed"
          >
            We've sent a verification link to
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-sm font-semibold text-primary mb-6 break-all"
          >
            {email}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-xl p-4 mb-6 text-left space-y-3"
          >
            {[
              { step: 1, text: "Open your email inbox" },
              { step: 2, text: "Click the verification link" },
              { step: 3, text: "You'll be redirected here automatically" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{item.step}</span>
                </div>
                <p className="text-sm text-foreground/80">{item.text}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-2 text-muted-foreground mb-6"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Waiting for verification...</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="space-y-3"
          >
            <button
              onClick={() => { setShowVerification(false); setIsLogin(true); }}
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 rounded-lg font-semibold text-sm transition-colors"
            >
              Back to Sign In
            </button>
            <p className="text-xs text-muted-foreground">
              Didn't receive it? Check your spam folder or try signing up again.
            </p>
          </motion.div>
        </div>
      </motion.div>
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
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="text-4xl font-display tracking-wider text-primary mb-2"
          >
            CINESTREAM
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-muted-foreground text-sm"
          >
            {isLogin ? "Sign in to continue" : "Create your account"}
          </motion.p>
        </div>

        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-card rounded-xl p-6 border border-border space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                key="name-field"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\s{2,}/g, ' ');
                      setDisplayName(val);
                      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
                      if (val.trim().length < 2) {
                        setUsernameStatus("idle");
                        return;
                      }
                      setUsernameStatus("checking");
                      usernameTimerRef.current = setTimeout(async () => {
                        const { data } = await supabase
                          .from("profiles")
                          .select("id")
                          .ilike("display_name", val.trim())
                          .limit(1);
                        setUsernameStatus(data && data.length > 0 ? "taken" : "available");
                      }, 500);
                    }}
                    required={!isLogin}
                    className={`w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 ${
                      usernameStatus === "taken" ? "focus:ring-destructive/50 ring-1 ring-destructive/30" 
                      : usernameStatus === "available" ? "focus:ring-green-500/50 ring-1 ring-green-500/30" 
                      : "focus:ring-primary/50"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                    {usernameStatus === "available" && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {usernameStatus === "taken" && <XCircle className="w-4 h-4 text-destructive" />}
                  </div>
                </div>
                {usernameStatus === "taken" && (
                  <p className="text-xs text-destructive mt-1 pl-1">This name is already taken. Try another.</p>
                )}
                {usernameStatus === "available" && (
                  <p className="text-xs text-green-500 mt-1 pl-1">Username available ✓</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
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

          {!isLogin && <PasswordStrengthIndicator password={password} />}

          {isLogin && (
            <div className="text-right -mt-2">
              <button
                type="button"
                disabled={forgotLoading}
                onClick={async () => {
                  if (!email) {
                    toast.error("Please enter your email address first.");
                    return;
                  }
                  setForgotLoading(true);
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  setForgotLoading(false);
                  if (error) {
                    toast.error(error.message);
                  } else {
                    toast.success("Password reset link sent! Check your email.");
                  }
                }}
                className="text-xs text-primary hover:underline font-medium disabled:opacity-50"
              >
                {forgotLoading ? "Sending..." : "Forgot Password?"}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : isLogin ? "Sign In" : "Create Account"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </motion.form>
      </div>
    </motion.div>
  );
}
