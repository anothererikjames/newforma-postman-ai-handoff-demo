# Claude Prompts

Realistic prompts for the demo. They work in Claude Code from the repo root, and the same wording works in Codex, Copilot Chat, or any assistant that can run repo commands.

## 1. The hero prompt (use this in the video)

> Make this branch QA-ready. Detect any new or changed API endpoints, create or update the matching Postman collection in the QA workspace, apply our standard test templates, add endpoint-specific negative tests, prepare the QA handoff summary, and run the collection if possible.

Expected behavior: the assistant runs `npm run make:qa-ready`, then `npm run test:postman` if the API is running (it will tell you to start `npm run dev` if not).

## 2. Update an existing collection

> The document search endpoint now supports a `status` filter. Update the Postman collection in the QA workspace so the search requests, examples, and tests reflect the new request body, and regenerate the QA handoff summary.

## 3. Create a new collection from scratch

> We don't have a Postman collection for this service yet. Read the routes in `src/routes/` and `demo/changed-endpoints.json`, generate a Collection v2.1 with folders per resource, happy-path and negative requests, and our standard tests from `qa/postman/test-templates/`, and save it under `postman/`.

## 4. Apply the standard test templates

> Apply our standard QA test policy from `qa/postman/test-policy.json` to every request in the generated collection — response time, error shape, auth, schema checks — and add the endpoint-specific negative tests (missing auth, malformed body, unknown project ID, empty search results).

## 5. Generate the QA handoff summary

> Generate the QA handoff summary for this branch: list the new or changed endpoints, the test coverage that was added, the environment variables QA needs, and how to run the collection. Make it paste-ready for a GitHub PR comment.

## 6. Run the collection and summarize failures

> Run the generated Postman collection against my local API with Newman and summarize the results. If any assertions fail, group the failures by endpoint, explain the likely cause in one line each, and tell me whether the fix belongs in the API code or in the tests.

## 7. Convert the handoff into a PR comment

> Take `demo/qa-handoff-summary.md` and post it as a comment on the open PR for this branch (or print the exact `gh pr comment` command if you can't post directly). Keep the tables intact.

---

### Notes for presenters

- Prompts 2–7 are follow-ups; only the hero prompt is needed for the 5-minute video.
- If the assistant asks for permission to run npm scripts, approve — that's the demo: the AI invoking the repo's own automation.
- If live Postman sync isn't configured, the assistant should report "dry run" — that's expected and worth narrating, not hiding.
