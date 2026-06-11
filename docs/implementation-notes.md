# Implementation Notes — Real vs Simulated

Keeping the demo credible means being precise about what actually runs and what is staged. If asked on a call, answer from this table.

| Piece | Status | Detail |
| --- | --- | --- |
| Local API | **Real demo code** | A genuine Express + TypeScript service (`src/`) with auth middleware, validation, seeded data, and consistent error shapes. It is demo code, not Newforma's product. All data is fictional. |
| Changed-endpoint detection | **Simulated** | `demo/changed-endpoints.json` is a checked-in fixture that stands in for "diff this branch against main". In a real rollout this would be produced by diffing route definitions, an OpenAPI spec, or annotations in CI. |
| Collection generation | **Real** | `scripts/generate-postman-collection.ts` deterministically builds a valid Postman Collection v2.1 from the metadata + QA policy + templates. Nothing is hand-edited; delete the output and regenerate it live if anyone asks. |
| Standard test injection | **Real** | The sandbox scripts in `qa/postman/test-templates/` are injected per `qa/postman/test-policy.json`, with placeholders (expected status, required fields, latency budget) resolved at generation time. |
| Newman run | **Real (when configured)** | `npm run test:postman` runs the generated collection against the locally running API. The tests pass because the API and the templates agree on behavior — that contract is the point of the demo. |
| Postman workspace sync | **Live only with credentials** | `scripts/sync-postman-workspace.ts` defaults to a dry run that prints the exact upsert plan. With `POSTMAN_API_KEY` + `POSTMAN_WORKSPACE_ID` it performs real list/find/PUT-or-POST calls against the Postman API. No credentials are stored in the repo. |
| MCP / agent interaction | **Assistant invoking local scripts** | In the demo, Claude Code (or any assistant) satisfies the hero prompt by running the repo's npm scripts — optionally plus the Postman API through the sync script. We do not claim a deeper proprietary integration; an MCP server or similar could replace the script layer later without changing the story. |
| CI workflow | **Real, no secrets by default** | `.github/workflows/qa-handoff.yml` builds, tests, regenerates the collection, and uploads collection/environment/summary as artifacts. Live sync is a commented-out, opt-in env block. |

## Design decisions worth knowing

- **The API must match the tests.** The generator and the API are written against the same contract (status codes, error shape `{ error: { code, message, details? } }`, empty-search semantics, `SUB-` ID prefix). If you change one, change the other — `npm test` and `npm run test:postman` both guard this.
- **Dry-run is a first-class path, not a degraded one.** The sync output names the workspace, collection, folders, and environment so the staging is visible even with zero credentials.
- **Dependencies are deliberately minimal.** Runtime: `express` only. Validation is hand-rolled (`src/validation/schemas.ts`) to keep the repo skimmable. Dev: `typescript`, `tsx`, `newman`, types.
- **`npm test` is self-contained.** The integration tests (`tests/api.test.ts`, node:test + fetch) boot the app on an ephemeral port — no separate API process, safe in CI.
- **IDs regenerate.** The collection's `_postman_id` is a fresh UUID each generation; the sync script matches by *name* (or `POSTMAN_COLLECTION_ID` if pinned) so regeneration never forks the collection in the workspace.
