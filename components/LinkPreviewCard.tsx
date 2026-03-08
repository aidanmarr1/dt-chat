"use client";

import { useState } from "react";
import type { LinkPreview } from "@/lib/types";

interface LinkPreviewCardProps {
  preview: LinkPreview;
  isOwn: boolean;
}

export default function LinkPreviewCard({ preview, isOwn }: LinkPreviewCardProps) {
  const [imgError, setImgError] = useState(false);

  const hostname = (() => {
    try {
      return new URL(preview.url).hostname.replace(/^www\./, "");
    } catch {
      return preview.siteName || "";
    }
  })();

  const safeUrl = preview.url.startsWith("https://") || preview.url.startsWith("http://") ? preview.url : "#";
  const hasImage = !imgError && preview.imageUrl && preview.imageUrl.startsWith("https://");
  const siteLabel = preview.siteName || hostname;

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`block mt-2 max-w-sm rounded-xl border overflow-hidden transition-all hover:scale-[0.98] active:scale-[0.97] hover:shadow-lg ${
        isOwn
          ? "border-background/20 hover:bg-background/10 hover:shadow-black/10"
          : "border-border hover:bg-background hover:shadow-black/5"
      } ${!hasImage ? (isOwn ? "border-l-[3px] border-l-background/40" : "border-l-[3px] border-l-accent") : ""}`}
    >
      {hasImage && (
        <img
          src={preview.imageUrl!}
          alt=""
          className="w-full h-44 object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      )}
      <div className="px-3 py-2.5">
        {siteLabel && (
          <p className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${
            isOwn ? "text-background/50" : "text-muted"
          }`}>
            {siteLabel}
          </p>
        )}
        {preview.title && (
          <p className={`text-sm font-medium leading-tight ${
            isOwn ? "text-background" : "text-foreground"
          }`} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className={`text-xs mt-0.5 leading-snug ${
            isOwn ? "text-background/60" : "text-muted"
          }`} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}
