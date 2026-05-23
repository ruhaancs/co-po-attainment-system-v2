#!/usr/bin/env node
/**
 * Production build — must not run while `next dev` is active (corrupts .next).
 */
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const port = Number(process.env.PORT || 3000);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function portInUse(p) {
  try {
    execSync(`lsof -ti :${p}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (portInUse(port)) {
  console.error(
    `\n❌ Port ${port} is in use (next dev is probably running).\n` +
      `   Stop it with Ctrl+C in the dev terminal, then run: npm run build\n` +
      `   Running build while dev is active breaks styles (CSS 404).\n`
  );
  process.exit(1);
}

const result = spawnSync("npx", ["next", "build"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
