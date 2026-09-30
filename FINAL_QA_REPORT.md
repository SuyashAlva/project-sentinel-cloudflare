# Project Sentinel — Final QA Report

**Audit date:** 2026-09-30  
**Environment:** Local Wrangler demo plus deployed Cloudflare Worker. Production URL: <https://project-sentinel.suyashalva2121.workers.dev>. Final deployment version: `f89240b7-9e40-41e6-988c-dffc144fbac8`.

## Overall status

**PASS for the local demo and requested production Cloudflare flows.** Wrangler OAuth authentication was verified, the existing Worker deployed, and a real browser session exercised Workers AI with Llama 3.3, the model-selected project-status tool, production Workflow, and Durable Object memory. Responsive mobile/tablet and full assistive-technology QA remain unverified.

## Features tested

| Area | Status | Evidence |
|---|---|---|
| Worker and static frontend startup | PASS | Local demo returned `/api/health` 200; the deployed production UI and APIs ran in the browser. |
| Cloudflare authentication | PASS | `wrangler whoami` succeeded after Wrangler OAuth login. |
| Workers deployment | PASS | `npm run deploy` published `project-sentinel`; Cloudflare returned the production URL and version ID recorded above. |
| Required production bindings | PASS | Production deploy reports `AI`, `SENTINEL_STORE` Durable Object, `RISK_ANALYSIS` Workflow, and `ASSETS`. |
| Workers AI | PASS | The deployed `AI` binding successfully completed inference; grounded fallback is now reported separately. |
| Llama 3.3 inference | PASS | Production activity showed `@cf/meta/llama-3.3-70b-instruct-fp8-fast` after a successful non-empty model response. |
| Tool calling | PASS | Production activity UI showed `Llama selected get_project_status`; backend only sets this after receiving the configured model’s matching tool call and passing verified tool output to the synthesis call. |
| Workflow | PASS | Deployed Alpha analysis reached `COMPLETE`; findings and recommendations were rendered and persisted in production storage. |
| Persistent memory | PASS | Saved a decision, opened a fresh tab, confirmed it loaded from project memory, and asked a recall question; the exact stored note was returned. |
| End-to-end production chat | PASS | Final deployment answered the Alpha schedule question with correct seeded figures through Workers AI → model tool call → deterministic project status → LLM synthesis. |
| API validation and error responses | PASS | Invalid chat JSON and empty chat returned 400; unknown project memory/analysis and workflow IDs returned clean 404s, with no stack trace exposed. |
| Project data and analytics | PASS | Live `/api/projects` values matched the seeded dataset and deterministic calculations. |
| Grounded chat | PASS | Ran all ten requested prompts against the local Worker; responses included seeded values and Delta returned a clean not-found response. |
| Alpha/Beta comparison | FIXED | Found comparison initially only described the first named project. Added deterministic multi-project evidence and regression coverage; later live comparison returned Alpha and Beta values. |
| Project memory | PASS | Saved/read a project note across separate API requests; follow-up constraint questions returned saved notes. The app uses the Durable Object store, not only a browser variable. |
| Risk Workflow | PASS | Started Alpha analysis (202), polled it to `complete`, checked its task/dependency/resource/cost findings and recommendations, then read the persisted result from project memory. |
| Workflow result display | FIXED | The completed result is now rendered with its findings and recommended actions; latest persisted analysis is loaded when project memory is opened or a project is switched. |
| Project switching | PASS | Root-thread browser QA verified Alpha/Beta/Gamma switching, correct stats, Gamma blocker chat, recovery plan, workflow completion, and persisted result display on reload. |
| Previously inert controls | FIXED | Overview now navigates to the dashboard; Help and Notifications respond; critical-path action scrolls/focuses the map and names task IDs; unsupported Add project and workspace-options controls are disabled with explanations. |
| TypeScript and unit checks | PASS | `npm run check`; `npm test` (5 tests); `node --check public/app.js`. |
| Wrangler config/build validation | PASS | `npx wrangler types --check` reports generated types current. `npx wrangler deploy --dry-run --outdir /private/tmp/project-sentinel-dry-run` compiled and listed AI, Durable Object, Workflow, and Assets bindings. Wrangler emitted a sandbox log-file `EPERM`, but completed these checks. |
| Desktop layout and browser console | PASS | Root-thread browser pass at 1280×720 found no horizontal overflow and no browser console messages. |
| Tablet/mobile breakpoints, keyboard-only and screen-reader audit | NOT VERIFIED | Responsive CSS, focus styles, semantic controls, and reduced-motion rules were source-reviewed. IAB viewport could not be changed for tablet/mobile testing, and a full keyboard/screen-reader audit is not claimed. |

## Chatbot verification

All ten assignment prompts were sent to `POST /api/chat` in the local grounded demo:

1. **“Why is Project Alpha behind schedule?”** — 12 days late; 7 delayed tasks; 3 blocked dependencies; 94% capacity; 8.4% cost variance.
2. **Resource utilization** — 94%.
3. **Cost variance** — 8.4% over budget; `$455,280` actual against `$420,000` budget.
4. **Blocking work** — 3 open tasks wait on overdue dependencies.
5. **Recovery plan** — actions referred to seeded task IDs A-17 and A-14 and reported an estimated recovery of up to 8 days.
6. **Compare Alpha and Beta** — both projects’ schedule, cost, capacity, risk, delays, and blockers were returned from deterministic project evidence.
7. **Remember Alpha’s client deadline cannot move** — note saved to project memory.
8. **What constraints does Alpha have?** — saved note returned.
9. **What did I tell you earlier about Alpha?** — saved note returned.
10. **Tell me about Project Delta** — “I can’t find Project Delta. I can help with Alpha, Beta, or Gamma.”

For the production main flow, a new browser session asked “Why is Project Alpha behind schedule?” and received “12 days behind schedule,” “7 delayed tasks,” “3 blocked dependencies,” and “94%” capacity. Activity displayed the exact configured Llama model, the model-selected `get_project_status` call, and completed synthesis. The final API now reports `mode: workers-ai` and `aiModel` only after a non-empty inference response following a valid model-selected tool call; memory lookups deliberately use the grounded Durable Object path. Alpha’s key figures were independently checked against the seeded data: baseline deadline Nov 14, forecast Nov 26, budget `$420,000`, actual cost `$455,280`, utilization 94%, 7 delayed tasks, 3 blocked dependencies, risk 70/100 High. The cost variance is `(455280 - 420000) / 420000 = 8.4%`; schedule variance is 12 days. The risk index is computed deterministically in `src/projects.ts`.

## Workflow and memory verification

Both local and production Workflow requests completed. The production dashboard showed `RISK ANALYSIS / COMPLETE`, seven delayed task IDs, 3 blocked dependencies, 94% utilization, 8.4% cost variance, and three task-grounded recommendations. The analysis was stored in the production Durable Object and appeared again after opening a new tab.

A production decision was saved through the UI, then retrieved from a fresh browser tab with a new conversation ID. The follow-up “What did I tell you earlier about Alpha?” returned the exact stored decision from the production Durable Object. Latest workflow findings also loaded in that fresh tab.

## UI, interaction, accessibility, and responsive review

Root-thread browser QA exercised local project switching and the deployed production chat, memory, and workflow flows. The landing-to-app entry and project dashboard are served by the Worker. The source includes responsive breakpoints and a `prefers-reduced-motion` override. Chat input has a label and live region; the decision dialog labels its input; project selection exposes `aria-current`; visible focus styles exist for project buttons.

The audit found controls that looked interactive but had no behavior. These were fixed: Overview navigates to the dashboard, Help and Notifications give concise responses, and the critical-path control brings the dependency map into view and names its task IDs. Adding a project and workspace options are clearly disabled because those features are not in this demo. Root-thread browser QA confirmed the controls, persisted memory/workflow results after reload, the 1280×720 layout, and an empty browser console.

A complete keyboard/screen-reader and real tablet/mobile visual pass remains unverified. Some decorative metric labels use small type, so visual legibility at narrow widths deserves a dedicated device pass. Reduced-motion handling is present in CSS; animation smoothness/CPU was source-reviewed, not profiled.

## Security and performance observations

- **PASS (repository scan):** no hardcoded API keys, bearer credentials, or secret values found in app source/config. Workers AI is accessed through the Cloudflare `AI` binding.
- **PASS (review):** no dynamic `eval`/`Function` or shell/tool execution path found. User-facing chat errors are concise; backend AI fallback logs only an inference error message.
- **LIMITATION:** this assignment demo has no authentication or tenant isolation; README calls this out. Do not expose the unauthenticated demo to untrusted users with real project data.
- Project data is small and served as static assets; no meaningful bundle or asset performance issue was found. No browser network waterfall or CPU profile was collected.

## Bugs discovered and fixes

- **FIXED — project comparison used only the first named project.** Comparison now gathers all named project rows and returns deterministic side-by-side evidence; a regression test covers Alpha/Beta.
- **FIXED — completed Workflow findings were only announced by a toast.** Findings/recommendations now render in the activity area and the latest saved analysis is loaded from project memory.
- **FIXED — inert controls.** Overview, Help, Notifications, and critical path now act; unsupported project/workspace controls are disabled and explained.
- **FIXED — chat memory phrasing and duplicate saves.** The leading “that” in “Remember that …” is removed before saving. Duplicate notes are checked case-insensitively before saving. Unknown project IDs in memory routes are rejected.
- **FIXED — missing Workflow status error exposed an internal stack trace.** Unknown run IDs now return a clean 404; unexpected status-service failures return a generic 503.

## Remaining limitations

- Tablet/mobile and assistive-technology QA needs a dedicated browser/device pass.
- One local Workerd log reported a canceled poll/request during UI QA, but the same workflow subsequently completed and its result was persisted. This was non-blocking and not reproducible as a failed workflow.
- Seeded data is a demonstration snapshot, not a live project-system integration; risk is a transparent heuristic, not a prediction.

## Demo walkthrough

1. Open the app and enter Project Sentinel.
2. Select Alpha, Beta, or Gamma; confirm the heading, status, and metric cards change.
3. Ask “Why is Alpha behind schedule?” and review the evidence-backed figures.
4. Ask “Create a recovery plan for Alpha.” to see task-grounded actions.
5. Choose **Run risk analysis** and wait for Workflow status to become Complete; review findings/recommendations in the Activity area.
6. Save “The client deadline cannot move.” as a decision.
7. Ask “What did I tell you earlier about Alpha?”; the saved note should be returned.

Production URL: <https://project-sentinel.suyashalva2121.workers.dev>. Production request flow: browser sends `/api/chat` → Llama 3.3 selects `get_project_status` → Worker runs deterministic project analytics → verified facts are returned to Llama for synthesis → answer and tool/model status return to the UI. Project memory and workflow findings persist in the SQLite-backed Durable Object; Cloudflare Workflow coordinates analysis steps and saves the completed result. Local deterministic mode remains available with `npm run dev:demo`.

Cloudflare documentation confirms the configured Llama model supports function calling and returns `tool_calls`: [Llama 3.3 model page](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/), [traditional function calling](https://developers.cloudflare.com/workers-ai/features/function-calling/traditional/).
