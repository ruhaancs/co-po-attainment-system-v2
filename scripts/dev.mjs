#!/usr/bin/env node
/**
 * Reliable dev start: stop stale Next on :3000, wipe .next, run next dev.
 * Stale dev + rebuilt .next = CSS/JS 404 and unstyled pages.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { killPort } from "./kill-port.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(root, ".next");
const port = Number(process.env.PORT || 3000);

console.log(`Stopping any process on port ${port}…`);
killPort(port);

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
}

console.log("Starting Next.js dev server…");

const child = spawn("npx", ["next", "dev", "-p", String(port)], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: String(port) },
});

child.on("exit", (code) => process.exit(code ?? 0));
