/**
 * Runs the generated Postman collection against the local API with Newman.
 * Checks the API is actually running first and fails with a clear message
 * if it is not.
 *
 * Run: npm run test:postman   (with `npm run dev` running in another terminal)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import newman from "newman";
import { COLLECTION_PATH, ENVIRONMENT_PATH, REPO_ROOT } from "./generate-postman-collection";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

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

  console.log(`API is up at ${BASE_URL} — running collection with Newman...`);
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

main();
