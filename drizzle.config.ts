import type { Config } from "drizzle-kit";

// Used only to GENERATE migration SQL from the schema.
// Migrations are applied to D1 via `wrangler d1 migrations apply`.
export default {
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
} satisfies Config;
