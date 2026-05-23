#!/usr/bin/env node
/** One command to fix missing styles: kill stale dev, clear cache, restart. */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const devScript = path.join(root, "scripts", "dev.mjs");

const child = spawn(process.execPath, [devScript], {
  cwd: root,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
