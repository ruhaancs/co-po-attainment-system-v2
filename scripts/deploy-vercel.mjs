#!/usr/bin/env node
/**
 * Deploy to Vercel (production).
 *
 * Prerequisites:
 *   1. npm install
 *   2. npx vercel login   (once, in your terminal)
 *   3. .env.local with Supabase keys
 *
 * Run: npm run deploy:vercel
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) {
    console.error("❌ Missing .env.local — add Supabase keys first.");
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

function run(cmd, args, extraEnv = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function runCapture(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8" });
  return { status: r.status, stdout: r.stdout?.trim() ?? "", stderr: r.stderr?.trim() ?? "" };
}

const env = loadEnv();
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
for (const key of required) {
  if (!env[key]) {
    console.error(`❌ Missing ${key} in .env.local`);
    process.exit(1);
  }
}

console.log("\n🚀 Deploying CO-PO Attainment System to Vercel\n");

const whoami = runCapture("npx", ["vercel", "whoami"]);
if (whoami.status !== 0) {
  console.error("\n❌ Not logged in to Vercel.");
  console.error("   Run:  npx vercel login");
  console.error("   Then: npm run deploy:vercel\n");
  process.exit(1);
}
console.log(`✓ Vercel account: ${whoami.stdout}\n`);

console.log("📦 Production build check…");
run("npm", ["run", "build"]);

const envKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function pushEnv(target, value) {
  const r = spawnSync("npx", ["vercel", "env", "add", target, "production", "--force"], {
    cwd: root,
    input: value,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.warn(`  ⚠ Could not set ${target} via CLI — add it in Vercel Dashboard → Settings → Environment Variables`);
  } else {
    console.log(`  ✓ ${target}`);
  }
}

console.log("\n🔐 Syncing environment variables to Vercel…");
for (const key of envKeys) {
  pushEnv(key, env[key]);
}

console.log("\n🌐 Deploying (production)…\n");
run("npx", ["vercel", "deploy", "--prod", "--yes"], {
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL || "https://placeholder.vercel.app",
});

const inspect = runCapture("npx", ["vercel", "inspect", "--prod", "--json"]);
let productionUrl = "";
try {
  const json = JSON.parse(inspect.stdout);
  productionUrl = json?.url || json?.targets?.production?.url || "";
} catch {
  const ls = runCapture("npx", ["vercel", "ls", "--prod"]);
  const match = ls.stdout.match(/https:\/\/[^\s]+\.vercel\.app/);
  productionUrl = match?.[0] ?? "";
}

if (productionUrl) {
  console.log(`\n✅ Live URL: ${productionUrl}`);
  console.log(`   Login:    ${productionUrl}/login`);
  console.log(`   Register: ${productionUrl}/register\n`);
  console.log("📋 Post-deploy (required for auth):");
  console.log("   1. Vercel → Project → Settings → Environment Variables");
  console.log(`      Set NEXT_PUBLIC_SITE_URL = ${productionUrl}`);
  console.log("   2. Supabase → Authentication → URL configuration");
  console.log(`      Site URL: ${productionUrl}`);
  console.log(`      Redirect URLs: ${productionUrl}/**`);
  console.log("   3. Run: npm run deploy:vercel  (redeploy after env update)\n");
} else {
  console.log("\n✅ Deploy finished. Open https://vercel.com/dashboard for your project URL.\n");
}
