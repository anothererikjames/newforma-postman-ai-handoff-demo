# Architecture

## Components

| Component | In this repo | Role |
| --- | --- | --- |
| **Developer surface** | VS Code / terminal (demo) | Wherever the developer already works. Interchangeable: Claude Code, Codex, Copilot, terminal, CI. |
| **AI assistant** | Claude Code (demo) | Receives "make this branch QA-ready", invokes the repo's automation. |
| **Repo metadata** | `demo/changed-endpoints.json` | What changed on the branch: methods, paths, body schemas, success and error cases. (Simulated here; in production, produced by route/OpenAPI diffing.) |
| **Standard test templates** | `qa/postman/test-templates/` + `test-policy.json` | QA-owned test library and the policy for when each test applies. Versioned with the code. |
| **Collection generator** | `scripts/generate-postman-collection.ts` | Deterministic: metadata + policy + templates → Collection v2.1 with requests, examples, tests. |
| **Workspace sync** | `scripts/sync-postman-workspace.ts` | Upserts the collection into the QA workspace via the Postman API. Dry-run without credentials. |
| **QA workspace** | "Newforma QA Workspace" in Postman | The shared destination. QA opens it, picks the environment, runs the collection. |
| **CI** | `.github/workflows/qa-handoff.yml` | Same flow, headless: artifacts on every PR; optional live sync via secrets. |

## Diagram

```
  Developer surfaces (any of these can trigger the flow)
 ┌──────────────┬──────────────┬──────────────┬──────────────┐
 │  Claude Code │    Codex     │   Copilot    │   VS Code    │
 ├──────────────┼──────────────┼──────────────┼──────────────┤
 │   Terminal   │GitHub Actions│ Azure DevOps │     ...      │
 └──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘
        │              │              │              │
        └──────────────┴──────┬───────┴──────────────┘
                              │  "make this branch QA-ready"
                              ▼
               ┌──────────────────────────────┐
               │   Repo automation (scripts/) │
               │                              │
               │  changed-endpoints.json ──┐  │
               │  test-policy.json ────────┤  │
               │  test-templates/*.js ─────┤  │
               │                           ▼  │
               │   generate-postman-collection│
               │              │               │
               │              ├─► qa-handoff-summary.md
               │              ▼               │
               │   sync-postman-workspace     │
               │   (dry-run | Postman API)    │
               └──────────────┬───────────────┘
                              │
                              ▼
               ┌──────────────────────────────┐
               │   Postman QA Workspace       │
               │   "Newforma QA Workspace"    │
               │                              │
               │  Collection (v2.1)           │
               │   ├─ Health                  │
               │   ├─ Project Documents       │
               │   └─ Project Submittals      │
               │  Environment: Newforma QA    │
               │  Standard tests on every req │
               └──────────────┬───────────────┘
                              │  one click / the Postman CLI run
                              ▼
                       QA runs the collection
              (executable handoff, consistent every time)
```

Many surfaces, one destination. The developer-side trigger is interchangeable; the QA-side artifact is always the same: a runnable collection with standard tests in the shared workspace.

## Flow (happy path)

1. Developer finishes a branch and prompts their assistant with the hero prompt.
2. Assistant runs `npm run make:qa-ready`:
   - reads `demo/changed-endpoints.json` (changed-endpoint detection),
   - generates the collection (requests + examples + injected tests per policy),
   - verifies the environment file,
   - syncs to the QA workspace (dry-run without credentials),
   - writes `demo/qa-handoff-summary.md`.
3. Optionally, assistant runs `npm run test:postman` (the Postman CLI) to verify everything is green against the local API.
4. The summary lands on the PR; QA opens the workspace and runs the collection.
