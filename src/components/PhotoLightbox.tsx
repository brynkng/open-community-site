"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PhotoData } from "@/components/Photo";

/**
 * Full-screen photo viewer for the album grid: opens on a thumbnail click,
 * shows the full-size image with prev/next arrows, a counter and the caption.
 * Navigates with the on-screen arrows, the ← / → keys, or a horizontal swipe;
 * closes on the ✕, a backdrop click, or Esc. Wraps around at the ends.
 */
export function PhotoLightbox({
  photos,
  index,
  onIndexAction,
  onCloseAction,
}: {
  photos: (PhotoData & { id: number })[];
  index: number;
  onIndexAction: (i: number) => void;
  onCloseAction: () => void;
}) {
  const count = photos.length;
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => onIndexAction((index + delta + count) % count),
    [index, count, onIndexAction],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseAction();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onCloseAction]);

  const photo = photos[index];
  if (!photo) return null;

  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    background: "rgba(255,255,255,.14)",
    color: "#fff",
    fontSize: 30,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      tabIndex={-1}
      onClick={onCloseAction}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
        if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(12px, 3vw, 48px)",
        outline: "none",
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onCloseAction}
        style={{
          position: "absolute",
          top: 14,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "rgba(255,255,255,.14)",
          color: "#fff",
          fontSize: 22,
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      {count > 1 && (
        <button
          type="button"
          aria-label="Previous photo"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          style={{ ...arrowStyle, left: "clamp(8px, 2vw, 28px)" }}
        >
          ‹
        </button>
      )}

      <figure
        onClick={(e) => e.stopPropagation()}
        style={{
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.cap ?? ""}
          style={{
            maxWidth: "100%",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: 8,
            boxShadow: "0 12px 48px rgba(0,0,0,.6)",
          }}
        />
        {photo.cap && (
          <figcaption
            style={{
              color: "rgba(255,255,255,.92)",
              fontSize: 14,
              lineHeight: 1.45,
              textAlign: "center",
              maxWidth: 640,
            }}
          >
            {photo.cap}
          </figcaption>
        )}
        <div style={{ color: "rgba(255,255,255,.55)", fontSize: 12.5 }}>
          {index + 1} / {count}
        </div>
      </figure>

      {count > 1 && (
        <button
          type="button"
          aria-label="Next photo"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          style={{ ...arrowStyle, right: "clamp(8px, 2vw, 28px)" }}
        >
          ›
        </button>
      )}
    </div>
  );
}
