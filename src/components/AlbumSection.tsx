"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import type { Album, Program } from "@/db/schema";
import {
  uploadPhotoAction,
  createAlbumAction,
  type FormState,
} from "@/app/community/actions";
import { brandForKind } from "@/lib/brands";
import { Photo, type PhotoData } from "@/components/Photo";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { Reveal } from "@/components/Reveal";
import { TurnstileWidget } from "@/components/TurnstileWidget";

/** A photo group with `Photo`-ready data (image URL already resolved server-side). */
export type ResolvedPhotoGroup = {
  date: string;
  photos: (PhotoData & { id: number })[];
};

export type AlbumWithPhotos = {
  album: Album;
  groups: ResolvedPhotoGroup[];
};

function formatGroupDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Shared photo album section (ports `AlbumSection` from the design prototype's
 * `shared.jsx`): album tabs with counts, a date-grouped photo grid, a real
 * multipart upload form → `uploadPhotoAction`, and an inline new-album form →
 * `createAlbumAction`. Both writes are Turnstile-gated, mirroring `RsvpWidget`.
 */
export function AlbumSection({
  programId,
  kind,
  albums,
}: {
  programId: number;
  kind: Program["kind"];
  albums: AlbumWithPhotos[];
}) {
  const brand = brandForKind(kind);
  const [activeId, setActiveId] = useState<number | null>(
    albums.find((a) => a.album.main)?.album.id ?? albums[0]?.album.id ?? null,
  );
  const active =
    albums.find((a) => a.album.id === activeId) ?? albums[0] ?? null;

  // Flattened photos for the active album (display order across date groups),
  // powering the full-screen viewer opened from a thumbnail.
  const flatPhotos = active ? active.groups.flatMap((g) => g.photos) : [];
  const indexById = new Map(flatPhotos.map((p, i) => [p.id, i] as const));
  const [viewer, setViewer] = useState<number | null>(null);

  const [naming, setNaming] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [createToken, setCreateToken] = useState("");
  const [createState, createFormAction, createPending] = useActionState<
    FormState,
    FormData
  >(createAlbumAction, null);

  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [uploadToken, setUploadToken] = useState("");
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const [uploadState, uploadFormAction, uploadPending] = useActionState<
    FormState,
    FormData
  >(uploadPhotoAction, null);

  useEffect(() => {
    if (createState?.ok) {
      setNewAlbumName("");
      setNaming(false);
    }
  }, [createState]);

  useEffect(() => {
    if (uploadState?.ok) {
      uploadFormRef.current?.reset();
      setCaption("");
      setUploading(false);
    }
  }, [uploadState]);

  return (
    <div data-brand={brand.brandKey}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 6,
          flexWrap: "wrap",
        }}
      >
        <h2
          className="ds-section-title"
          style={{ fontFamily: brand.displayFontVar, margin: 0 }}
        >
          Shared album
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="ds-btn ghost"
            style={{
              color: `var(--brand-accent, ${brand.accent})`,
              padding: "9px 16px",
            }}
            onClick={() => setNaming((n) => !n)}
          >
            {naming ? "Cancel" : "+ New album"}
          </button>
          <button
            type="button"
            className="ds-btn"
            style={{
              background: `var(--brand-accent, ${brand.accent})`,
              padding: "9px 16px",
            }}
            onClick={() => setUploading((u) => !u)}
            disabled={!active}
          >
            {uploading ? "Cancel" : "⬆ Add photos"}
          </button>
        </div>
      </div>
      <p className="ds-section-sub" style={{ marginBottom: 14 }}>
        No account needed — photos go straight in.
      </p>

      {naming && (
        <form
          action={createFormAction}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 14,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input type="hidden" name="programId" value={programId} />
          <input
            className="ds-field"
            style={{ maxWidth: 300 }}
            placeholder='Album name, e.g. "Snow Night"'
            name="name"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            autoFocus
          />
          <TurnstileWidget onVerifyAction={setCreateToken} />
          <input
            type="hidden"
            name="cf-turnstile-response"
            value={createToken}
            readOnly
          />
          <button
            className="ds-btn"
            style={{ background: `var(--brand-accent, ${brand.accent})` }}
            type="submit"
            disabled={!createToken || createPending}
          >
            {createPending ? "Creating…" : "Create"}
          </button>
          {createState && !createState.ok && (
            <p style={{ margin: 0, fontSize: 13, color: "#b42318" }}>
              {createState.message}
            </p>
          )}
        </form>
      )}

      {uploading && active && (
        <form
          ref={uploadFormRef}
          action={uploadFormAction}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 14,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input type="hidden" name="albumId" value={active.album.id} />
          <input
            type="file"
            name="photo"
            accept="image/*"
            required
            className="ds-field"
            style={{ flex: "1 1 200px" }}
          />
          <input
            className="ds-field"
            style={{ maxWidth: 220 }}
            placeholder="Caption (optional)"
            name="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <TurnstileWidget onVerifyAction={setUploadToken} />
          <input
            type="hidden"
            name="cf-turnstile-response"
            value={uploadToken}
            readOnly
          />
          <button
            className="ds-btn"
            style={{ background: `var(--brand-accent, ${brand.accent})` }}
            type="submit"
            disabled={!uploadToken || uploadPending}
          >
            {uploadPending ? "Uploading…" : "Upload"}
          </button>
          {uploadState && !uploadState.ok && (
            <p style={{ margin: 0, fontSize: 13, color: "#b42318" }}>
              {uploadState.message}
            </p>
          )}
          {uploadState?.ok && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: `var(--brand-accent, ${brand.accent})`,
                fontWeight: 600,
              }}
            >
              {uploadState.message}
            </p>
          )}
        </form>
      )}

      {albums.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          {albums.map(({ album, groups }) => {
            const count = groups.reduce((n, g) => n + g.photos.length, 0);
            const isActive = album.id === active?.album.id;
            return (
              <button
                key={album.id}
                type="button"
                onClick={() => {
                  setActiveId(album.id);
                  setViewer(null);
                }}
                className="ds-chip"
                style={{
                  border: "none",
                  cursor: "pointer",
                  background: isActive
                    ? `var(--brand-accent, ${brand.accent})`
                    : "rgba(43,33,24,.07)",
                  color: isActive ? "#fff" : "inherit",
                }}
              >
                {album.name} · {count}
              </button>
            );
          })}
        </div>
      )}

      {(!active || active.groups.length === 0) && (
        <p style={{ color: "var(--ds-muted)" }}>
          {albums.length === 0
            ? "No albums yet — start one above."
            : "Nothing here yet — be the first to add a photo."}
        </p>
      )}

      {active?.groups.map((group, gi) => (
        <div key={group.date} style={{ marginBottom: 24 }}>
          <p
            style={{
              fontWeight: 800,
              letterSpacing: ".03em",
              fontSize: 13.5,
              textTransform: "uppercase",
              color: `var(--brand-accent, ${brand.accent})`,
              margin: "0 0 10px",
            }}
          >
            {formatGroupDate(group.date)}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {group.photos.map((photo, i) => (
              <Reveal
                key={photo.id}
                delay={Math.min(i + gi, 3) as 0 | 1 | 2 | 3}
              >
                {photo.src ? (
                  <button
                    type="button"
                    onClick={() => setViewer(indexById.get(photo.id) ?? 0)}
                    aria-label={
                      photo.cap ? `View photo: ${photo.cap}` : "View photo"
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      padding: 0,
                      border: "none",
                      background: "none",
                      cursor: "zoom-in",
                    }}
                  >
                    <Photo photo={photo} />
                  </button>
                ) : (
                  <Photo photo={photo} />
                )}
              </Reveal>
            ))}
          </div>
        </div>
      ))}

      {viewer !== null && flatPhotos[viewer] && (
        <PhotoLightbox
          photos={flatPhotos}
          index={viewer}
          onIndexAction={setViewer}
          onCloseAction={() => setViewer(null)}
        />
      )}
    </div>
  );
}
