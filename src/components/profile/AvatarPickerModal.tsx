import { useState } from "react";
import { X, Camera, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar4 from "@/assets/avatars/avatar-4.png";
import avatar5 from "@/assets/avatars/avatar-5.png";
import avatar6 from "@/assets/avatars/avatar-6.png";
import avatar7 from "@/assets/avatars/avatar-7.png";
import avatar8 from "@/assets/avatars/avatar-8.png";
import avatar9 from "@/assets/avatars/avatar-9.png";
import avatar10 from "@/assets/avatars/avatar-10.png";
import avatar11 from "@/assets/avatars/avatar-11.png";
import avatar12 from "@/assets/avatars/avatar-12.png";

const PRESET_AVATARS = [
  { id: "avatar-1", src: avatar1, label: "Guy" },
  { id: "avatar-2", src: avatar2, label: "Girl" },
  { id: "avatar-3", src: avatar3, label: "Beardy" },
  { id: "avatar-4", src: avatar4, label: "Curly" },
  { id: "avatar-5", src: avatar5, label: "Cool" },
  { id: "avatar-6", src: avatar6, label: "Doggo" },
  { id: "avatar-7", src: avatar7, label: "Turban" },
  { id: "avatar-8", src: avatar8, label: "Robot" },
  { id: "avatar-9", src: avatar9, label: "Afro" },
  { id: "avatar-10", src: avatar10, label: "Grandma" },
  { id: "avatar-11", src: avatar11, label: "Hero" },
  { id: "avatar-12", src: avatar12, label: "Cat" },
];

interface AvatarPickerModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentAvatarUrl: string | null;
  onAvatarUpdated: (url: string) => void;
  onUploadClick: () => void;
}

export default function AvatarPickerModal({
  open, onClose, userId, currentAvatarUrl, onAvatarUpdated, onUploadClick
}: AvatarPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSelectPreset = async (avatar: typeof PRESET_AVATARS[0]) => {
    setSelectedId(avatar.id);
    setSaving(true);
    try {
      // Use the bundled asset URL directly as avatar_url
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatar.src })
        .eq("user_id", userId);

      if (error) throw error;

      onAvatarUpdated(avatar.src);
      toast.success("Avatar updated!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update avatar");
    } finally {
      setSaving(false);
      setSelectedId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-display tracking-wider text-foreground">Choose Avatar</h2>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Upload option */}
            <div className="px-4 pt-4">
              <button
                onClick={() => { onClose(); onUploadClick(); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Upload Photo</p>
                  <p className="text-xs text-muted-foreground">Use your own picture</p>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">OR PICK AN ICON</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Avatar grid */}
            <div className="px-4 pb-5 grid grid-cols-4 gap-3">
              {PRESET_AVATARS.map((avatar) => {
                const isSelected = selectedId === avatar.id;
                const isCurrent = currentAvatarUrl === avatar.src;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectPreset(avatar)}
                    disabled={saving}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      isCurrent
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "hover:bg-secondary/80"
                    }`}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-secondary border-2 border-border">
                      <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{avatar.label}</span>
                    
                    {/* Current indicator */}
                    {isCurrent && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}

                    {/* Loading on selected */}
                    {isSelected && saving && (
                      <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
