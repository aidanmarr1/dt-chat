"use client";

import type { LinkPreview } from "@/lib/types";

interface LinkPreviewCardProps {
  preview: LinkPreview;
  isOwn: boolean;
}

export default function LinkPreviewCard({ preview, isOwn }: LinkPreviewCardProps) {
  const hostname = (() => {
    try {
      return new URL(preview.url).hostname.replace(/^www\./, "");
    } catch {
      return preview.siteName || "";
    }
  })();

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block mt-2 rounded-lg border overflow-hidden transition-all hover:opacity-80 ${
        isOwn
          ? "border-background/20 hover:bg-background/10"
          : "border-border hover:bg-background"
      }`}
    >
      <div className="flex gap-3 p-2.5">
        {preview.imageUrl && (
          <img
            src={preview.imageUrl}
            alt=""
            className="w-16 h-16 rounded-md object-cover shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="min-w-0 flex-1">
          {(preview.siteName || hostname) && (
            <p className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${
              isOwn ? "text-background/50" : "text-muted"
            }`}>
              {preview.siteName || hostname}
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
      </div>
    </a>
  );
}
