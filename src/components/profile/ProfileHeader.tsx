import { User, MapPin, Copy, Edit2, Check } from "lucide-react";
import { getAvatarUrl } from "@/utils/avatarUrl";
import type { User as AuthUser } from "@supabase/supabase-js";

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
}

export default function ProfileHeader({
  profile, user, editingLocation, locationInput,
  setLocationInput, setEditingLocation, saveLocation, copyUniqueId
}: ProfileHeaderProps) {
  return (
    <div className="relative px-4 md:px-12">
      {/* Clean background */}

      <div className="relative flex flex-col items-center pt-8 pb-4">
        {/* Avatar */}
        <div className="relative mb-4">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-secondary border-4 border-primary/30 flex items-center justify-center overflow-hidden shadow-lg">
            <img src={getAvatarUrl(profile?.avatar_url, profile?.display_name)} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
            <div className="w-3 h-3 rounded-full bg-primary-foreground" />
          </div>
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
  );
}
