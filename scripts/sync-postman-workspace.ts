/**
 * Syncs the generated collection into a Postman workspace.
 *
 * DRY RUN (default): prints exactly what would be created or updated.
 * LIVE: only when BOTH POSTMAN_API_KEY and POSTMAN_WORKSPACE_ID are set.
 *       - Lists collections in the workspace
 *       - Finds the collection by name (or POSTMAN_COLLECTION_ID if set)
 *       - PUT update if found, POST create if not
 *
 * No keys are ever hardcoded. The dry-run path requires no credentials and is
 * a fully acceptable demo path: the message is that Postman is the shared
 * destination for the QA handoff.
 */

import "./load-env";
import * as fs from "node:fs";
import * as path from "node:path";
import { COLLECTION_NAME, COLLECTION_PATH, ENVIRONMENT_NAME, REPO_ROOT } from "./generate-postman-collection";

const POSTMAN_API_BASE = "https://api.getpostman.com";
const QA_WORKSPACE_NAME = process.env.POSTMAN_WORKSPACE_NAME || "Newforma QA Workspace";

interface CollectionItem {
  name: string;
  item?: CollectionItem[];
}

interface CollectionFile {
  info: { name: string };
  item: CollectionItem[];
}

export interface SyncResult {
  mode: "dry-run" | "live";
  workspaceName: string;
  collectionName: string;
  action: "create" | "update" | "none";
  detail: string;
}

function countRequests(items: CollectionItem[]): number {
  let count = 0;
  for (const item of items) {
    if (item.item) {
      count += countRequests(item.item);
    } else {
      count += 1;
    }
  }
  return count;
}

function loadCollection(): CollectionFile {
  if (!fs.existsSync(COLLECTION_PATH)) {
    throw new Error(
      `Collection not found at ${path.relative(REPO_ROOT, COLLECTION_PATH)}. ` +
        `Run 'npm run generate:collection' (or 'npm run make:qa-ready') first.`
    );
  }
  return JSON.parse(fs.readFileSync(COLLECTION_PATH, "utf8")) as CollectionFile;
}

// ---------------------------------------------------------------------------
// Dry run
// ---------------------------------------------------------------------------

function dryRun(): SyncResult {
  const collection = loadCollection();
  const folders = collection.item.map((f) => f.name);
  const requestCount = countRequests(collection.item);

  console.log("Postman sync — DRY RUN (no credentials set; nothing was sent to Postman)");
  console.log("");
  console.log(`  Target workspace:        ${QA_WORKSPACE_NAME}`);
  console.log(`  Would create or update:  Collection "${collection.info.name}"`);
  for (const folder of folders) {
    const folderItem = collection.item.find((f) => f.name === folder);
    const n = folderItem?.item ? countRequests(folderItem.item) : 0;
    console.log(`     - Folder "${folder}" (${n} request${n === 1 ? "" : "s"} with standard tests)`);
  }
  console.log(`  Would upsert environment: "${ENVIRONMENT_NAME}" (baseUrl, authToken, projectId, documentId, submittalId)`);
  console.log("");
  console.log("  To sync for real, set POSTMAN_API_KEY and POSTMAN_WORKSPACE_ID (see .env.example)");
  console.log("  and run 'npm run sync:postman' again.");

  return {
    mode: "dry-run",
    workspaceName: QA_WORKSPACE_NAME,
    collectionName: collection.info.name,
    action: "none",
    detail: `Dry run: would upsert "${collection.info.name}" (${requestCount} requests) into "${QA_WORKSPACE_NAME}".`
  };
}

// ---------------------------------------------------------------------------
// Live sync
// ---------------------------------------------------------------------------

async function postmanFetch(
  apiKey: string,
  method: string,
  endpoint: string,
  body?: unknown
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${POSTMAN_API_BASE}${endpoint}`, {
    method,
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json"
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON response; leave json null.
  }
  return { status: res.status, json };
}

async function liveSync(apiKey: string, workspaceId: string): Promise<SyncResult> {
  const collection = loadCollection();

  console.log("Postman sync — LIVE mode");
  console.log(`  Workspace ID: ${workspaceId}`);

  // 1. List collections in the workspace.
  const list = await postmanFetch(apiKey, "GET", `/collections?workspace=${encodeURIComponent(workspaceId)}`);
  if (list.status === 401) {
    throw new Error("Postman API rejected the API key (401). Check POSTMAN_API_KEY.");
  }
  if (list.status === 404) {
    throw new Error(`Workspace '${workspaceId}' not found (404). Check POSTMAN_WORKSPACE_ID.`);
  }
  if (list.status !== 200) {
    throw new Error(`Unexpected response listing collections: HTTP ${list.status} ${JSON.stringify(list.json)}`);
  }

  const existing = (list.json.collections || []) as { uid: string; name: string }[];
  const pinnedUid = process.env.POSTMAN_COLLECTION_ID;
  const match = pinnedUid
    ? existing.find((c) => c.uid === pinnedUid)
    : existing.find((c) => c.name === COLLECTION_NAME);

  const payload = { collection };

  if (match) {
    // 2a. Update in place.
    const update = await postmanFetch(apiKey, "PUT", `/collections/${match.uid}`, payload);
    if (update.status !== 200) {
      throw new Error(`Failed to update collection '${match.name}': HTTP ${update.status} ${JSON.stringify(update.json)}`);
    }
    console.log(`  Updated collection "${COLLECTION_NAME}" (uid ${match.uid})`);
    return {
      mode: "live",
      workspaceName: QA_WORKSPACE_NAME,
      collectionName: COLLECTION_NAME,
      action: "update",
      detail: `Updated existing collection (uid ${match.uid}) in workspace ${workspaceId}.`
    };
  }

  // 2b. Create new.
  const create = await postmanFetch(apiKey, "POST", `/collections?workspace=${encodeURIComponent(workspaceId)}`, payload);
  if (create.status !== 200 && create.status !== 201) {
    throw new Error(`Failed to create collection: HTTP ${create.status} ${JSON.stringify(create.json)}`);
  }
  const newUid = create.json?.collection?.uid ?? "(unknown uid)";
  console.log(`  Created collection "${COLLECTION_NAME}" (uid ${newUid})`);
  return {
    mode: "live",
    workspaceName: QA_WORKSPACE_NAME,
    collectionName: COLLECTION_NAME,
    action: "create",
    detail: `Created new collection (uid ${newUid}) in workspace ${workspaceId}.`
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function syncPostmanWorkspace(): Promise<SyncResult> {
  const apiKey = process.env.POSTMAN_API_KEY;
  const workspaceId = process.env.POSTMAN_WORKSPACE_ID;

  if (apiKey && workspaceId) {
    return liveSync(apiKey, workspaceId);
  }

  if (apiKey || workspaceId) {
    console.log("Note: live sync needs BOTH POSTMAN_API_KEY and POSTMAN_WORKSPACE_ID; falling back to dry run.");
    console.log("");
  }

  return dryRun();
}

if (require.main === module) {
  syncPostmanWorkspace().catch((err: Error) => {
    console.error(`Postman sync failed: ${err.message}`);
    process.exitCode = 1;
  });
}
