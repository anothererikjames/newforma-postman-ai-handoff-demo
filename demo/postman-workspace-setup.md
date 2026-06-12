# Postman Workspace Setup

How to prepare the **Newforma QA Workspace** for the demo — and what to do when you can't.

> For this demo, dry-run mode is acceptable if live workspace credentials are unavailable; the message is that Postman is the shared destination for the QA handoff.

## 1. Create the workspace (manual, one-time)

1. In Postman: **Workspaces → Create Workspace**.
2. Name it **Newforma QA Workspace** (the sync script targets this name by default; override with `POSTMAN_WORKSPACE_NAME`).
3. Visibility: **Team** — the point is that QA and dev teams share it.

## 2. Import the collection and environment

After running `npm run make:qa-ready` in the repo:

1. In the workspace, click **Import**.
2. Drag in both files from the repo's `postman/` folder:
   - `Newforma Project APIs - QA Handoff Demo.postman_collection.json`
   - `Newforma QA Local.postman_environment.json`
3. Select the **Newforma QA Local** environment in the environment picker (top right).

## 3. Verify the environment values

| Variable | Value | Notes |
| --- | --- | --- |
| `baseUrl` | `http://localhost:3000` | The demo API (`npm run dev`) |
| `authToken` | `demo-token` | Demo-only; not a secret |
| `projectId` | `PRJ-1001` | Seeded project |
| `documentId` | `DOC-9001` | Seeded document |
| `submittalId` | `SUB-7001` | Seeded submittal |

If you run the API on another port, change `baseUrl` (and start the API with `API_PORT=<port>`).

## 4. Run the collection

1. Make sure the API is running: `npm run dev`.
2. Right-click the collection → **Run collection**.
3. Keep default settings, click **Run**. Everything should be green: happy paths, 401s, 400s, 404s, and the empty-search case are all *expected* and asserted.

CLI equivalent: `npm run test:postman` (the Postman CLI with the same files).

## 5. Live sync via the Postman API (optional)

The script `scripts/sync-postman-workspace.ts` can push the generated collection straight into the workspace:

1. Create a Postman API key (Account settings → API keys).
2. Get the workspace ID (workspace **⋯ → Settings**, or `GET https://api.getpostman.com/workspaces`).
3. `cp .env.example .env`, set `POSTMAN_API_KEY` and `POSTMAN_WORKSPACE_ID`.
4. `npm run sync:postman` — it lists collections in the workspace, updates the collection in place if it exists, otherwise creates it.

Without credentials the same command prints a **dry run**: exactly what would be created or updated. That is a fully demo-ready path.

## 6. How the AI connection works (conceptually)

In this demo, the AI assistant (e.g. Claude Code) satisfies "make this branch QA-ready" by invoking the repo's own scripts — the same scripts a developer or CI job would run. The scripts talk to Postman through the public Postman API when credentials are present.

The same pattern generalizes: an assistant with access to Postman tooling (for example via an MCP server or the Postman API) could create workspaces, update collections, or trigger runs directly. This demo deliberately keeps the integration simple and inspectable — scripts in the repo, standard Postman API calls — so nothing here overpromises: what you see is exactly what runs.
