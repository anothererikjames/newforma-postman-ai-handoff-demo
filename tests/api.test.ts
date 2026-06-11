import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import { createApp } from "../src/app";

let server: Server;
let baseUrl = "";
const AUTH = { Authorization: "Bearer demo-token" };
const JSON_HEADERS = { ...AUTH, "Content-Type": "application/json" };

before(async () => {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Could not determine test server port");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  server.close();
});

describe("GET /health", () => {
  it("returns 200 without auth", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string };
    assert.equal(body.status, "ok");
  });
});

describe("auth middleware", () => {
  it("rejects missing token with 401 and standard error shape", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-1001/documents/DOC-9001`);
    assert.equal(res.status, 401);
    const body = (await res.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "UNAUTHORIZED");
    assert.ok(body.error.message.length > 0);
  });

  it("rejects wrong token with 401", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-1001/documents/DOC-9001`, {
      headers: { Authorization: "Bearer wrong-token" }
    });
    assert.equal(res.status, 401);
  });
});

describe("GET /projects/:projectId/documents/:documentId", () => {
  it("returns a seeded document", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-1001/documents/DOC-9001`, { headers: AUTH });
    assert.equal(res.status, 200);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.id, "DOC-9001");
    for (const field of ["title", "discipline", "status", "revision", "fileName", "author", "updatedAt"]) {
      assert.ok(field in body, `missing field ${field}`);
    }
  });

  it("returns 404 for an unknown project", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-9999/documents/DOC-9001`, { headers: AUTH });
    assert.equal(res.status, 404);
    const body = (await res.json()) as { error: { code: string } };
    assert.equal(body.error.code, "NOT_FOUND");
  });

  it("returns 404 for an unknown document", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-1001/documents/DOC-0000`, { headers: AUTH });
    assert.equal(res.status, 404);
  });
});

describe("POST /projects/:projectId/documents/search", () => {
  it("returns matching documents", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-1001/documents/search`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ query: "mechanical", discipline: "Mechanical" })
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { results: unknown[]; total: number; page: number; pageSize: number };
    assert.ok(body.results.length > 0);
    assert.equal(body.total, body.results.length);
    assert.equal(body.page, 1);
  });

  it("returns 200 with an empty results array when nothing matches", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-1001/documents/search`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ query: "no-such-document-zzz" })
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { results: unknown[]; total: number };
    assert.equal(body.results.length, 0);
    assert.equal(body.total, 0);
  });

  it("returns 400 with details for a malformed body", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-1001/documents/search`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ query: 12345, pageSize: "lots" })
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: { code: string; details: unknown[] } };
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(body.error.details.length >= 2);
  });
});

describe("POST /projects/:projectId/submittals", () => {
  it("creates a submittal and returns 201 with an ID", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-1001/submittals`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        title: "Fire Damper Product Data",
        discipline: "Mechanical",
        specSection: "23 33 13",
        dueDate: "2026-07-01",
        reviewer: "K. Demers"
      })
    });
    assert.equal(res.status, 201);
    const body = (await res.json()) as Record<string, unknown>;
    assert.match(String(body.id), /^SUB-\d+$/);
    assert.equal(body.status, "Open");
    assert.equal(body.revision, "1");
  });

  it("returns 400 with details when required fields are missing", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-1001/submittals`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ dueDate: "not-a-date" })
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: { code: string; details: { field: string }[] } };
    assert.equal(body.error.code, "VALIDATION_ERROR");
    const fields = body.error.details.map((d) => d.field);
    assert.ok(fields.includes("title"));
    assert.ok(fields.includes("discipline"));
    assert.ok(fields.includes("dueDate"));
  });
});

describe("GET /projects/:projectId/submittals/:submittalId", () => {
  it("returns a seeded submittal", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-1001/submittals/SUB-7001`, { headers: AUTH });
    assert.equal(res.status, 200);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.id, "SUB-7001");
    for (const field of ["title", "discipline", "status", "revision", "dueDate", "reviewer"]) {
      assert.ok(field in body, `missing field ${field}`);
    }
  });

  it("returns 404 for an unknown submittal", async () => {
    const res = await fetch(`${baseUrl}/projects/PRJ-1001/submittals/SUB-0000`, { headers: AUTH });
    assert.equal(res.status, 404);
    const body = (await res.json()) as { error: { code: string } };
    assert.equal(body.error.code, "NOT_FOUND");
  });
});
