"use client";

import { getInitials, getAvatarColor } from "@/lib/avatar";
import { getAvatarById } from "@/lib/avatars";

interface AvatarProps {
  displayName: string;
  userId: string;
  avatarId?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
}

const sizeClasses = {
  xs: "w-4 h-4 text-[7px]",
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-12 h-12 text-sm",
};

export default function Avatar({ displayName, userId, avatarId, size = "md" }: AvatarProps) {
  const preset = avatarId ? getAvatarById(avatarId) : undefined;

  if (preset) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full shrink-0 ring-1 ring-border hover:ring-2 hover:ring-accent hover:shadow-[0_0_8px_rgba(var(--acc-rgb),0.2)] transition-all duration-200 overflow-hidden`}
        title={displayName}
      >
        {preset.svg}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ring-1 ring-border hover:ring-2 hover:ring-accent hover:shadow-[0_0_8px_rgba(var(--acc-rgb),0.2)] transition-all duration-200`}
      style={{ backgroundColor: getAvatarColor(userId) }}
      title={displayName}
    >
      {getInitials(displayName)}
    </div>
  );
}
