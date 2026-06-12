# Screen Flow — 8 Screens

What to have on screen, in order. Pre-flight: `npm install` done, `npm run dev` running in a hidden terminal, Postman open in the background with the **Newforma QA Workspace** (or ready to import), font size up.

---

## Screen 1 — The repo (VS Code / terminal)

- Repo open in VS Code, file tree visible: `src/`, `qa/postman/`, `demo/`, `postman/`.
- **Say:** developers live here; this is a normal Express + TypeScript service.
- This is where the "I'm showing this from VS Code, but…" framing line lands.

## Screen 2 — The changed endpoints (code)

- Open `src/routes/documents.ts` and `src/routes/submittals.ts` side-by-side, or `src/controllers/documents.ts` (the new search logic).
- Optionally flash `demo/changed-endpoints.json` — "the branch knows what changed."
- **Say:** two new endpoints on this branch — search and create-submittal.

## Screen 3 — The hero prompt (Claude Code)

- Open the AI assistant (Claude Code panel or terminal) and paste the hero prompt from `demo/claude-prompts.md`.
- Let the assistant decide to run `npm run make:qa-ready`.
- **Fallback:** if no assistant is available on the demo machine, say "the assistant translates this into the repo's own automation" and run the command yourself — same output.

## Screen 4 — `npm run make:qa-ready`

- Full-screen the terminal. The output is designed to be read aloud: detected endpoints → collection generated → standard tests applied → dry-run sync to "Newforma QA Workspace" → summary written.
- Pause on the final ✅ block.

## Screen 5 — The collection in Postman

- **Preferred:** Postman with the collection imported (drag in both JSON files from `postman/`): expand Health / Project Documents / Project Submittals; click a request; show the **Tests** tab (QA's standard tests) and a saved **example response**.
- **Fallback (no Postman / no credentials):** open the generated `postman/Newforma Project APIs - QA Handoff Demo.postman_collection.json` in VS Code, folded to the folder level — "valid Collection v2.1, ready to import or sync."

## Screen 6 — The collection run

- **Preferred:** Postman Collection Runner with the **Newforma QA Local** environment — all green.
- **Fallback:** terminal: `npm run test:postman` — the Postman CLI CLI output, every assertion passing against the locally running API. Equally credible; arguably more "developer."

## Screen 7 — The QA handoff summary

- Open `demo/qa-handoff-summary.md` in rendered Markdown preview.
- Scroll: changed endpoints table → test coverage → environment variables → how to run.
- **Say:** this lands on the PR / Jira ticket / Azure DevOps item automatically.

## Screen 8 — Close (tool-agnostic message)

- Either the architecture diagram in `docs/architecture.md` (many surfaces → one QA workspace) or simply the README's bolded line.
- **Say the closing line:** "Developers keep their tools. QA gets a consistent Postman handoff."

---

## Fallback matrix (if live sync is unavailable)

| Risk | Fallback |
| --- | --- |
| No Postman API credentials | Dry-run sync output (Screen 4) already shows the workspace targeting; import the JSON manually for Screens 5–6. |
| No Postman app at all | Screen 5: collection JSON in VS Code. Screen 6: `npm run test:postman` (the Postman CLI). |
| No AI assistant on the demo machine | Screen 3: show the prompt, then run `npm run make:qa-ready` directly — "this is exactly what the assistant runs." |
| API won't start | `npm run test:postman` prints a clear "start the API" message; restart `npm run dev`. Worst case, Screens 5 and 7 still carry the story. |
