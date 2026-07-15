"use client";

import { useEffect, useRef } from "react";

type Delay = 0 | 1 | 2 | 3;

/**
 * IntersectionObserver-driven scroll reveal. Adds `.ds-in` to the wrapper once
 * it's ~12% visible, which flips the `.ds-rv` CSS transition (globals.css).
 * The reveal styles themselves are only defined inside
 * `@media (prefers-reduced-motion: no-preference)`, so with reduced motion the
 * element has no hidden state to begin with — content is visible immediately
 * whether or not this observer ever fires.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
  style,
}: {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  delay?: Delay;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("ds-in");
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const delayClass = delay ? ` ds-d${delay}` : "";
  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref}
      className={`ds-rv${delayClass} ${className}`}
      style={style}
    >
      {children}
    </Component>
  );
}
