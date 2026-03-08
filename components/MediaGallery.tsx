"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ImageLightbox from "./ImageLightbox";
import { formatFileSize } from "@/lib/file-utils";
import JSZip from "jszip";

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

type DownloadMode = "all" | "images" | "files";

function dedupeFileName(name: string, existing: Set<string>): string {
  if (!existing.has(name)) return name;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let n = 2;
  while (existing.has(`${base} (${n})${ext}`)) n++;
  return `${base} (${n})${ext}`;
}

export default function MediaGallery({ onClose }: MediaGalleryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"images" | "files">("images");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number; mode: DownloadMode } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [isClosing, onClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  // Close download menu on outside click
  useEffect(() => {
    if (!showDownloadMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDownloadMenu]);

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

  function getDownloadUrl(item: MediaItem) {
    return `/api/files/${item.filePath}?download=1`;
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

  async function downloadSingle(item: MediaItem) {
    try {
      const res = await fetch(getDownloadUrl(item));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  }

  async function bulkDownload(mode: DownloadMode) {
    setShowDownloadMenu(false);
    const itemsToDownload = mode === "images" ? images : mode === "files" ? files : [...images, ...files];
    if (itemsToDownload.length === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setDownloadProgress({ current: 0, total: itemsToDownload.length, mode });

    const zip = new JSZip();
    const usedNames = new Set<string>();
    let completed = 0;
    const BATCH_SIZE = 3;

    try {
      for (let i = 0; i < itemsToDownload.length; i += BATCH_SIZE) {
        if (controller.signal.aborted) return;
        const batch = itemsToDownload.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (item) => {
            const res = await fetch(getDownloadUrl(item), { signal: controller.signal });
            return { item, blob: await res.blob() };
          })
        );
        for (const { item, blob } of results) {
          if (controller.signal.aborted) return;
          const isImage = item.fileType?.startsWith("image/");
          let folder = "";
          if (mode === "all") folder = isImage ? "Images/" : "Files/";
          const name = dedupeFileName(item.fileName, usedNames);
          usedNames.add(name);
          zip.file(`${folder}${name}`, blob);
          completed++;
          setDownloadProgress({ current: completed, total: itemsToDownload.length, mode });
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipName = mode === "all" ? "D&T Media" : mode === "images" ? "D&T Images" : "D&T Files";
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${zipName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    } finally {
      setDownloadProgress(null);
      abortRef.current = null;
    }
  }

  function cancelDownload() {
    abortRef.current?.abort();
    setDownloadProgress(null);
    abortRef.current = null;
  }

  const totalCount = images.length + files.length;

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm ${isClosing ? "animate-fade-out" : ""}`} onClick={handleClose} />
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <h2 className="text-base font-semibold font-heading">Media</h2>
          </div>
          <div className="flex items-center gap-1">
            {/* Download button */}
            {totalCount > 0 && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                {showDownloadMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                    <button
                      onClick={() => bulkDownload("all")}
                      className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between"
                    >
                      <span>All Media & Files</span>
                      <span className="text-xs text-muted">{totalCount}</span>
                    </button>
                    {images.length > 0 && (
                      <button
                        onClick={() => bulkDownload("images")}
                        className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between border-t border-border/50"
                      >
                        <span>Images Only</span>
                        <span className="text-xs text-muted">{images.length}</span>
                      </button>
                    )}
                    {files.length > 0 && (
                      <button
                        onClick={() => bulkDownload("files")}
                        className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between border-t border-border/50"
                      >
                        <span>Files Only</span>
                        <span className="text-xs text-muted">{files.length}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
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
        <div className="flex-1 overflow-y-auto relative">
          {/* Download progress overlay */}
          {downloadProgress && (
            <div className="absolute inset-0 z-10 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <p className="text-sm font-medium">
                Downloading {downloadProgress.current} of {downloadProgress.total}...
              </p>
              <div className="w-full max-w-xs bg-surface rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                />
              </div>
              <button
                onClick={cancelDownload}
                className="mt-2 px-4 py-1.5 text-sm rounded-lg bg-surface border border-border hover:bg-white/5 transition-colors active:scale-95"
              >
                Cancel
              </button>
            </div>
          )}

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
                    {/* Per-image download button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadSingle(img); }}
                      className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 active:scale-90 z-10 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
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
                  href={getDownloadUrl(file)}
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
