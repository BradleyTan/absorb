/**
 * Database check / apply.
 *
 *   node scripts/db.mts          → report which tables exist and how full they are
 *   node scripts/db.mts --apply  → run any migration in supabase/migrations that
 *                                  hasn't been applied yet (needs a Postgres URL)
 *
 * Reads .env.local (as written by `vercel env pull .env.local`). The check path
 * only needs NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY; applying
 * migrations needs a direct Postgres connection string, which the Vercel/Supabase
 * integration exposes as POSTGRES_URL (or set SUPABASE_DB_URL yourself).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const TABLES = [
  "topics",
  "journeys",
  "lessons",
  "practice_items",
  "challenges",
  "progress",
];

function loadEnv(file = ".env.local"): Record<string, string> {
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[m[1]] = value;
  }
  return env;
}

async function report(env: Record<string, string>) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
        "Run: vercel link && vercel env pull .env.local",
    );
    process.exitCode = 1;
    return false;
  }

  // Check the project is actually serving before blaming the schema: a paused
  // or restoring project answers DNS but returns a Cloudflare 5xx, which the
  // client reports as an empty error message.
  const health = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }).catch((e: Error) => e);

  if (health instanceof Error) {
    console.error(
      `Cannot reach ${url}\n  ${health.message}\n\n` +
        "The project may not exist. Check it in the Supabase dashboard.",
    );
    process.exitCode = 1;
    return false;
  }
  if (health.status >= 500) {
    console.error(
      `${url} answered ${health.status}.\n\n` +
        "The project is reachable but not serving — usually a paused project\n" +
        "still restoring. Wait for it to finish starting, then re-run.",
    );
    process.exitCode = 1;
    return false;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);

  let allPresent = true;
  console.log(`Supabase project: ${url}\n`);
  for (const table of TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      allPresent = false;
      const detail =
        [error.message, error.code, error.hint].filter(Boolean).join(" · ") ||
        "unknown error";
      console.log(`  ✗ ${table.padEnd(16)} ${detail}`);
    } else {
      console.log(`  ✓ ${table.padEnd(16)} ${count ?? 0} rows`);
    }
  }
  console.log(
    `\n${allPresent ? "Schema is applied." : "Some tables are missing — run: node scripts/db.mts --apply"}`,
  );
  return allPresent;
}

async function apply(env: Record<string, string>) {
  const conn =
    env.SUPABASE_DB_URL ||
    env.POSTGRES_URL_NON_POOLING ||
    env.POSTGRES_URL ||
    env.DATABASE_URL;

  if (!conn) {
    console.error(
      "No Postgres connection string found (SUPABASE_DB_URL / POSTGRES_URL /\n" +
        "POSTGRES_URL_NON_POOLING / DATABASE_URL).\n\n" +
        "Either add one to .env.local, or paste supabase/migrations/*.sql into the\n" +
        "Supabase dashboard SQL editor — the migrations are written to be re-runnable.",
    );
    process.exitCode = 1;
    return;
  }

  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const dir = join("supabase", "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    process.stdout.write(`  applying ${file} … `);
    try {
      await client.query(sql);
      console.log("ok");
    } catch (err) {
      console.log("failed");
      console.error(err);
      await client.end();
      process.exitCode = 1;
      return;
    }
  }

  await client.end();
  console.log("\nMigrations applied.");
}

const env = loadEnv();
if (process.argv.includes("--apply")) {
  await apply(env);
  await report(env);
} else {
  await report(env);
}
