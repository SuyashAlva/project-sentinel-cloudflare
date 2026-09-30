export class SentinelStore {
  private state: DurableObjectState;
  constructor(state: DurableObjectState) { this.state = state; }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    const body = await request.json() as { action?: string; projectId?: string; conversationId?: string; note?: string; messages?: Array<{ role: string; content: string }> };
    if (body.action === "history" && body.conversationId) {
      return Response.json({ messages: await this.state.storage.get(`conversation:${body.conversationId}`) ?? [] });
    }
    if (body.action === "append" && body.conversationId) {
      const key = `conversation:${body.conversationId}`;
      const previous = await this.state.storage.get<Array<{ role: string; content: string; createdAt: string }>>(key) ?? [];
      const fresh = (body.messages ?? []).map((item) => ({ ...item, createdAt: new Date().toISOString() }));
      await this.state.storage.put(key, [...previous, ...fresh].slice(-40));
      return Response.json({ saved: fresh.length });
    }
    if (body.action === "notes" && body.projectId) {
      return Response.json({ notes: await this.state.storage.get<string[]>(`notes:${body.projectId}`) ?? [] });
    }
    if (body.action === "save-note" && body.projectId && body.note) {
      const key = `notes:${body.projectId}`;
      const notes = await this.state.storage.get<string[]>(key) ?? [];
      const duplicate = notes.some((saved) => saved.trim().toLocaleLowerCase() === body.note!.trim().toLocaleLowerCase());
      if (!duplicate) notes.push(body.note.trim());
      await this.state.storage.put(key, notes.slice(-20));
      return Response.json({ saved: !duplicate, notes });
    }
    if (body.action === "save-analysis" && body.projectId) {
      await this.state.storage.put(`analysis:${body.projectId}`, body.messages);
      return Response.json({ saved: true });
    }
    if (body.action === "analysis" && body.projectId) {
      return Response.json({ analysis: await this.state.storage.get(`analysis:${body.projectId}`) ?? null });
    }
    return Response.json({ error: "Unknown storage action" }, { status: 400 });
  }
}
