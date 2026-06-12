/**
 * Runs the generated Postman collection against the local API.
 *
 * Primary runner: Postman CLI (`postman collection run`) — the first-party
 * CLI. When you are logged in (`postman login --with-api-key ...`), run
 * results also report back into your Postman workspace, which is exactly
 * the QA-visibility story this demo tells.
 *
 * Fallback runner: Newman (no login required). Used automatically when the
 * Postman CLI is not installed, or force it with `--newman`.
 *
 * Run: npm run test:postman   (with `npm run dev` running in another terminal)
 */

import "./load-env";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import newman from "newman";
import { COLLECTION_PATH, ENVIRONMENT_PATH, REPO_ROOT } from "./generate-postman-collection";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const FORCE_NEWMAN = process.argv.includes("--newman");

async function apiIsRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

function postmanCliAvailable(): boolean {
  const probe = spawnSync("postman", ["--version"], { stdio: "ignore" });
  return probe.status === 0;
}

function runWithPostmanCli(): void {
  // Running by collection ID (vs the local file) makes the Postman CLI
  // publish run results into the workspace's run history — the QA
  // visibility beat. Set POSTMAN_COLLECTION_ID to enable it.
  const collectionId = process.env.POSTMAN_COLLECTION_ID?.trim();
  const target = collectionId || COLLECTION_PATH;
  const targetLabel = collectionId ? `workspace collection ${collectionId}` : "local collection file";

  console.log(`API is up at ${BASE_URL} — running ${targetLabel} with Postman CLI...`);
  console.log("");

  const result = spawnSync(
    "postman",
    ["collection", "run", target, "-e", ENVIRONMENT_PATH],
    { stdio: "inherit" }
  );

  if (result.status === 0) {
    console.log("");
    console.log("Collection run passed — QA handoff verified against the local API. ✅");
    console.log(
      collectionId
        ? "Run results were published to the QA workspace's run history."
        : "Tip: set POSTMAN_COLLECTION_ID to publish run results into the QA workspace."
    );
    return;
  }

  console.error("");
  console.error("Postman CLI run did not pass.");
  console.error("If this is an authentication error, log in first:");
  console.error("");
  console.error("    postman login --with-api-key $POSTMAN_API_KEY");
  console.error("");
  console.error("Or run the no-login fallback: npm run test:postman:newman");
  process.exitCode = result.status ?? 1;
}

function runWithNewman(): void {
  console.log(`API is up at ${BASE_URL} — running collection with Newman (fallback runner)...`);
  console.log("");

  newman.run(
    {
      collection: COLLECTION_PATH,
      environment: ENVIRONMENT_PATH,
      reporters: ["cli"],
      timeoutRequest: 10000
    },
    (err, summary) => {
      if (err) {
        console.error(`Newman failed to run: ${err.message}`);
        process.exitCode = 1;
        return;
      }
      const failures = summary.run.failures.length;
      if (failures > 0) {
        console.error(`Collection run finished with ${failures} failed assertion(s).`);
        process.exitCode = 1;
      } else {
        console.log("Collection run passed — QA handoff verified against the local API. ✅");
      }
    }
  );
}

async function main(): Promise<void> {
  if (!fs.existsSync(COLLECTION_PATH)) {
    console.error(`Collection not found: ${path.relative(REPO_ROOT, COLLECTION_PATH)}`);
    console.error("Run 'npm run make:qa-ready' (or 'npm run generate:collection') first.");
    process.exitCode = 1;
    return;
  }

  if (!(await apiIsRunning())) {
    console.error(`The demo API is not responding at ${BASE_URL}/health.`);
    console.error("Start it in another terminal first:");
    console.error("");
    console.error("    npm run dev");
    console.error("");
    process.exitCode = 1;
    return;
  }

  if (!FORCE_NEWMAN && postmanCliAvailable()) {
    runWithPostmanCli();
    return;
  }

  if (!FORCE_NEWMAN) {
    console.log("Postman CLI not found — falling back to Newman.");
    console.log("Install the Postman CLI for the first-party runner:");
    console.log("  https://learning.postman.com/docs/postman-cli/postman-cli-installation/");
    console.log("");
  }
  runWithNewman();
}

main();
