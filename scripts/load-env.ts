/**
 * Minimal .env loader (zero dependencies). Reads KEY=VALUE lines from the
 * repo-root .env if present. For this self-contained demo, .env values WIN
 * over inherited shell variables: machines often export a global
 * POSTMAN_API_KEY for another account, which silently hijacks the demo's
 * workspace sync with confusing 403s. The demo's .env is the source of
 * truth; unset values still fall through to the shell.
 */
import * as fs from "node:fs";
import * as path from "node:path";

const ENV_PATH = path.resolve(__dirname, "..", ".env");

export function loadDotEnv(): void {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = value;
  }
}

loadDotEnv();
