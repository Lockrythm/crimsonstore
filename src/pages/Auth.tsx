import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const usernameSchema = z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [signupKey, setSignupKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string; signupKey?: string }>({});
  
  const { signIn, signUp, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Check rate limit lock
  const isLocked = lockedUntil && Date.now() < lockedUntil;

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; username?: string; signupKey?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (!isLogin) {
      try {
        usernameSchema.parse(username);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.username = e.errors[0].message;
        }
      }
      
      if (!signupKey.trim()) {
        newErrors.signupKey = "Signup key is required";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupKeyServer = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-signup-key', {
        body: { key: signupKey },
      });
      if (error || !data?.valid) {
        setErrors(prev => ({ ...prev, signupKey: "Invalid signup key" }));
        return false;
      }
      return true;
    } catch {
      setErrors(prev => ({ ...prev, signupKey: "Could not validate key. Try again." }));
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      toast({
        title: "Too many attempts",
        description: "Please wait 30 seconds before trying again.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          const attempts = failedAttempts + 1;
          setFailedAttempts(attempts);
          if (attempts >= 3) {
            setLockedUntil(Date.now() + 30000);
            setTimeout(() => {
              setLockedUntil(null);
              setFailedAttempts(0);
            }, 30000);
          }
          toast({
            title: "Sign in failed",
            description: "Invalid email or password.",
            variant: "destructive",
          });
        } else {
          setFailedAttempts(0);
          toast({
            title: "Welcome back!",
            description: "You have been signed in.",
          });
          navigate("/");
        }
      } else {
        // Validate signup key server-side
        const keyValid = await validateSignupKeyServer();
        if (!keyValid) {
          setIsSubmitting(false);
          return;
        }

        const { error } = await signUp(email, password, username);
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message.includes("already registered")
              ? "This email is already registered"
              : "Something went wrong. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome to the Coven!",
            description: "Your account has been created.",
          });
          navigate("/");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-gothic text-primary drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
          Crimson
        </h1>
        <p className="text-muted-foreground mt-2">
          {isLogin ? "Enter the crypt" : "Join the coven"}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm card-gothic p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm text-muted-foreground mb-2">
                  <User size={14} className="inline mr-1" /> Username
                </label>
                <Input
                  placeholder="Your dark alias"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-card border-border focus:border-primary"
                  maxLength={20}
                />
                {errors.username && (
                  <p className="text-destructive text-xs mt-1">{errors.username}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm text-muted-foreground mb-2">
                  <Key size={14} className="inline mr-1" /> Signup Key
                </label>
                <Input
                  placeholder="Enter signup key"
                  value={signupKey}
                  onChange={(e) => setSignupKey(e.target.value)}
                  className="bg-card border-border focus:border-primary"
                  maxLength={50}
                />
                {errors.signupKey && (
                  <p className="text-destructive text-xs mt-1">{errors.signupKey}</p>
                )}
              </motion.div>
            </>
          )}

          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              <Mail size={14} className="inline mr-1" /> Email
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border focus:border-primary"
              maxLength={255}
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              <Lock size={14} className="inline mr-1" /> Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-card border-border focus:border-primary pr-10"
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !!isLocked}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-crimson-glow"
          >
            {isLocked
              ? "Too many attempts — wait 30s"
              : isSubmitting
              ? "Loading..."
              : isLogin
              ? "Enter"
              : "Join the Coven"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
              setSignupKey("");
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "New to the coven? Sign up" : "Already a member? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
