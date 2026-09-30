export interface Env {
  AI?: {
    run(model: string, input: Record<string, unknown>): Promise<unknown>;
  };
  SENTINEL_STORE: DurableObjectNamespace;
  RISK_ANALYSIS?: Workflow;
  ASSETS: Fetcher;
}

export interface DurableObjectNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
}

export interface Workflow {
  create(options: { params: unknown }): Promise<{ id: string }>;
  get(id: string): Promise<{ status(): Promise<{ status: string; output?: unknown; error?: unknown }> }>;
}

export type ChatMessage = { role: "user" | "assistant"; content: string; createdAt: string };

export async function storeRequest(env: Env, body: unknown): Promise<Response> {
  const id = env.SENTINEL_STORE.idFromName("project-sentinel");
  return env.SENTINEL_STORE.get(id).fetch("https://store.internal/", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
  });
}
