"use client";

import { useState } from "react";
import type { LinkPreview } from "@/lib/types";

interface LinkPreviewCardProps {
  preview: LinkPreview;
  isOwn: boolean;
}

export default function LinkPreviewCard({ preview, isOwn }: LinkPreviewCardProps) {
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const hostname = (() => {
    try {
      return new URL(preview.url).hostname.replace(/^www\./, "");
    } catch {
      return preview.siteName || "";
    }
  })();

  const faviconUrl = (() => {
    try {
      const u = new URL(preview.url);
      return `${u.origin}/favicon.ico`;
    } catch {
      return null;
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
      className={`group/link block mt-2 max-w-sm rounded-xl border overflow-hidden transition-all duration-200 hover:brightness-[1.02] active:scale-[0.99] hover:shadow-lg hover:-translate-y-0.5 ${
        isOwn
          ? "border-background/20 hover:bg-background/10 hover:shadow-black/15"
          : "border-border hover:bg-background hover:shadow-accent/10"
      } ${!hasImage ? (isOwn ? "border-l-[3px] border-l-background/40" : "border-l-[3px] border-l-accent") : ""}`}
    >
      {hasImage && (
        <div className="relative overflow-hidden">
          <img
            src={preview.imageUrl!}
            alt=""
            className="w-full h-44 object-cover animate-fade-in transition-transform duration-300 group-hover/link:scale-[1.02]"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity" />
        </div>
      )}
      <div className="px-3 py-2.5">
        {siteLabel && (
          <p className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-1.5 ${
            isOwn ? "text-background/50" : "text-muted"
          }`}>
            {faviconUrl && !faviconError && (
              <img
                src={faviconUrl}
                alt=""
                className="w-3 h-3 rounded-sm"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setFaviconError(true)}
              />
            )}
            {siteLabel}
            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
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
