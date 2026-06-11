# Customer Context — Why This Demo Is Shaped This Way

Sales-engineering background for presenters. Internal framing; don't read on camera.

## The situation

- **Fragmented Postman usage.** Different teams use Postman differently; collections are scattered across personal and team workspaces, with no consistent structure, naming, or test conventions. There is no single place QA can trust as "the" handoff.
- **QA wants visibility, not handholding.** QA's ask is not more meetings — it's a reliable, self-explanatory starting point: what changed, how to call it, what passing looks like.
- **Developers are busy, meeting-averse, and already heavy AI users.** Any solution that adds ceremony for developers will be ignored. A solution that rides the tools they already use — especially AI assistants — has a real adoption path.
- **Volume is rising.** QA sees more PRs and more bugs getting through. The regression suite is large enough that a full pass takes multiple QA people multiple days, so anything that improves the quality of what *enters* QA has outsized leverage.

## The thesis of the demo

**Reduce QA handoff friction.** This is not about teaching developers Postman, and it is explicitly *not* about governing or monitoring developers. The developer's only action in the demo is one sentence to an assistant they already use. Everything QA-shaped (test policy, templates, workspace conventions) is owned by QA and applied automatically.

## Value framing

**For developers:**
- No manual handoff doc, no walkthrough meeting, no "got five minutes?" pings.
- Fewer interruptions after merge — QA has what it needs the first time.
- Less rework, because negative cases (auth, validation, not-found, empty results) are exercised before QA ever files a bug.

**For QA:**
- An *executable* collection instead of tribal knowledge — open the workspace, pick the environment, run.
- Standard tests on every endpoint, identical across teams, defined by QA in `qa/postman/test-policy.json`.
- Consistent request/response examples for exploratory work.
- A reliable starting point that scales with PR volume — and shrinks the "figure out what changed" tax on every regression cycle.

## Things to avoid saying

- Anything implying developer activity is tracked, scored, or audited ("governance", "enforcement", "compliance" framed at devs).
- "This teaches your developers Postman" — wrong direction; devs may never open Postman in this flow.
- Invented customer quotes or metrics. Use the dynamics above qualitatively.

## One-line positioning

> Developers keep their tools. QA gets a consistent Postman handoff.
