import { motion } from "framer-motion";
import { ArrowLeft, User, Bell, Shield, Palette, HelpCircle, Camera, Save, Moon, Sun, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { uploadProductImage } from "@/lib/storage";
import { useTheme } from "@/hooks/useTheme";
import { useAppSetting } from "@/hooks/useAppSettings";
import { validateImageFile } from "@/lib/fileValidation";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: adminPhone } = useAppSetting("admin_phone");
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("crimson-notifications");
    return stored !== null ? stored === "true" : true;
  });
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);

  // Initialize form with current profile data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  // Save notification preference
  useEffect(() => {
    localStorage.setItem("crimson-notifications", String(notifications));
  }, [notifications]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      let newAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        newAvatarUrl = await uploadProductImage(avatarFile, user.id);
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim() || null,
          avatar_url: newAvatarUrl || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });

      setIsEditingProfile(false);
      setAvatarFile(null);
      setAvatarPreview(null);

      // Refresh the page to show updated profile
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({
        title: "Email not available",
        description: "Please sign in again to reset your password.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingPasswordReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset link sent",
        description: `A password reset link was sent to ${user.email}.`,
      });
    } catch (error: any) {
      toast({
        title: "Could not send reset link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleNotificationToggle = (checked: boolean) => {
    setNotifications(checked);
    toast({
      title: checked ? "Notifications enabled" : "Notifications disabled",
      description: checked
        ? "You will receive push notifications."
        : "Push notifications have been turned off.",
    });
  };

  const handleThemeToggle = () => {
    toggleTheme();
    toast({
      title: `${theme === "dark" ? "Light" : "Dark"} mode activated`,
      description: `Switched to ${theme === "dark" ? "light" : "dark"} theme.`,
    });
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl md:text-3xl font-gothic text-foreground">Settings</h1>
        </motion.div>

        {/* Account Section with Profile Editing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-gothic p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-primary" />
            <h2 className="text-lg font-gothic text-foreground">Account</h2>
          </div>
          
          {isEditingProfile ? (
            <div className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <div 
                  className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary cursor-pointer"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                >
                  <img 
                    src={avatarPreview || avatarUrl || "/placeholder.svg"} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <p className="text-xs text-muted-foreground">Tap to change avatar</p>
              </div>
              
              {/* Username Input */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="bg-card border-border"
                />
              </div>
              
              {/* Email (read-only) */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Email</label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-secondary/50 border-border text-muted-foreground"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setUsername(profile?.username || "");
                    setAvatarPreview(null);
                    setAvatarFile(null);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div
                className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => setIsEditingProfile(true)}
              >
                <span className="text-sm text-foreground">Edit Profile</span>
              </div>
              <div className="flex items-center justify-between py-3 px-2 rounded-lg">
                <span className="text-sm text-foreground">Email: {user?.email || "Not set"}</span>
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-border pt-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePasswordReset}
              disabled={isSendingPasswordReset || !user?.email}
            >
              <KeyRound size={16} className="mr-2" />
              {isSendingPasswordReset ? "Sending reset link..." : "Reset Password"}
            </Button>
            <p className="text-xs text-muted-foreground">
              A secure reset link will be sent to your account email.
            </p>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-gothic p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell size={20} className="text-primary" />
            <h2 className="text-lg font-gothic text-foreground">Notifications</h2>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 px-2 rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm text-foreground">Push Notifications</span>
                <span className="text-xs text-muted-foreground">
                  {notifications ? "You'll receive updates" : "Notifications are off"}
                </span>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={handleNotificationToggle}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </motion.div>

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-gothic p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Palette size={20} className="text-primary" />
            <h2 className="text-lg font-gothic text-foreground">Appearance</h2>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 px-2 rounded-lg">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon size={18} className="text-muted-foreground" />
                ) : (
                  <Sun size={18} className="text-muted-foreground" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm text-foreground">Dark Mode</span>
                  <span className="text-xs text-muted-foreground">
                    {theme === "dark" ? "Currently using dark theme" : "Currently using light theme"}
                  </span>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={handleThemeToggle}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </motion.div>

        {/* Privacy & Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-gothic p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-primary" />
            <h2 className="text-lg font-gothic text-foreground">Privacy & Security</h2>
          </div>
          
          <div className="space-y-1">
            <div 
              className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => {
                toast({
                  title: "Privacy Policy",
                  description: "Privacy policy page coming soon.",
                });
              }}
            >
              <span className="text-sm text-foreground">Privacy Policy</span>
            </div>
            <div 
              className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => {
                toast({
                  title: "Terms of Service",
                  description: "Terms of service page coming soon.",
                });
              }}
            >
              <span className="text-sm text-foreground">Terms of Service</span>
            </div>
          </div>
        </motion.div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-gothic p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={20} className="text-primary" />
            <h2 className="text-lg font-gothic text-foreground">Support</h2>
          </div>
          
          <div className="space-y-1">
            <div 
              className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => {
                toast({
                  title: "Help Center",
                  description: "Help center coming soon.",
                });
              }}
            >
              <span className="text-sm text-foreground">Help Center</span>
            </div>
            <div 
              className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => {
                window.open("https://wa.me/923126203644?text=Hi! I need help with Crimson app.", "_blank");
              }}
            >
              <span className="text-sm text-foreground">Contact Support</span>
            </div>
            <div 
              className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => {
                window.open("https://wa.me/923126203644?text=Hi! I want to report a problem with Crimson app.", "_blank");
              }}
            >
              <span className="text-sm text-foreground">Report a Problem</span>
            </div>
          </div>
        </motion.div>

        {/* Sign Out Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </motion.div>

        {/* App Version */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-muted-foreground py-4"
        >
          Crimson Marketplace v1.0.0
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Settings;
