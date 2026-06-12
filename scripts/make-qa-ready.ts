/**
 * Orchestrator: "make this branch QA-ready".
 *
 *   1. Detect changed endpoints (demo/changed-endpoints.json)
 *   2. Generate the Postman collection with QA's standard tests
 *   3. Verify the Postman environment
 *   4. Sync to the QA workspace (dry run unless credentials are set)
 *   5. Write the QA handoff summary
 *
 * Run: npm run make:qa-ready
 */

import "./load-env";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  CHANGED_ENDPOINTS_PATH,
  COLLECTION_NAME,
  ENVIRONMENT_NAME,
  ENVIRONMENT_PATH,
  REPO_ROOT,
  generateCollection
} from "./generate-postman-collection";
import { syncPostmanWorkspace } from "./sync-postman-workspace";
import { SUMMARY_PATH, generateQaHandoffSummary } from "./qa-handoff-summary";

const TEMPLATE_LABELS: Record<string, string> = {
  "auth-required": "auth",
  "schema-validation": "schema",
  "standard-error-shape": "error shape",
  "response-time": "response time",
  "validation-error": "validation",
  "empty-results": "empty results",
  "forbidden-or-not-found": "not found",
  "create-resource": "create",
  "status-success": "status"
};

function heading(text: string): void {
  console.log("");
  console.log(text);
  console.log("─".repeat(text.length));
}

async function main(): Promise<void> {
  console.log("");
  console.log("Make branch QA-ready");
  console.log("════════════════════");

  // 1. Detect changed endpoints
  heading("1. Detect changed endpoints");
  const changed = JSON.parse(fs.readFileSync(CHANGED_ENDPOINTS_PATH, "utf8"));
  console.log(`✔ Branch: ${changed.branch}`);
  console.log(`✔ Detected changed endpoints: ${changed.endpoints.length}`);
  for (const e of changed.endpoints) {
    console.log(`   - ${e.method} ${e.path.replace(/\{\{(\w+)\}\}/g, ":$1")} (${e.change})`);
  }

  // 2. Generate the collection
  heading("2. Generate Postman collection");
  const generation = generateCollection();
  console.log(`✔ Collection: ${COLLECTION_NAME}`);
  console.log(`✔ Folders: ${generation.folders.join(" / ")}`);
  console.log(`✔ Requests created/updated: ${generation.requestCount}`);
  const labels = generation.templatesApplied
    .map((t) => TEMPLATE_LABELS[t] ?? t)
    .filter((label, i, arr) => arr.indexOf(label) === i);
  console.log(`✔ Standard tests applied: ${labels.join(", ")}`);
  console.log(`✔ Assertions injected: ${generation.testScriptCount} pm.test blocks`);

  // 3. Environment
  heading("3. Postman environment");
  if (!fs.existsSync(ENVIRONMENT_PATH)) {
    throw new Error(`Environment file missing: ${path.relative(REPO_ROOT, ENVIRONMENT_PATH)}`);
  }
  const env = JSON.parse(fs.readFileSync(ENVIRONMENT_PATH, "utf8"));
  const keys = env.values.map((v: { key: string }) => v.key).join(", ");
  console.log(`✔ Environment: ${ENVIRONMENT_NAME} (${keys})`);
  console.log("✔ Demo-only values — no secrets");

  // 4. Sync to the QA workspace
  heading("4. Sync to QA workspace");
  const sync = await syncPostmanWorkspace();
  console.log("");
  console.log(`✔ Target QA workspace: ${sync.workspaceName}`);
  console.log(`✔ Postman sync mode: ${sync.mode === "dry-run" ? "dry run" : `live (${sync.action})`}`);

  // 5. QA handoff summary
  heading("5. QA handoff summary");
  generateQaHandoffSummary();
  console.log(`✔ QA handoff summary: ${path.relative(REPO_ROOT, SUMMARY_PATH)}`);

  // Done
  console.log("");
  console.log("════════════════════════════════════════════════════════════");
  console.log("✅ Branch is QA-ready.");
  console.log("");
  console.log(`   Detected changed endpoints: ${changed.endpoints.length}`);
  console.log(`   Target QA workspace: ${sync.workspaceName}`);
  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   Requests created/updated: ${generation.requestCount}`);
  console.log(`   Standard tests applied: ${labels.join(", ")}`);
  console.log(`   Postman sync mode: ${sync.mode === "dry-run" ? "dry run" : "live"}`);
  console.log(`   QA handoff summary: ${path.relative(REPO_ROOT, SUMMARY_PATH)}`);
  console.log("");
  console.log("   Next: npm run dev (terminal 1) + npm run test:postman (terminal 2)");
  console.log("");
}

main().catch((err: Error) => {
  console.error(`make:qa-ready failed: ${err.message}`);
  process.exitCode = 1;
});
