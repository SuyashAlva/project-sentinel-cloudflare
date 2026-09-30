export type Task = {
  id: string; title: string; owner: string; plannedEnd: string; actualEnd?: string;
  dependencyIds: string[]; priority: "High" | "Medium" | "Low"; risk: "High" | "Medium" | "Low";
};

export type Project = {
  id: string; name: string; client: string; status: "At Risk" | "On Track" | "Watch";
  resourceUtilizationPercent: number; budget: number; actualCost: number;
  deadline: string; forecastCompletionDate: string; tasks: Task[]; notes: string[];
};

export const projects: Project[] = [
  {
    id: "alpha", name: "Project Alpha", client: "Northstar Systems", status: "At Risk",
    resourceUtilizationPercent: 94,
    budget: 420000, actualCost: 455280, deadline: "2026-11-14", forecastCompletionDate: "2026-11-26",
    tasks: [
      { id: "A-14", title: "Identity bridge integration", owner: "Maya Chen", plannedEnd: "2026-09-18", actualEnd: "2026-09-27", dependencyIds: [], priority: "High", risk: "High" },
      { id: "A-17", title: "Data reconciliation layer", owner: "Jon Bell", plannedEnd: "2026-09-22", dependencyIds: ["A-14"], priority: "High", risk: "High" },
      { id: "A-18", title: "Legacy account migration", owner: "Maya Chen", plannedEnd: "2026-09-25", dependencyIds: ["A-14"], priority: "High", risk: "High" },
      { id: "A-19", title: "Security review", owner: "Priya Nair", plannedEnd: "2026-09-26", dependencyIds: ["A-17"], priority: "High", risk: "Medium" },
      { id: "A-20", title: "Cutover rehearsal", owner: "Jon Bell", plannedEnd: "2026-09-29", dependencyIds: ["A-18", "A-19"], priority: "High", risk: "High" },
      { id: "A-21", title: "Customer acceptance", owner: "Elena Ruiz", plannedEnd: "2026-09-29", actualEnd: "2026-09-30", dependencyIds: ["A-20"], priority: "Medium", risk: "Medium" },
      { id: "A-22", title: "Operations handoff", owner: "Elena Ruiz", plannedEnd: "2026-09-29", dependencyIds: ["A-21"], priority: "Medium", risk: "Low" },
    ],
    notes: []
  },
  {
    id: "beta", name: "Signal platform", client: "Meridian Labs", status: "On Track",
    resourceUtilizationPercent: 76,
    budget: 280000, actualCost: 283360, deadline: "2026-12-02", forecastCompletionDate: "2026-12-02",
    tasks: [
      { id: "B-04", title: "Event schema", owner: "Alex Kim", plannedEnd: "2026-10-04", actualEnd: "2026-10-03", dependencyIds: [], priority: "High", risk: "Low" },
      { id: "B-07", title: "Streaming pipeline", owner: "Sam Okafor", plannedEnd: "2026-10-09", dependencyIds: ["B-04"], priority: "High", risk: "Medium" },
      { id: "B-11", title: "Insight dashboard", owner: "Alex Kim", plannedEnd: "2026-10-14", dependencyIds: ["B-07"], priority: "Medium", risk: "Low" },
    ],
    notes: []
  },
  {
    id: "gamma", name: "Fieldwork mobile", client: "Cedar & Co.", status: "Watch",
    resourceUtilizationPercent: 88,
    budget: 195000, actualCost: 201045, deadline: "2026-11-21", forecastCompletionDate: "2026-11-25",
    tasks: [
      { id: "G-03", title: "Offline sync engine", owner: "Ravi Shah", plannedEnd: "2026-09-20", dependencyIds: [], priority: "High", risk: "High" },
      { id: "G-06", title: "Device test matrix", owner: "Noor Ali", plannedEnd: "2026-09-25", dependencyIds: ["G-03"], priority: "High", risk: "Medium" },
      { id: "G-09", title: "Pilot rollout", owner: "Noor Ali", plannedEnd: "2026-10-01", dependencyIds: ["G-06"], priority: "Medium", risk: "Medium" },
    ],
    notes: []
  }
];

export function findProject(idOrName: string): Project | undefined {
  const key = idOrName.toLowerCase().trim();
  return projects.find((project) => project.id === key || project.name.toLowerCase().includes(key) || key === project.id);
}

export function delayedTasks(project: Project, today = "2026-09-30"): Task[] {
  return project.tasks.filter((task) => task.actualEnd ? task.actualEnd > task.plannedEnd : task.plannedEnd < today);
}

export function blockedDependencies(project: Project, today = "2026-09-30"): number {
  const overdue = new Set(project.tasks.filter((task) => !task.actualEnd && task.plannedEnd < today).map((task) => task.id));
  return project.tasks.reduce((count, task) => count + (task.actualEnd ? 0 : task.dependencyIds.filter((id) => overdue.has(id)).length), 0);
}

export function scheduleVarianceDays(project: Project): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(`${project.forecastCompletionDate}T00:00:00Z`) - Date.parse(`${project.deadline}T00:00:00Z`)) / millisecondsPerDay);
}

export function costVariancePercent(project: Project): number {
  return Math.round(((project.actualCost - project.budget) / project.budget) * 1000) / 10;
}

export function riskIndex(project: Project): number {
  const score = scheduleVarianceDays(project) * 1.5
    + costVariancePercent(project)
    + Math.max(0, project.resourceUtilizationPercent - 70) * 0.75
    + blockedDependencies(project) * 4
    + delayedTasks(project).length * 2;
  return Math.min(100, Math.round(score));
}

export function riskLevel(project: Project): "High" | "Moderate" | "Low" {
  const score = riskIndex(project);
  return score >= 65 ? "High" : score >= 30 ? "Moderate" : "Low";
}

export function statusEvidence(project: Project) {
  return {
    project: project.name,
    status: project.status,
    scheduleVarianceDays: scheduleVarianceDays(project),
    costVariancePercent: costVariancePercent(project),
    resourceUtilizationPercent: project.resourceUtilizationPercent,
    riskIndex: riskIndex(project),
    riskLevel: riskLevel(project),
    delayedTasks: delayedTasks(project).length,
    blockedDependencies: blockedDependencies(project),
    budget: project.budget,
    actualCost: project.actualCost,
    deadline: project.deadline
  };
}

export function comparisonIds(message: string): string[] {
  if (!/\b(compare|versus|vs\.?)\b/i.test(message)) return [];
  return [...new Set([...message.matchAll(/\b(?:project\s+)?(alpha|beta|gamma)\b/gi)].map((match) => match[1].toLowerCase()))].slice(0, 3);
}

export function comparisonAnswer(ids: string[]) {
  const selected = ids.map((id) => findProject(id)).filter((project): project is Project => Boolean(project));
  if (selected.length < 2) return undefined;
  const evidence = selected.map(statusEvidence);
  const summary = evidence.map((item) => `${item.project}: ${item.status.toLowerCase()}, ${item.scheduleVarianceDays > 0 ? `${item.scheduleVarianceDays} days late` : "on schedule"}, ${item.costVariancePercent}% cost variance, ${item.resourceUtilizationPercent}% capacity, risk ${item.riskIndex}/100 (${item.riskLevel.toLowerCase()})`).join("; ");
  const highestRisk = [...evidence].sort((a, b) => b.riskIndex - a.riskIndex)[0];
  return { message: `${summary}. ${highestRisk.project} needs the closer schedule and dependency review; compare its open blockers with the other project's next milestone.`, evidence };
}

export function recoveryPlan(project: Project) {
  const delayed = delayedTasks(project).filter((task) => !task.actualEnd);
  const blocked = blockedDependencies(project);
  const varianceDays = scheduleVarianceDays(project);
  const firstOpen = delayed[0];
  const secondOpen = delayed[1];
  const firstTask = firstOpen ?? project.tasks.find((task) => !task.actualEnd) ?? project.tasks[0];
  const secondTask = secondOpen ?? project.tasks.find((task) => !task.actualEnd && task.id !== firstTask?.id) ?? firstTask;
  const actions = [
    `${varianceDays > 0 || blocked > 0 ? "Set a recovery checkpoint" : "Confirm the next delivery checkpoint"} with ${firstTask?.owner ?? "the task owner"} for ${firstTask?.id ?? "the next open task"} (${firstTask?.title ?? "critical work"}).`,
    `Verify ${firstTask?.id ?? "the critical task"}'s upstream dependencies${firstTask?.dependencyIds.length ? ` (${firstTask.dependencyIds.join(", ")})` : " (none currently listed)"}; then confirm whether ${secondTask?.id ?? "the next task"} (${secondTask?.title ?? "follow-on work"}) can proceed in parallel.`,
    `Protect review capacity: utilization is ${project.resourceUtilizationPercent}%, so reserve focused review time before the next delivery milestone.`
  ];
  return { actions, expectedScheduleImpactDays: Math.max(0, Math.min(Math.max(0, varianceDays), blocked * 2 + 2)), riskImpact: "Addresses critical-path exposure; confirm task estimates and dependencies with owners.", evidence: statusEvidence(project) };
}
