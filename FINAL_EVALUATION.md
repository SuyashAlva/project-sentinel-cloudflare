# Final assignment evaluation

| Requirement | Status | Evidence / limitation |
|---|---|---|
| Real LLM | Implemented | Native Cloudflare Workers AI binding calls Llama 3.3 70B. Deployment/account availability is required for live inference. |
| Meaningful AI work | Implemented | The model selects `get_project_status`; a second inference synthesizes the verified tool result. |
| Reliable chatbot | Implemented | Input validation, grounded fallback, unknown-project response, memory context, and persisted turns are included. |
| Genuine tool calling | Implemented | Tool schema is passed to Workers AI; the Worker executes the selected tool against seeded project data. |
| Workflow orchestration | Implemented | One multi-step durable Cloudflare Workflow checks project risks and persists its findings. Requires a Cloudflare account for hosted execution. |
| Persistent memory | Implemented | SQLite-backed Durable Object storage retains conversation turns, notes, and analysis output. |
| Grounded data | Implemented | Seeded values plus deterministic date/dependency analytics; recommendations include task evidence. |
| Polished UI | Implemented | Original editorial landing page and responsive operations console; no reference photography or branding. |
| Tasteful animation | Implemented | Short CSS transitions, signal motion, message entrance, and reduced-motion handling. |
| Original product | Implemented | Project Sentinel identity, layouts, copy, and abstract signal diagrams were created for this app. |
| Cloudflare architecture | Implemented | Worker, Workers AI, SQLite-backed Durable Object, and Workflow bindings are configured. |
| Understandable code | Implemented | Seed data/analytics, API, storage, Workflow, and browser UI are separate small modules. |
| Everything works | Verified locally | Typecheck, unit tests, local Worker API, Durable Object memory, and Workflow execution passed. Hosted Workers AI inference still requires a configured Cloudflare account. |
| Three-minute demo | Ready | Open Alpha, ask why it is behind, create a recovery plan, save a decision, and recall it. |
| Explainable major components | Ready | README diagrams and data flow document the component boundaries. |

## Known demonstration limits

- Projects are intentionally seeded examples. They do not synchronize with a live planning system.
- Authentication and tenant isolation are outside the assignment demo scope.
- Recovery actions are grounded suggestions. Expected schedule recovery is a rough deterministic estimate, not a delivery commitment.
- The Workers AI binding and Workflow need a Cloudflare account to verify deployed behavior; the chat has a deterministic grounded local fallback.
