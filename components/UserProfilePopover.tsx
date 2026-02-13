"use client";

import { useState, useEffect, useRef } from "react";
import Avatar from "./Avatar";
import type { UserProfile } from "@/lib/types";

interface UserProfilePopoverProps {
  userId: string;
  currentUserId?: string;
  onClose: () => void;
}

export default function UserProfilePopover({ userId, currentUserId, onClose }: UserProfilePopoverProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  const isOwn = userId === currentUserId;

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.profile);
        setBioValue(data.profile?.bio || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (editingBio && bioRef.current) bioRef.current.focus();
  }, [editingBio]);

  async function saveBio() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioValue.trim() || null }),
      });
      if (res.ok) {
        setProfile((p) => p ? { ...p, bio: bioValue.trim() || null } : p);
        setEditingBio(false);
      }
    } catch {
      // ignore
    }
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          ref={ref}
          className="w-full max-w-xs bg-surface border border-border rounded-2xl shadow-2xl animate-fade-scale overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : profile ? (
            <>
              {/* Header */}
              <div className="p-5 pb-3 flex flex-col items-center gap-3 border-b border-border">
                <Avatar displayName={profile.displayName} userId={profile.id} avatarId={profile.avatarId} size="lg" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground font-heading">{profile.displayName}</h3>
                  <p className="text-xs text-muted">{profile.email}</p>
                </div>
              </div>

              {/* Bio */}
              <div className="px-5 py-3 border-b border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Bio</p>
                {editingBio ? (
                  <div>
                    <textarea
                      ref={bioRef}
                      value={bioValue}
                      onChange={(e) => {
                        if (e.target.value.length <= 200) setBioValue(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent resize-none"
                      rows={3}
                      placeholder="Tell people about yourself..."
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-muted">{bioValue.length}/200</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setEditingBio(false); setBioValue(profile.bio || ""); }} className="text-xs text-muted hover:text-foreground px-2 py-1">Cancel</button>
                        <button onClick={saveBio} disabled={saving} className="text-xs text-accent hover:underline px-2 py-1 disabled:opacity-50">
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    <p className="text-sm text-foreground/80 min-h-[1.25rem]">
                      {profile.bio || <span className="text-muted italic">{isOwn ? "Add a bio..." : "No bio yet"}</span>}
                    </p>
                    {isOwn && (
                      <button
                        onClick={() => setEditingBio(true)}
                        className="text-[10px] text-accent hover:underline mt-1"
                      >
                        {profile.bio ? "Edit" : "Add bio"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="px-5 py-3 flex gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">Joined</p>
                  <p className="text-sm text-foreground">
                    {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">Messages</p>
                  <p className="text-sm text-foreground">{profile.messageCount.toLocaleString()}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-muted">User not found</div>
          )}
        </div>
      </div>
    </>
  );
}
