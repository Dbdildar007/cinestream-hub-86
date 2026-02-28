import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User ,MailCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast.error(error.message);
      } else {
        setIsVerificationSent(true);
        toast.success("Account created! Please check your email to verify.");
      }
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex items-center justify-center px-4 pt-16"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display tracking-wider text-primary mb-2">CINESTREAM</h1>
          <p className="text-muted-foreground text-sm">
            {isVerificationSent ? "Verify your account" : (isLogin ? "Sign in to continue" : "Create your account")}
          </p>
        </div>

        {isVerificationSent ? (
        /* --- NEW VERIFICATION UI --- */
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-xl p-8 border border-border text-center space-y-6 shadow-xl"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MailCheck className="w-10 h-10 text-primary animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
            <p className="text-muted-foreground text-sm leading-relaxed px-2">
              We've sent a verification link to <br/>
              <span className="text-primary font-medium font-mono">{email}</span>
            </p>
          </div>

          <div className="pt-4 space-y-4">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-bold transition-all active:scale-95"
            >
              I've Verified My Email
            </button>
            <button 
              onClick={() => setIsVerificationSent(false)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              ← Back to Sign Up
            </button>
          </div>
        </motion.div>
      ) : (
        
       <>
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="bg-card rounded-xl p-6 md:p-8 border border-border space-y-4 shadow-lg"
          >
            {/* ... Your existing input fields (Display Name, Email, Password) ... */}
          </motion.form>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </>
          )}

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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
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
