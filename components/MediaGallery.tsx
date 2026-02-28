"use client";

import { useState, useEffect } from "react";
import ImageLightbox from "./ImageLightbox";
import { formatFileSize } from "@/lib/file-utils";

interface MediaItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  displayName: string;
  createdAt: string;
}

interface MediaGalleryProps {
  onClose: () => void;
}

export default function MediaGallery({ onClose }: MediaGalleryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"images" | "files">("images");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/media")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.media || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const images = items.filter((i) => i.fileType?.startsWith("image/"));
  const files = items.filter((i) => !i.fileType?.startsWith("image/"));

  function getFileUrl(item: MediaItem) {
    return item.filePath.startsWith("https://") || item.filePath.startsWith("http://")
      ? item.filePath
      : `/api/files/${item.filePath}`;
  }

  function getFileLabel(type: string) {
    if (type === "application/pdf") return "PDF";
    if (type.includes("word")) return "DOC";
    if (type.includes("excel") || type.includes("spreadsheet")) return "XLS";
    if (type.includes("powerpoint") || type.includes("presentation")) return "PPT";
    if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return "ZIP";
    if (type.startsWith("audio/")) return "AUD";
    return "FILE";
  }

  function getFileLabelColor(type: string) {
    if (type === "application/pdf") return "text-red-400";
    if (type.includes("word") || type === "text/plain") return "text-blue-400";
    if (type.includes("excel") || type.includes("spreadsheet")) return "text-green-400";
    if (type.includes("powerpoint") || type.includes("presentation")) return "text-orange-400";
    if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return "text-yellow-400";
    if (type.startsWith("audio/")) return "text-purple-400";
    return "text-muted";
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <h2 className="text-base font-semibold font-heading">Media</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="relative flex border-b border-border">
          <div
            className="absolute bottom-0 h-[2px] bg-accent rounded-full"
            style={{
              width: "50%",
              transform: tab === "images" ? "translateX(0%)" : "translateX(100%)",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <button
            onClick={() => setTab("images")}
            className={`flex-1 py-2.5 text-sm font-medium ${tab === "images" ? "text-accent" : "text-muted hover:text-foreground"}`}
            style={{ transition: "color 0.2s ease" }}
          >
            Images ({images.length})
          </button>
          <button
            onClick={() => setTab("files")}
            className={`flex-1 py-2.5 text-sm font-medium ${tab === "files" ? "text-accent" : "text-muted hover:text-foreground"}`}
            style={{ transition: "color 0.2s ease" }}
          >
            Files ({files.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-3 gap-1 p-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="aspect-square rounded-lg animate-shimmer" />
              ))}
            </div>
          ) : tab === "images" ? (
            images.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <p className="text-sm">No images shared yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 p-2">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square relative rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => setLightboxSrc(getFileUrl(img))}
                  >
                    <img
                      src={getFileUrl(img)}
                      alt={img.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white truncate">{img.displayName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-sm">No files shared yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={getFileUrl(file)}
                  download={file.fileName}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-[10px] font-bold shrink-0 ${getFileLabelColor(file.fileType)}`}>
                    {getFileLabel(file.fileType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                    <p className="text-[10px] text-muted">
                      {file.displayName} &middot; {formatFileSize(file.fileSize)} &middot; {new Date(file.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="Image" onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
