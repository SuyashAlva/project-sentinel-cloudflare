import { describe, expect, it } from "vitest";
import { blockedDependencies, comparisonAnswer, comparisonIds, costVariancePercent, delayedTasks, findProject, projects, recoveryPlan, riskIndex, riskLevel, scheduleVarianceDays, statusEvidence } from "../src/projects";

describe("seeded project analytics", () => {
  it("resolves the demo projects and keeps unknown projects missing", () => {
    expect(findProject("Alpha")?.id).toBe("alpha");
    expect(findProject("delta")).toBeUndefined();
    expect(projects).toHaveLength(3);
  });

  it("computes Alpha's health from deterministic task and project data", () => {
    const alpha = findProject("alpha")!;
    expect(scheduleVarianceDays(alpha)).toBe(12);
    expect(costVariancePercent(alpha)).toBe(8.4);
    expect(riskIndex(alpha)).toBe(70);
    expect(riskLevel(alpha)).toBe("High");
    expect(delayedTasks(alpha)).toHaveLength(7);
    expect(blockedDependencies(alpha)).toBe(3);
    expect(statusEvidence(alpha)).toMatchObject({ scheduleVarianceDays: 12, costVariancePercent: 8.4, resourceUtilizationPercent: 94, riskIndex: 70, riskLevel: "High", delayedTasks: 7, blockedDependencies: 3 });
  });

  it("computes Beta and Gamma signals directly from their own project data", () => {
    const beta = statusEvidence(findProject("beta")!);
    expect(beta).toMatchObject({ scheduleVarianceDays: 0, costVariancePercent: 1.2, resourceUtilizationPercent: 76, delayedTasks: 0, blockedDependencies: 0, riskIndex: 6, riskLevel: "Low" });
    const gamma = statusEvidence(findProject("gamma")!);
    expect(gamma).toMatchObject({ scheduleVarianceDays: 4, costVariancePercent: 3.1, resourceUtilizationPercent: 88, delayedTasks: 2, blockedDependencies: 2, riskIndex: 35, riskLevel: "Moderate" });
    expect(recoveryPlan(findProject("beta")!).expectedScheduleImpactDays).toBe(0);
  });

  it("grounds recovery actions in the project's current evidence", () => {
    const plan = recoveryPlan(findProject("alpha")!);
    expect(plan.actions.join(" ")).toContain("A-17");
    expect(plan.actions.join(" ")).toContain("A-14");
    expect(plan.expectedScheduleImpactDays).toBeGreaterThan(0);
    expect(plan.evidence.project).toBe("Project Alpha");
  });

  it("compares multiple projects from deterministic status evidence", () => {
    const ids = comparisonIds("Compare Alpha and Beta.");
    const result = comparisonAnswer(ids)!;
    expect(ids).toEqual(["alpha", "beta"]);
    expect(result.message).toContain("Project Alpha: at risk, 12 days late, 8.4% cost variance, 94% capacity, risk 70/100");
    expect(result.message).toContain("Signal platform: on track, on schedule, 1.2% cost variance, 76% capacity, risk 6/100");
    expect(result.evidence).toHaveLength(2);
  });
});
