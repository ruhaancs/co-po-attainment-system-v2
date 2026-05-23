/**
 * Applies production migration via Supabase REST (rpc not available).
 * Prefer running supabase/migrations/001_production_upgrade.sql in SQL Editor.
 * This script approves existing teachers and activates demo users after migration.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const path = join(root, ".env.local");
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) env[t.slice(0, i)] = t.slice(i + 1);
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log("Approving all teachers and ensuring users are active...");

  const { data: teachers } = await supabase.from("teachers").select("id, profile_id");
  for (const t of teachers ?? []) {
    await supabase
      .from("teachers")
      .update({
        approval_status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", t.id);
    await supabase.from("users").update({ is_active: true }).eq("id", t.profile_id);
  }

  console.log("Done. Run 001_production_upgrade.sql in Supabase SQL Editor if not already applied.");
}

main();
