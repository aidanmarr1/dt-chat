"use client";

import { useEffect, useState } from "react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    // Prevent body scroll while lightbox is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in cursor-zoom-out"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative max-w-[90vw] max-h-[90vh] animate-fade-scale">
        {!loaded && (
          <div className="w-48 h-48 rounded-xl animate-shimmer" />
        )}
        <img
          src={src}
          alt={alt}
          className={`max-w-full max-h-[90vh] object-contain rounded-xl cursor-default shadow-2xl transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0 absolute"}`}
          onClick={(e) => e.stopPropagation()}
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
        {alt && (
          <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/40 whitespace-nowrap">{alt}</p>
        )}
      </div>
    </div>
  );
}
