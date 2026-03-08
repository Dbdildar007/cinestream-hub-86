import { User, MapPin, Copy, Edit2, Check, Camera, Loader2 } from "lucide-react";
import { getAvatarUrl } from "@/utils/avatarUrl";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as AuthUser } from "@supabase/supabase-js";
import AvatarPickerModal from "./AvatarPickerModal";

interface ProfileHeaderProps {
  profile: {
    display_name: string;
    unique_id: string;
    avatar_url: string | null;
    location: string;
  } | null;
  user: AuthUser;
  editingLocation: boolean;
  locationInput: string;
  setLocationInput: (v: string) => void;
  setEditingLocation: (v: boolean) => void;
  saveLocation: () => void;
  copyUniqueId: () => void;
  onAvatarUpdated?: (url: string) => void;
}

export default function ProfileHeader({
  profile, user, editingLocation, locationInput,
  setLocationInput, setEditingLocation, saveLocation, copyUniqueId, onAvatarUpdated
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      onAvatarUpdated?.(avatarUrl);
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="relative px-4 md:px-12">
        <div className="relative flex flex-col items-center pt-8 pb-4">
          {/* Avatar with picker trigger */}
          <div className="relative mb-4 group">
            <button
              onClick={() => setPickerOpen(true)}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-secondary border-4 border-primary/30 flex items-center justify-center overflow-hidden shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-transform hover:scale-105"
            >
              <img
                src={getAvatarUrl(profile?.avatar_url, profile?.display_name)}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </button>

            {/* Upload overlay on hover */}
            <button
              onClick={() => setPickerOpen(true)}
              disabled={uploading}
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Mobile camera badge */}
            <button
              onClick={() => setPickerOpen(true)}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-primary-foreground" />
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Name */}
          <h1 className="text-2xl md:text-3xl font-display tracking-wider text-foreground">
            {profile?.display_name?.toUpperCase() || "USER"}
          </h1>

          {/* Premium badge */}
          <span className="mt-1 px-3 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold tracking-wide">
            PREMIUM MEMBER
          </span>

          {/* Location */}
          <div className="flex items-center gap-1.5 mt-3">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            {editingLocation ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Enter your city"
                  className="bg-secondary text-foreground text-xs px-3 py-1.5 rounded-lg w-36 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveLocation()}
                />
                <button onClick={saveLocation} className="text-primary hover:text-primary/80">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingLocation(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{profile?.location || "Add location"}</span>
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Unique ID chip */}
          {profile?.unique_id && (
            <button
              onClick={copyUniqueId}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
            >
              <span className="text-xs font-mono text-primary font-semibold">{profile.unique_id}</span>
              <Copy className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        userId={user.id}
        currentAvatarUrl={profile?.avatar_url ?? null}
        onAvatarUpdated={(url) => {
          onAvatarUpdated?.(url);
          setPickerOpen(false);
        }}
        onUploadClick={() => {
          setTimeout(() => fileInputRef.current?.click(), 100);
        }}
      />
    </>
  );
}
