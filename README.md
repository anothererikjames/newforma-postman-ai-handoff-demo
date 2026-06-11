# Newforma Postman AI-Handoff Demo

**The 5-minute story:** a developer finishes a feature branch, asks their AI assistant to *"make this branch QA-ready"*, and the assistant generates an executable Postman collection — requests, examples, QA's standard tests, endpoint-specific negative tests — plus a paste-ready QA handoff summary, targeted at the shared QA workspace.

> **Developers keep their tools. QA gets a consistent Postman handoff.**

This workflow is **tool-agnostic**. It can be triggered from **Claude Code, Codex, GitHub Copilot, a plain terminal, VS Code, GitHub Actions, or Azure DevOps pipelines**. Postman is the shared QA handoff layer; VS Code is only a convenient surface for the demo.

## What's in the repo

- A small, realistic **project document management API** (Express + TypeScript): documents, document search, and submittals for a construction project — with bearer auth, validation, and a consistent error shape.
- `demo/changed-endpoints.json` — simulates "what changed on this branch" (two new endpoints).
- `qa/postman/test-templates/` + `qa/postman/test-policy.json` — QA's standard test library and the policy for when each test applies.
- `scripts/` — the automation the AI assistant invokes: generate collection → sync workspace (dry-run by default) → write QA handoff summary.
- `.github/workflows/qa-handoff.yml` — the same flow running headless in CI.

## Prerequisites

- Node.js 18.17+ (Node 20 recommended)
- npm
- Optional: Postman desktop/web for importing the generated collection
- Optional: a Postman API key + QA workspace ID for live sync (never required)

## Setup

```bash
git clone https://github.com/anothererikjames/newforma-postman-ai-handoff-demo.git
cd newforma-postman-ai-handoff-demo
npm install
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the API on http://localhost:3000 (watch mode) |
| `npm run build` / `npm start` | Compile to `dist/` and run the compiled server |
| `npm test` | API integration tests (node:test, no API process needed) |
| `npm run make:qa-ready` | **The hero command** — detect changes → generate collection → dry-run sync → QA summary |
| `npm run generate:collection` | Just regenerate the Postman collection |
| `npm run sync:postman` | Sync to the QA workspace (dry-run unless credentials set) |
| `npm run qa:summary` | Just regenerate `demo/qa-handoff-summary.md` |
| `npm run test:postman` | Run the generated collection against the local API with Newman |

**The two-terminal demo flow:**

```bash
# terminal 1
npm run dev

# terminal 2
npm run make:qa-ready
npm run test:postman
```

## Hero prompt

Paste this into Claude Code (or Codex, Copilot Chat, etc.) from the repo root:

> Make this branch QA-ready. Detect any new or changed API endpoints, create or update the matching Postman collection in the QA workspace, apply our standard test templates, add endpoint-specific negative tests, prepare the QA handoff summary, and run the collection if possible.

The assistant satisfies the prompt by running the repo's own automation (`npm run make:qa-ready`, then `npm run test:postman` if the API is up). More prompts in [`demo/claude-prompts.md`](demo/claude-prompts.md).

## What QA gets

1. **A generated collection** — `postman/Newforma Project APIs - QA Handoff Demo.postman_collection.json` (valid Collection v2.1), organized into Health / Project Documents / Project Submittals, happy paths **and** negative tests.
2. **An environment** — `postman/Newforma QA Local.postman_environment.json` with `baseUrl`, `authToken`, `projectId`, `documentId`, `submittalId`. *Demo-only values; nothing here is a secret.*
3. **Standard tests on every request** — response time, error shape, auth, schema, validation details, empty-results semantics, create semantics (per `qa/postman/test-policy.json`).
4. **Saved response examples** on requests, so QA can see expected shapes without running anything.
5. **A handoff summary** — `demo/qa-handoff-summary.md`, paste-ready for a PR, Jira ticket, or Azure DevOps work item.

## What to show on screen

Follow [`demo/screen-flow.md`](demo/screen-flow.md) — 8 screens from "repo in VS Code" to "tool-agnostic close", with fallbacks. Full talk track in [`demo/presenter-script.md`](demo/presenter-script.md).

## Presenter talk track (condensed)

1. *"Your developers already move fast — and AI assistants make them faster. The bottleneck is the handoff: QA gets a PR link and tribal knowledge."*
2. *"I'm showing this from VS Code, but the important point is not VS Code. This same pattern can be triggered from Claude Code, Codex, Copilot, terminal, GitHub Actions, Azure DevOps, or wherever your developers already work."*
3. Show the branch's new endpoints (`src/routes/`, `demo/changed-endpoints.json`).
4. Paste the hero prompt into the AI assistant → it runs `npm run make:qa-ready`.
5. Show the output: collection generated, standard tests applied, dry-run sync to the **Newforma QA Workspace**, summary written.
6. Import the collection + environment into Postman (or show `npm run test:postman` — Newman, all green).
7. Open `demo/qa-handoff-summary.md` — *"this is what lands on the PR for QA."*
8. Close: *"Developers keep their tools. QA gets a consistent Postman handoff."*

## Fallback when Postman credentials are unavailable

Nothing in the demo requires credentials:

- `npm run make:qa-ready` runs the sync in **dry-run mode** and prints exactly what would be created/updated in the QA workspace.
- Import the generated collection + environment into Postman manually (drag-and-drop both JSON files) and run the collection there, **or** show `npm run test:postman` (Newman CLI) — same tests, same results.
- The message is unchanged: Postman is the shared destination for the QA handoff; dry-run just means the last hop is simulated.

To go live, copy `.env.example` to `.env`, set `POSTMAN_API_KEY` and `POSTMAN_WORKSPACE_ID`, and re-run `npm run sync:postman`. See [`demo/postman-workspace-setup.md`](demo/postman-workspace-setup.md).

## Docs

- [`docs/architecture.md`](docs/architecture.md) — components + ASCII diagram
- [`docs/customer-context.md`](docs/customer-context.md) — why this demo is shaped this way
- [`docs/implementation-notes.md`](docs/implementation-notes.md) — what is real vs simulated
- [`demo/`](demo/) — presenter script, screen flow, prompts, workspace setup

*All project data in this repo (projects, documents, submittals, people, companies) is fictional.*
