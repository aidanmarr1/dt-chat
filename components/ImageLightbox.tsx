"use client";

import { useEffect, useState, useCallback } from "react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
  images?: { src: string; alt: string }[];
  initialIndex?: number;
}

export default function ImageLightbox({ src, alt, onClose, images, initialIndex = 0 }: ImageLightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(false);

  const hasMultiple = images && images.length > 1;
  const currentSrc = hasMultiple ? images[currentIndex].src : src;
  const currentAlt = hasMultiple ? images[currentIndex].alt : alt;

  const goNext = useCallback(() => {
    if (!hasMultiple) return;
    setLoaded(false);
    setZoom(false);
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [hasMultiple, images?.length]);

  const goPrev = useCallback(() => {
    if (!hasMultiple) return;
    setLoaded(false);
    setZoom(false);
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [hasMultiple, images?.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in cursor-zoom-out"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Previous button */}
      {hasMultiple && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-all active:scale-90 shadow-lg cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {hasMultiple && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-all active:scale-90 shadow-lg cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      <div className={`relative max-w-[90vw] max-h-[90vh] animate-fade-scale ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}>
        {!loaded && (
          <div className="w-48 h-48 rounded-xl animate-shimmer" />
        )}
        <img
          src={currentSrc}
          alt={currentAlt}
          className={`max-w-full object-contain rounded-xl cursor-default shadow-2xl transition-all duration-300 ${loaded ? "opacity-100" : "opacity-0 absolute"} ${zoom ? "max-h-[95vh] scale-110" : "max-h-[85vh]"}`}
          onClick={(e) => { e.stopPropagation(); setZoom(!zoom); }}
          onLoad={() => setLoaded(true)}
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:-top-3 sm:-right-3 w-10 h-10 sm:w-8 sm:h-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90 shadow-lg cursor-pointer z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Image counter + filename */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {hasMultiple && (
            <span className="text-xs text-white/60 font-medium tabular-nums">
              {currentIndex + 1} of {images.length}
            </span>
          )}
          {currentAlt && (
            <span className="text-xs text-white/40 whitespace-nowrap max-w-[200px] truncate">{currentAlt}</span>
          )}
        </div>

        {/* Thumbnail strip for multi-image */}
        {hasMultiple && images.length <= 10 && (
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setLoaded(false); setZoom(false); setCurrentIndex(i); }}
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  i === currentIndex ? "border-white scale-110 shadow-lg" : "border-white/20 opacity-50 hover:opacity-80"
                }`}
              >
                <img src={img.src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
