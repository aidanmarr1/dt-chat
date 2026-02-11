"use client";

import { useState } from "react";
import { AVATAR_PRESETS } from "@/lib/avatars";

interface AvatarPickerProps {
  currentAvatarId: string | null;
  onSelect: (avatarId: string | null) => void;
}

export default function AvatarPicker({ currentAvatarId, onSelect }: AvatarPickerProps) {
  const [saving, setSaving] = useState<string | null>(null);

  async function handleSelect(avatarId: string | null) {
    if (avatarId === currentAvatarId) return;
    setSaving(avatarId);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId }),
      });
      if (res.ok) {
        onSelect(avatarId);
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="max-h-56 overflow-y-auto pr-0.5 -mr-0.5">
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 sm:gap-1">
        {/* None / initials option */}
        <button
          onClick={() => handleSelect(null)}
          className={`aspect-square rounded-full border-2 flex items-center justify-center text-[8px] font-bold text-muted transition-all hover:scale-110 active:scale-95 ${
            currentAvatarId === null
              ? "border-accent ring-2 ring-accent/30 bg-accent/5"
              : "border-border hover:border-muted bg-surface"
          }`}
          title="Use initials"
        >
          AB
        </button>
        {AVATAR_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelect(preset.id)}
            disabled={saving !== null}
            className={`aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 ${
              saving === preset.id ? "opacity-50 animate-pulse" : ""
            } ${
              currentAvatarId === preset.id
                ? "border-accent ring-2 ring-accent/30 scale-105"
                : "border-transparent hover:border-muted"
            }`}
            title={preset.id}
          >
            {preset.svg}
          </button>
        ))}
      </div>
    </div>
  );
}
