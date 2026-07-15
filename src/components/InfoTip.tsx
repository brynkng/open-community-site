"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A small "?" affordance that reveals a short explanation. Works on touch
 * (tap to toggle) and desktop (hover / keyboard focus). Self-contained so it
 * can be dropped inside a server-rendered chip or label.
 */
export function InfoTip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 15,
          height: 15,
          borderRadius: 999,
          border: "1.5px solid currentColor",
          fontSize: 10,
          fontWeight: 800,
          lineHeight: 1,
          opacity: 0.75,
        }}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "max-content",
            maxWidth: 220,
            padding: "8px 11px",
            borderRadius: 10,
            background: "var(--ds-ink, #1a1a1a)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "normal",
            textTransform: "none",
            lineHeight: 1.4,
            boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
