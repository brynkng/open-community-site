-- v4: Brand refresh — replace placeholder program names/taglines/colors/logos
-- with the design's real three-brand identity. Idempotent UPDATEs by fixed id
-- (same pattern as 0004's seed): safe to re-run.

UPDATE programs
SET name = 'Nomad Bike Philly',
    tagline = 'Sunday rides',
    accent_color = '#1F3A63',
    logo_url = '/brands/nomadic-bike-philly.jpg'
WHERE id = 1;

UPDATE programs
SET name = 'Sidewalk Story',
    tagline = 'Saturday dinners',
    accent_color = '#A8332A',
    logo_url = '/brands/sidewalk-story.png'
WHERE id = 2;

UPDATE programs
SET name = 'Field Trip Philly',
    tagline = 'Camping & hikes',
    accent_color = '#2E5339',
    logo_url = NULL
WHERE id = 3;
