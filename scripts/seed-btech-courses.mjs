#!/usr/bin/env node
/**
 * Seed full B.Tech course catalogs for all programs.
 * Run: npm run seed:courses
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { BTECH_COURSE_CATALOG } from "./data/btech-courses.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) env[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n📖 Seeding B.Tech courses for all programs…\n");

  const { data: programs, error: pErr } = await supabase.from("programs").select("id, code, name");
  if (pErr || !programs?.length) {
    console.error("No programs found. Run: npm run seed:academic");
    process.exit(1);
  }

  const programByCode = Object.fromEntries(programs.map((p) => [p.code, p]));

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const [progCode, courses] of Object.entries(BTECH_COURSE_CATALOG)) {
    const program = programByCode[progCode];
    if (!program) {
      console.warn(`  ⚠ Program ${progCode} not in DB — skip ${courses.length} courses`);
      skipped += courses.length;
      continue;
    }

    console.log(`\n  ${program.name} (${progCode}) — ${courses.length} courses`);

    for (const course of courses) {
      const row = {
        code: course.code,
        name: course.name,
        credits: course.credits,
        semester: course.semester,
        program_id: program.id,
        teacher_id: null,
        description: `B.Tech core course — ${course.semester}`,
      };

      const { data: existing } = await supabase
        .from("courses")
        .select("id")
        .eq("code", course.code)
        .eq("semester", course.semester)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("courses").update(row).eq("id", existing.id);
        if (error) console.error(`    ✗ ${course.code}:`, error.message);
        else updated++;
      } else {
        const { error } = await supabase.from("courses").insert(row);
        if (error) console.error(`    ✗ ${course.code}:`, error.message);
        else inserted++;
      }
    }
  }

  const { count } = await supabase.from("courses").select("*", { count: "exact", head: true });

  console.log(`\n✅ Done: ${inserted} added, ${updated} updated, ${skipped} skipped (missing program).`);
  console.log(`   Total courses in database: ${count ?? "?"}`);
  console.log("\n   Refresh Dashboard → Courses to view.\n");
}

main();
