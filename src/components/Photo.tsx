import type { BrandKey } from "@/lib/brands";

/**
 * Gradient recipes per brand, used as placeholder art when a tile has no real
 * `src` (ports `PH_GRADS` from the design prototype's shared.jsx). `hue`
 * varies the recipe so a row of placeholder tiles doesn't look identical.
 */
const PH_GRADS: Record<BrandKey, (hue: number) => string> = {
  ss: (h) =>
    `linear-gradient(${135 + h}deg, oklch(0.72 0.13 ${40 + h * 0.8}), oklch(0.5 0.14 ${25 + h * 0.6}))`,
  nb: (h) =>
    `linear-gradient(${135 + (h % 40)}deg, oklch(0.62 0.09 ${h + 30}), oklch(0.38 0.1 ${h}))`,
  ft: (h) =>
    `linear-gradient(${150 + (h % 30)}deg, oklch(0.66 0.11 ${h + 20}), oklch(0.42 0.11 ${h - 10}))`,
};

export interface PhotoData {
  /** Real image path, e.g. `/photos/dinner-couch.jpg`. Omit to show the gradient placeholder. */
  src?: string;
  /** Caption — shown as overlay text when there's no `src`, and as alt text when there is. */
  cap?: string;
  /** Brand whose gradient recipe to use for the placeholder (ignored once `src` is set). */
  brand?: BrandKey;
  /** Varies the placeholder gradient's hue so a set of tiles doesn't look identical. */
  hue?: number;
}

/**
 * A photo/grain tile: renders a real `<img>` when `photo.src` is present,
 * otherwise a brand-tinted gradient with a caption overlay (ports `Photo` +
 * `PH_GRADS` from the design prototype).
 */
export function Photo({
  photo,
  className,
  style,
}: {
  photo: PhotoData;
  className?: string;
  style?: React.CSSProperties;
}) {
  const background = photo.src
    ? undefined
    : PH_GRADS[photo.brand ?? "ss"](photo.hue ?? 10);

  return (
    <figure
      className={`ds-ph ${className ?? ""}`}
      style={{ margin: 0, background, ...style }}
    >
      {photo.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.src} alt={photo.cap ?? ""} />
      ) : (
        <figcaption
          className="ds-ph-label"
          style={{ position: "relative", zIndex: 1 }}
        >
          {photo.cap}
        </figcaption>
      )}
    </figure>
  );
}
