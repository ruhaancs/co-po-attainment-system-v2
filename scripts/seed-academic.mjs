#!/usr/bin/env node
/**
 * Seed departments and B.Tech programs into Supabase.
 * Run: npm run seed:academic
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const DEPARTMENTS = [
  { name: "Computer Science & Engineering", code: "CSE" },
  { name: "Electronics & Communication Engineering", code: "ECE" },
  { name: "Electrical Engineering", code: "EE" },
  { name: "Mechanical Engineering", code: "ME" },
  { name: "Civil Engineering", code: "CE" },
  { name: "Food Engineering & Technology", code: "FET" },
];

const PROGRAMS = [
  { name: "B.Tech Computer Science & Engineering", code: "BTECH-CSE", deptCode: "CSE" },
  { name: "B.Tech Electronics & Communication Engineering", code: "BTECH-ECE", deptCode: "ECE" },
  { name: "B.Tech Electrical Engineering", code: "BTECH-EE", deptCode: "EE" },
  { name: "B.Tech Mechanical Engineering", code: "BTECH-ME", deptCode: "ME" },
  { name: "B.Tech Civil Engineering", code: "BTECH-CE", deptCode: "CE" },
  { name: "B.Tech Food Engineering & Technology", code: "BTECH-FET", deptCode: "FET" },
];

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

  console.log("\n📚 Seeding departments and B.Tech programs…\n");

  const deptIds = {};

  for (const dept of DEPARTMENTS) {
    const { data: existing } = await supabase.from("departments").select("id").eq("code", dept.code).maybeSingle();

    if (existing) {
      const { error } = await supabase.from("departments").update({ name: dept.name }).eq("id", existing.id);
      if (error) {
        console.error(`  ✗ ${dept.code}:`, error.message);
        continue;
      }
      deptIds[dept.code] = existing.id;
      console.log(`  ↻ ${dept.code} (updated)`);
    } else {
      const { data, error } = await supabase.from("departments").insert(dept).select("id").single();
      if (error) {
        console.error(`  ✗ ${dept.code}:`, error.message);
        continue;
      }
      deptIds[dept.code] = data.id;
      console.log(`  ✓ ${dept.code}`);
    }
  }

  for (const prog of PROGRAMS) {
    const department_id = deptIds[prog.deptCode];
    if (!department_id) {
      console.error(`  ✗ ${prog.code}: department ${prog.deptCode} missing`);
      continue;
    }

    const { data: existing } = await supabase.from("programs").select("id").eq("code", prog.code).maybeSingle();

    const row = { name: prog.name, code: prog.code, department_id };

    if (existing) {
      const { error } = await supabase.from("programs").update(row).eq("id", existing.id);
      if (error) console.error(`  ✗ ${prog.code}:`, error.message);
      else console.log(`  ↻ ${prog.code} (updated)`);
    } else {
      const { error } = await supabase.from("programs").insert(row);
      if (error) console.error(`  ✗ ${prog.code}:`, error.message);
      else console.log(`  ✓ ${prog.code}`);
    }
  }

  const { data: summary } = await supabase
    .from("programs")
    .select("code, name, department:departments(code, name)")
    .order("code");

  console.log("\nPrograms in database:", summary?.length ?? 0);
  for (const p of summary ?? []) {
    console.log(`  • ${p.code} — ${p.name} (${p.department?.code})`);
  }
  console.log("\nDone. Refresh Dashboard → Programs in the app.\n");
}

main();
