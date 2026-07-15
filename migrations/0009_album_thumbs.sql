-- v6: store a separate thumbnail per album photo.
-- The grid renders `thumb_key` (small, fast); the full-screen viewer renders
-- `image_key` (full size). Nullable + backward compatible: photos uploaded
-- before this (and the Instagram-imported set) have no thumb, so the grid
-- falls back to `image_key`.
ALTER TABLE album_photos ADD COLUMN thumb_key TEXT;
