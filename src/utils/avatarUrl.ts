const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face";

export function getAvatarUrl(avatarUrl: string | null | undefined, displayName?: string): string {
  if (avatarUrl) return avatarUrl;
  return DEFAULT_AVATAR;
}
