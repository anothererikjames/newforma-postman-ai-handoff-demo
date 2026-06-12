/**
 * Generates a Postman Collection v2.1 from:
 *   - demo/changed-endpoints.json   (what changed on this branch)
 *   - qa/postman/test-policy.json   (QA's standard test policy)
 *   - qa/postman/test-templates/*.js (Postman sandbox test snippets)
 *
 * Output: postman/Newforma Project APIs - QA Handoff Demo.postman_collection.json
 *
 * Run directly:  npm run generate:collection
 * Or via the orchestrator: npm run make:qa-ready
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

export const REPO_ROOT = path.resolve(__dirname, "..");
export const COLLECTION_NAME = "Newforma Project APIs - QA Handoff Demo";
export const COLLECTION_PATH = path.join(REPO_ROOT, "postman", `${COLLECTION_NAME}.postman_collection.json`);
export const ENVIRONMENT_NAME = "Newforma QA Local";
export const ENVIRONMENT_PATH = path.join(REPO_ROOT, "postman", `${ENVIRONMENT_NAME}.postman_environment.json`);
export const CHANGED_ENDPOINTS_PATH = path.join(REPO_ROOT, "demo", "changed-endpoints.json");
export const TEST_POLICY_PATH = path.join(REPO_ROOT, "qa", "postman", "test-policy.json");
export const TEMPLATES_DIR = path.join(REPO_ROOT, "qa", "postman", "test-templates");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PolicyEntry {
  template: string;
  appliesTo: string[];
  params?: { maxResponseMs?: number };
  requires?: string;
  rationale?: string;
}

interface TestPolicy {
  defaults: { maxResponseMs: number };
  policies: PolicyEntry[];
}

interface ChangedEndpoint {
  id: string;
  change: string;
  name: string;
  method: string;
  path: string;
  folder: string;
  kind: string;
  auth: boolean;
  description?: string;
  requestBody?: {
    example?: Record<string, unknown>;
    schema?: Record<string, unknown>;
  };
  success: {
    status: number;
    requiredFields?: string[];
    idField?: string;
    idPrefix?: string;
    example?: unknown;
  };
  errorCases?: {
    type: string;
    status: number;
    errorCode?: string;
    exampleBody?: Record<string, unknown>;
    note?: string;
  }[];
}

interface ChangedEndpointsFile {
  branch: string;
  endpoints: ChangedEndpoint[];
}

interface RequestSpec {
  name: string;
  folder: string;
  method: string;
  pathTemplate: string;
  auth: boolean;
  tags: string[];
  body?: unknown;
  expectedStatus: number;
  requiredFields?: string[];
  idField?: string;
  idPrefix?: string;
  saveAsVariable?: string;
  description?: string;
  exampleBody?: unknown;
  exampleName?: string;
}

export interface GenerationResult {
  collection: Record<string, unknown>;
  collectionPath: string;
  folders: string[];
  requestCount: number;
  testScriptCount: number;
  templatesApplied: string[];
  changedEndpoints: ChangedEndpoint[];
  branch: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  500: "Internal Server Error"
};

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function loadTemplates(): Record<string, string> {
  const templates: Record<string, string> = {};
  for (const file of fs.readdirSync(TEMPLATES_DIR)) {
    if (file.endsWith(".js")) {
      templates[path.basename(file, ".js")] = fs.readFileSync(path.join(TEMPLATES_DIR, file), "utf8");
    }
  }
  return templates;
}

function urlFromTemplate(pathTemplate: string): Record<string, unknown> {
  const segments = pathTemplate.replace(/^\//, "").split("/");
  return {
    raw: `{{baseUrl}}${pathTemplate}`,
    host: ["{{baseUrl}}"],
    path: segments
  };
}

function buildHeaders(spec: RequestSpec): Record<string, string>[] {
  const headers: Record<string, string>[] = [];
  if (spec.auth) {
    headers.push({ key: "Authorization", value: "Bearer {{authToken}}" });
  }
  if (spec.body !== undefined) {
    headers.push({ key: "Content-Type", value: "application/json" });
  }
  return headers;
}

function buildRequest(spec: RequestSpec): Record<string, unknown> {
  const request: Record<string, unknown> = {
    method: spec.method,
    header: buildHeaders(spec),
    url: urlFromTemplate(spec.pathTemplate)
  };
  if (spec.description) {
    request.description = spec.description;
  }
  if (spec.body !== undefined) {
    request.body = {
      mode: "raw",
      raw: JSON.stringify(spec.body, null, 2),
      options: { raw: { language: "json" } }
    };
  }
  return request;
}

function buildExampleResponse(spec: RequestSpec): Record<string, unknown> | null {
  if (spec.exampleBody === undefined) return null;
  return {
    name: spec.exampleName || `${spec.expectedStatus} ${STATUS_TEXT[spec.expectedStatus] || ""}`.trim(),
    originalRequest: buildRequest(spec),
    status: STATUS_TEXT[spec.expectedStatus] || "OK",
    code: spec.expectedStatus,
    _postman_previewlanguage: "json",
    header: [{ key: "Content-Type", value: "application/json; charset=utf-8" }],
    cookie: [],
    body: JSON.stringify(spec.exampleBody, null, 2)
  };
}

function buildTestScript(
  spec: RequestSpec,
  policy: TestPolicy,
  templates: Record<string, string>,
  applied: Set<string>
): string[] {
  const lines: string[] = [];

  for (const entry of policy.policies) {
    const matches =
      entry.appliesTo.includes("*") || entry.appliesTo.some((tag) => spec.tags.includes(tag));
    if (!matches) continue;
    if (entry.requires === "requiredFields" && (!spec.requiredFields || spec.requiredFields.length === 0)) {
      continue;
    }
    const source = templates[entry.template];
    if (!source) {
      throw new Error(`Test policy references missing template '${entry.template}' in ${TEMPLATES_DIR}`);
    }

    const maxMs = entry.params?.maxResponseMs ?? policy.defaults.maxResponseMs;
    const rendered = source
      .replace(/__EXPECTED_STATUS__/g, String(spec.expectedStatus))
      .replace(/__MAX_RESPONSE_MS__/g, String(maxMs))
      .replace(/__REQUIRED_FIELDS__/g, JSON.stringify(spec.requiredFields ?? []))
      .replace(/__ID_FIELD__/g, spec.idField ?? "id")
      .replace(/__ID_PREFIX__/g, spec.idPrefix ?? "")
      .replace(/__SAVE_AS_VARIABLE__/g, spec.saveAsVariable ?? "createdResourceId");

    applied.add(entry.template);
    lines.push(...rendered.replace(/\s+$/, "").split("\n"), "");
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Request specs: baseline endpoints + changed endpoints from the fixture
// ---------------------------------------------------------------------------

function baselineSpecs(): RequestSpec[] {
  return [
    {
      name: "Health check",
      folder: "Health",
      method: "GET",
      pathTemplate: "/health",
      auth: false,
      tags: ["happy-path"],
      expectedStatus: 200,
      requiredFields: ["status", "service", "time"],
      description: "Unauthenticated liveness check. Useful as the first request in a QA run.",
      exampleBody: {
        status: "ok",
        service: "newforma-project-api",
        version: "1.0.0",
        time: "2026-06-10T17:00:00.000Z"
      }
    },
    {
      name: "Get document by ID",
      folder: "Project Documents",
      method: "GET",
      pathTemplate: "/projects/{{projectId}}/documents/{{documentId}}",
      auth: true,
      tags: ["happy-path"],
      expectedStatus: 200,
      requiredFields: ["id", "projectId", "title", "discipline", "status", "revision", "fileName", "author", "updatedAt"],
      description: "Fetch a single project document by ID.",
      exampleBody: {
        id: "DOC-9001",
        projectId: "PRJ-1001",
        title: "Level 3 Mechanical Floor Plan",
        discipline: "Mechanical",
        status: "Issued for Review",
        revision: "C",
        fileName: "M-301_Level3_Mechanical_Plan_RevC.pdf",
        author: "J. Okafor",
        updatedAt: "2026-05-28T14:32:00.000Z"
      }
    },
    {
      name: "Get document by ID - missing auth (401)",
      folder: "Project Documents",
      method: "GET",
      pathTemplate: "/projects/{{projectId}}/documents/{{documentId}}",
      auth: false,
      tags: ["missing-auth"],
      expectedStatus: 401,
      description: "Negative test: no Authorization header.",
      exampleBody: {
        error: { code: "UNAUTHORIZED", message: "Missing bearer token. Send 'Authorization: Bearer <token>'." }
      }
    },
    {
      name: "Get document by ID - unknown project (404)",
      folder: "Project Documents",
      method: "GET",
      pathTemplate: "/projects/PRJ-0000/documents/{{documentId}}",
      auth: true,
      tags: ["unknown-resource"],
      expectedStatus: 404,
      description: "Negative test: project ID that does not exist.",
      exampleBody: {
        error: { code: "NOT_FOUND", message: "Project 'PRJ-0000' was not found." }
      }
    },
    {
      name: "Get submittal by ID",
      folder: "Project Submittals",
      method: "GET",
      pathTemplate: "/projects/{{projectId}}/submittals/{{submittalId}}",
      auth: true,
      tags: ["happy-path"],
      expectedStatus: 200,
      requiredFields: ["id", "projectId", "title", "discipline", "status", "revision", "dueDate", "reviewer", "createdAt"],
      description: "Fetch a single submittal by ID.",
      exampleBody: {
        id: "SUB-7001",
        projectId: "PRJ-1001",
        title: "Air Handling Unit Product Data - AHU-3",
        discipline: "Mechanical",
        specSection: "23 73 13",
        status: "Under Review",
        revision: "1",
        dueDate: "2026-06-20",
        reviewer: "K. Demers",
        submittedBy: "Summit Mechanical Contractors",
        createdAt: "2026-06-03T15:10:00.000Z"
      }
    },
    {
      name: "Get submittal by ID - missing auth (401)",
      folder: "Project Submittals",
      method: "GET",
      pathTemplate: "/projects/{{projectId}}/submittals/{{submittalId}}",
      auth: false,
      tags: ["missing-auth"],
      expectedStatus: 401,
      description: "Negative test: no Authorization header.",
      exampleBody: {
        error: { code: "UNAUTHORIZED", message: "Missing bearer token. Send 'Authorization: Bearer <token>'." }
      }
    },
    {
      name: "Get submittal by ID - unknown submittal (404)",
      folder: "Project Submittals",
      method: "GET",
      pathTemplate: "/projects/{{projectId}}/submittals/SUB-0000",
      auth: true,
      tags: ["unknown-resource"],
      expectedStatus: 404,
      description: "Negative test: submittal ID that does not exist.",
      exampleBody: {
        error: { code: "NOT_FOUND", message: "Submittal 'SUB-0000' was not found in project 'PRJ-1001'." }
      }
    }
  ];
}

function specsFromChangedEndpoint(endpoint: ChangedEndpoint): RequestSpec[] {
  const specs: RequestSpec[] = [];
  const isCreate = endpoint.kind === "create";
  const happyTags = isCreate ? ["create"] : ["happy-path"];

  specs.push({
    name: endpoint.name,
    folder: endpoint.folder,
    method: endpoint.method,
    pathTemplate: endpoint.path,
    auth: endpoint.auth,
    tags: happyTags,
    body: endpoint.requestBody?.example,
    expectedStatus: endpoint.success.status,
    requiredFields: endpoint.success.requiredFields,
    idField: endpoint.success.idField,
    idPrefix: endpoint.success.idPrefix,
    saveAsVariable: isCreate ? "createdSubmittalId" : undefined,
    description: endpoint.description,
    exampleBody: endpoint.success.example
  });

  for (const errorCase of endpoint.errorCases ?? []) {
    switch (errorCase.type) {
      case "missing-auth":
        specs.push({
          name: `${endpoint.name} - missing auth (401)`,
          folder: endpoint.folder,
          method: endpoint.method,
          pathTemplate: endpoint.path,
          auth: false,
          tags: ["missing-auth"],
          body: endpoint.requestBody?.example,
          expectedStatus: 401,
          description: "Negative test: no Authorization header.",
          exampleBody: {
            error: { code: "UNAUTHORIZED", message: "Missing bearer token. Send 'Authorization: Bearer <token>'." }
          }
        });
        break;
      case "malformed-body":
        specs.push({
          name: `${endpoint.name} - malformed body (400)`,
          folder: endpoint.folder,
          method: endpoint.method,
          pathTemplate: endpoint.path,
          auth: endpoint.auth,
          tags: ["malformed-body"],
          body: errorCase.exampleBody ?? {},
          expectedStatus: 400,
          description: `Negative test: body fails validation.${errorCase.note ? ` ${errorCase.note}` : ""}`,
          exampleBody: {
            error: {
              code: "VALIDATION_ERROR",
              message: "Request body failed validation.",
              details: [{ field: "(see response)", message: "Field-level validation messages." }]
            }
          }
        });
        break;
      case "unknown-resource":
        specs.push({
          name: `${endpoint.name} - unknown project (404)`,
          folder: endpoint.folder,
          method: endpoint.method,
          pathTemplate: endpoint.path.replace("{{projectId}}", "PRJ-0000"),
          auth: endpoint.auth,
          tags: ["unknown-resource"],
          body: endpoint.requestBody?.example,
          expectedStatus: 404,
          description: "Negative test: project ID that does not exist.",
          exampleBody: {
            error: { code: "NOT_FOUND", message: "Project 'PRJ-0000' was not found." }
          }
        });
        break;
      case "empty-results":
        specs.push({
          name: `${endpoint.name} - empty results (200)`,
          folder: endpoint.folder,
          method: endpoint.method,
          pathTemplate: endpoint.path,
          auth: endpoint.auth,
          tags: ["empty-results"],
          body: errorCase.exampleBody ?? {},
          expectedStatus: 200,
          description: `Zero matches is a success case.${errorCase.note ? ` ${errorCase.note}` : ""}`,
          exampleBody: { results: [], total: 0, page: 1, pageSize: 25 }
        });
        break;
      default:
        break;
    }
  }

  return specs;
}

// ---------------------------------------------------------------------------
// Main generation
// ---------------------------------------------------------------------------

export function generateCollection(options: { baseline?: boolean } = {}): GenerationResult {
  const changed = loadJson<ChangedEndpointsFile>(CHANGED_ENDPOINTS_PATH);
  const policy = loadJson<TestPolicy>(TEST_POLICY_PATH);
  const templates = loadTemplates();

  // baseline = QA's stale "before" collection: covers the existing endpoints
  // but NOT the ones changed on this branch. The demo's hero prompt turns
  // baseline into the full collection, so the update is visible on camera.
  const specs: RequestSpec[] = [...baselineSpecs()];
  if (!options.baseline) {
    for (const endpoint of changed.endpoints) {
      specs.push(...specsFromChangedEndpoint(endpoint));
    }
  }

  const folderOrder = ["Health", "Project Documents", "Project Submittals"];
  const foldersByName = new Map<string, Record<string, unknown>[]>();
  for (const folder of folderOrder) {
    foldersByName.set(folder, []);
  }

  const applied = new Set<string>();
  let testScriptCount = 0;

  for (const spec of specs) {
    const execLines = buildTestScript(spec, policy, templates, applied);
    testScriptCount += (execLines.join("\n").match(/pm\.test\(/g) || []).length;

    const item: Record<string, unknown> = {
      name: spec.name,
      request: buildRequest(spec),
      event: [
        {
          listen: "test",
          script: { type: "text/javascript", exec: execLines }
        }
      ]
    };

    const example = buildExampleResponse(spec);
    item.response = example ? [example] : [];

    const folderItems = foldersByName.get(spec.folder);
    if (!folderItems) {
      throw new Error(`Request '${spec.name}' references unknown folder '${spec.folder}'`);
    }
    folderItems.push(item);
  }

  const collection = {
    info: {
      _postman_id: crypto.randomUUID(),
      name: COLLECTION_NAME,
      description: [
        `QA handoff collection generated from branch '${changed.branch}'.`,
        "",
        "Generated by scripts/generate-postman-collection.ts from:",
        "- demo/changed-endpoints.json (changed endpoints on this branch)",
        "- qa/postman/test-policy.json (QA standard test policy)",
        "- qa/postman/test-templates/ (standard test scripts)",
        "",
        "Environment: 'Newforma QA Local' (baseUrl, authToken, projectId, documentId, submittalId).",
        "Demo-only credentials; no secrets."
      ].join("\n"),
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: folderOrder.map((folder) => ({
      name: folder,
      item: foldersByName.get(folder)
    })),
    variable: [{ key: "createdSubmittalId", value: "", type: "string" }]
  };

  fs.mkdirSync(path.dirname(COLLECTION_PATH), { recursive: true });
  fs.writeFileSync(COLLECTION_PATH, JSON.stringify(collection, null, 2) + "\n", "utf8");

  return {
    collection,
    collectionPath: COLLECTION_PATH,
    folders: folderOrder,
    requestCount: specs.length,
    testScriptCount,
    templatesApplied: [...applied].sort(),
    changedEndpoints: changed.endpoints,
    branch: changed.branch
  };
}

if (require.main === module) {
  const baseline = process.argv.includes("--baseline");
  const result = generateCollection({ baseline });
  if (baseline) console.log("Mode: baseline (pre-branch collection — changed endpoints excluded)");
  console.log(`Generated collection: ${path.relative(REPO_ROOT, result.collectionPath)}`);
  console.log(`  Folders:   ${result.folders.join(", ")}`);
  console.log(`  Requests:  ${result.requestCount}`);
  console.log(`  pm.test assertions injected: ${result.testScriptCount}`);
  console.log(`  Templates applied: ${result.templatesApplied.join(", ")}`);
}
