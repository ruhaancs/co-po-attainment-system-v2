#!/usr/bin/env node
import { execSync } from "node:child_process";

/** Kill processes listening on a TCP port (macOS/Linux). */
export function killPort(port) {
  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {
        /* already gone */
      }
    }
    if (pids.length) {
      execSync("sleep 0.5");
      for (const pid of pids) {
        try {
          process.kill(Number(pid), "SIGKILL");
        } catch {
          /* already gone */
        }
      }
    }
  } catch {
    /* nothing listening */
  }
}
