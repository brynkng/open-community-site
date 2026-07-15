-- v2.1: track which final date we've already emailed interested people about,
-- so locking in (or changing) a trip date notifies everyone exactly once per date.

ALTER TABLE trips ADD COLUMN final_date_notified TEXT;
