import { WorkflowEntrypoint } from "cloudflare:workers";
import { findProject, statusEvidence, delayedTasks, blockedDependencies, recoveryPlan } from "./projects";
import { storeRequest, type Env } from "./platform";

type Params = { projectId: string };

export class RiskAnalysisWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: { payload: Params }, step: { do<T>(name: string, fn: () => Promise<T>): Promise<T> }): Promise<unknown> {
    const project = await step.do("load-project", async () => {
      const found = findProject(event.payload.projectId);
      if (!found) throw new Error("Project not found");
      return found;
    });
    const delays = await step.do("analyze-delays", async () => delayedTasks(project));
    const dependencies = await step.do("analyze-dependencies", async () => blockedDependencies(project));
    const resources = await step.do("analyze-resources", async () => project.resourceUtilizationPercent);
    const cost = await step.do("analyze-cost", async () => statusEvidence(project).costVariancePercent);
    const findings = await step.do("generate-findings", async () => ({ evidence: statusEvidence(project), delayedTaskIds: delays.map((task) => task.id), blockedDependencies: dependencies, resourceUtilizationPercent: resources, costVariancePercent: cost }));
    const recommendations = await step.do("generate-recommendations", async () => recoveryPlan(project));
    await step.do("persist-analysis", async () => {
      const id = this.env.SENTINEL_STORE.idFromName("project-sentinel");
      const response = await this.env.SENTINEL_STORE.get(id).fetch("https://store.internal/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "save-analysis", projectId: project.id, messages: { findings, recommendations, completedAt: new Date().toISOString() } }) });
      if (!response.ok) throw new Error("Could not persist analysis");
      return true;
    });
    return { findings, recommendations };
  }
}
