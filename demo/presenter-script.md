# Presenter Script — 5 Minutes

> Audience: development leaders and senior developers. This is a workflow story, **not** a feature tour. The arc: devs already move fast → AI makes them faster → QA needs executable handoffs, not tribal knowledge → a dev asks AI to make the branch QA-ready → Postman gets updated → QA opens the workspace and runs the collection.

---

## 0:00 — Open (the problem)

> "Your developers already move fast. They're heads-down in their editors and their AI assistants are making them faster every quarter. The place that speed turns into friction is the handoff: a PR merges, QA gets a link and maybe a Slack message, and then someone spends an afternoon reverse-engineering what changed, what to call, and what 'working' even looks like. Multiply that across teams and you get more PRs, more bugs slipping through, and regression cycles that take multiple people multiple days."

> "What I want to show you is a small pattern that removes that friction — without asking developers to change how they work, attend a meeting, or even open Postman."

**Early framing line (say this verbatim):**

> "I'm showing this from VS Code, but the important point is not VS Code. This same pattern can be triggered from Claude Code, Codex, Copilot, terminal, GitHub Actions, Azure DevOps, or wherever your developers already work."

## 0:45 — The branch (what changed)

*Screen: repo open in VS Code, `src/routes/` and `demo/changed-endpoints.json` visible.*

> "Here's a feature branch on a project-document API — the kind of thing your teams ship every week. This branch adds two endpoints: document search, and creating a submittal. Normally this is where the handoff pain starts: new endpoints, new request bodies, new error cases — all in the developer's head."

## 1:30 — The ask (hero prompt)

*Screen: AI assistant panel/terminal. Paste the hero prompt.*

> "Instead of writing a handoff doc, the developer asks their assistant:"

> *"Make this branch QA-ready. Detect any new or changed API endpoints, create or update the matching Postman collection in the QA workspace, apply our standard test templates, add endpoint-specific negative tests, prepare the QA handoff summary, and run the collection if possible."*

> "One sentence. The assistant runs the repo's own automation."

## 2:00 — The run

*Screen: `npm run make:qa-ready` output.*

> "Watch what happens: it detects the two changed endpoints, generates a Postman collection with folders for documents and submittals, and — this is the part QA cares about — applies QA's *standard* test policy. Auth checks, schema checks, error-shape checks, response-time budgets, plus endpoint-specific negatives: missing token, malformed body, unknown project, empty search results. Then it targets the shared QA workspace and writes a handoff summary."

> "The test policy lives in the repo, owned by QA. The developer didn't write a single test here — and also couldn't forget one."

## 3:00 — What QA sees

*Screen: collection imported in Postman (or the generated JSON), then the collection run / the Postman CLI output.*

> "QA opens the workspace and this is what's waiting: an executable collection with examples on every request, and one click to run it. Every assertion is QA's own standard — consistent across every team that hands off this way. Let's run it… all green, against the real running API."

## 4:00 — The artifact

*Screen: `demo/qa-handoff-summary.md`.*

> "And the PR gets this summary automatically: what changed, what's covered, what environment to use, how to run it. Paste-ready for GitHub, Jira, or Azure DevOps. No meeting, no 'hey, got five minutes?', no tribal knowledge."

## 4:30 — Close

> "Notice what we *didn't* do. We didn't ask developers to learn Postman, fill out a template, or change tools. The trigger can live in Claude Code, Copilot, a terminal alias, or a CI job — the destination is always the same shared QA workspace. QA gets visibility and a reliable starting point; developers get fewer interruptions and less rework."

**Closing line (say this verbatim):**

> "Developers keep their tools. QA gets a consistent Postman handoff."

---

### Timing guide

| Segment | Time |
| --- | --- |
| Problem + framing line | 0:00–0:45 |
| The branch | 0:45–1:30 |
| Hero prompt | 1:30–2:00 |
| make:qa-ready run | 2:00–3:00 |
| Postman / collection run | 3:00–4:00 |
| Handoff summary | 4:00–4:30 |
| Close | 4:30–5:00 |
