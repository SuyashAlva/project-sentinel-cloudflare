const landing = document.querySelector("#landing");
const application = document.querySelector("#application");
const messages = document.querySelector("#messages");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const activityList = document.querySelector("#activityList");
const toast = document.querySelector("#toast");
const dialog = document.querySelector("#decisionDialog");
const isFilePreview = window.location.protocol === "file:";
const runHelpDialog = document.querySelector("#runHelpDialog");
let activeProjectId = "alpha";
let projectsById = {
  alpha: { id: "alpha", label: "Project Alpha", name: "Project Alpha", client: "Northstar Systems", status: "At Risk", scheduleVarianceDays: 12, costVariancePercent: 8.4, resourceUtilizationPercent: 94, riskIndex: 70, riskLevel: "High", delayedTasks: 7, blockedDependencies: 3, actualCost: 455280, budget: 420000, deadline: "2026-11-14", forecastCompletionDate: "2026-11-26", tasks: [{id:"A-09",title:"Schema",actualEnd:"2026-09-18"},{id:"A-14",title:"Identity",plannedEnd:"2026-09-18"},{id:"A-17",title:"Data layer",plannedEnd:"2026-09-22"},{id:"A-20",title:"Cutover",plannedEnd:"2026-09-29"}] },
  beta: { id: "beta", label: "Project Beta", name: "Signal platform", client: "Meridian Labs", status: "On Track", scheduleVarianceDays: 0, costVariancePercent: 1.2, resourceUtilizationPercent: 76, riskIndex: 6, riskLevel: "Low", delayedTasks: 0, blockedDependencies: 0, actualCost: 283360, budget: 280000, deadline: "2026-12-02", forecastCompletionDate: "2026-12-02", tasks: [{id:"B-04",title:"Event schema",actualEnd:"2026-10-03"},{id:"B-07",title:"Streaming",plannedEnd:"2026-10-09"},{id:"B-11",title:"Dashboard",plannedEnd:"2026-10-14"}] },
  gamma: { id: "gamma", label: "Project Gamma", name: "Fieldwork mobile", client: "Cedar & Co.", status: "Watch", scheduleVarianceDays: 4, costVariancePercent: 3.1, resourceUtilizationPercent: 88, riskIndex: 35, riskLevel: "Moderate", delayedTasks: 2, blockedDependencies: 2, actualCost: 201045, budget: 195000, deadline: "2026-11-21", forecastCompletionDate: "2026-11-25", tasks: [{id:"G-03",title:"Offline sync",plannedEnd:"2026-09-20"},{id:"G-06",title:"Device test",plannedEnd:"2026-09-25"},{id:"G-09",title:"Pilot rollout",plannedEnd:"2026-10-01"}] }
};
let conversationId = crypto.randomUUID();
function conversationFor(projectId) {
  try { const key = `sentinel-conversation-${projectId}`; let value = sessionStorage.getItem(key); if (!value) { value = crypto.randomUUID(); sessionStorage.setItem(key, value); } return value; } catch { return crypto.randomUUID(); }
}
conversationId = conversationFor(activeProjectId);
function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
function dateLabel(value) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function notesKey() { return `sentinel-${activeProjectId}-notes`; }
function currentProject() { return projectsById[activeProjectId]; }
function renderProject(project) {
  const name = project.label || (project.id === "alpha" ? "Project Alpha" : project.id === "beta" ? "Project Beta" : "Project Gamma");
  const heading = document.querySelector(".project-heading h1"); heading.innerHTML = ""; heading.append(document.createTextNode(name)); heading.append(element("span", "heading-mark", "↗"));
  document.querySelector(".breadcrumb b").textContent = name.toUpperCase();
  document.querySelector(".workspace-label small").textContent = `${project.client.toUpperCase()} / DELIVERY`;
  const workspaceUser = document.querySelector(".sidebar-bottom > span"); workspaceUser.firstChild.textContent = project.client;
  const statusPill = document.querySelector(".status-pill"); statusPill.innerHTML = ""; statusPill.append(element("i")); statusPill.append(document.createTextNode(` ${String(project.status).toUpperCase()}`));
  statusPill.className = `status-pill status-${project.status.toLowerCase().replaceAll(" ", "-")}`;
  const headingCopy = document.querySelector(".project-heading p"); headingCopy.replaceChildren(document.createTextNode(project.client), element("span", "", "·"), document.createTextNode(project.name === name ? "Platform migration" : project.name), element("span", "", "·"), document.createTextNode(`Due ${dateLabel(project.deadline)}`));
  const metrics = document.querySelectorAll(".metric-card");
  metrics[0].querySelector(".metric-value").innerHTML = `${project.scheduleVarianceDays > 0 ? "+" : ""}${project.scheduleVarianceDays}<span> days</span>`;
  metrics[0].querySelector(".metric-foot").innerHTML = `<span class="${project.scheduleVarianceDays > 0 ? "trend-bad" : "trend-good"}">Forecast ${dateLabel(project.forecastCompletionDate).replace(", 2026", "")}</span><span>vs. ${dateLabel(project.deadline).replace(", 2026", "")} deadline</span>`;
  metrics[0].querySelector(".metric-line i").style.width = `${Math.min(100, 45 + Math.max(0, project.scheduleVarianceDays) * 3)}%`;
  metrics[1].querySelector(".metric-value").innerHTML = `${project.costVariancePercent > 0 ? "+" : ""}${project.costVariancePercent}<span>%</span>`;
  metrics[1].querySelector(".metric-foot").innerHTML = `<span>${money(project.actualCost)}</span><span>of ${money(project.budget)} budget</span>`;
  metrics[2].querySelector(".metric-value").innerHTML = `${project.resourceUtilizationPercent}<span>%</span>`;
  metrics[2].querySelector(".metric-foot").innerHTML = `<span class="${project.resourceUtilizationPercent >= 90 ? "trend-warn" : "trend-good"}">${project.resourceUtilizationPercent >= 90 ? "Near capacity" : "Within capacity"}</span><span>available utilization</span>`;
  metrics[2].querySelector(".metric-line i").style.width = `${project.resourceUtilizationPercent}%`;
  metrics[3].querySelector(".risk-ring").innerHTML = `<span>${project.riskIndex}</span>`;
  metrics[3].querySelector(".risk-ring").style.background = `conic-gradient(var(--orange) ${project.riskIndex}%, #e7e2d8 ${project.riskIndex}% 100%)`;
  metrics[3].querySelector(".risk-label b").textContent = String(project.riskLevel).toUpperCase();
  const riskCopy = project.scheduleVarianceDays > 0 ? `${name} is <b>${project.scheduleVarianceDays} days behind</b>. ${project.delayedTasks} tasks are delayed and ${project.blockedDependencies} dependencies are blocked. At <b>${project.resourceUtilizationPercent}% capacity</b>, focus first on ${project.tasks?.find((task) => !task.actualEnd)?.title || "the next critical task"}.` : `${name} is forecast to meet its deadline. Cost is ${project.costVariancePercent}% above plan, with ${project.resourceUtilizationPercent}% capacity in use and no overdue dependency blockers. Keep the streaming work moving and review cost at the next checkpoint.`;
  document.querySelector(".insight-copy").innerHTML = riskCopy;
  document.querySelector(".insight-card h2").textContent = project.riskLevel === "Low" ? "A steady project, with room to act." : project.riskLevel === "Moderate" ? "A few signals need attention." : "A system under pressure.";
  const tasks = project.tasks || [];
  const path = document.querySelector(".dependency-map");
  path.innerHTML = `<div class="dep-line line-one"></div><div class="dep-line line-two"></div>`;
  tasks.slice(0, 4).forEach((task, index) => { const done = !!task.actualEnd; const cls = done ? "node-done" : index === 0 && project.blockedDependencies > 0 ? "node-risk" : "node-muted"; const node = element("div", `dep-node ${cls}${index === 3 ? " last-node" : ""}`); node.append(element("span", "", done ? "✓" : String(index + 1).padStart(2,"0")), element("b", "", task.id), element("small", "", task.title.toUpperCase())); path.append(node); });
  document.querySelector(".dependency-head .eyebrow-label").textContent = `CRITICAL PATH / ${String(Math.min(tasks.length, 4)).padStart(2,"0")} NODES`;
  document.querySelector(".dependency-foot").innerHTML = `<span><i></i> ${project.blockedDependencies} DEPENDENC${project.blockedDependencies === 1 ? "Y" : "IES"} BLOCKED</span><span>VIEW PATH ↗</span>`;
  document.querySelector(".suggestions").innerHTML = `<button data-prompt="Why is ${name} behind schedule?">Why is ${name.replace("Project ", "")} behind?</button><button data-prompt="What is blocking ${name}?">What is blocking ${name.replace("Project ", "")}?</button><button data-prompt="Create a recovery plan for ${name}.">Create a recovery plan</button>`;
  document.querySelectorAll("[data-prompt]").forEach((button) => button.addEventListener("click", () => sendMessage(button.dataset.prompt)));
  document.querySelector(".assistant-message p").textContent = project.scheduleVarianceDays > 0 ? `${name} has ${project.delayedTasks} delayed tasks and ${project.blockedDependencies} blocked dependencies. Ask me to unpack schedule, cost, capacity, or build a recovery plan.` : `${name} is currently forecast to meet its deadline. Ask me about cost, capacity, delivery risks, or build a recovery plan.`;
  document.querySelector("#memoryDialogLabel").textContent = `PROJECT MEMORY / ${activeProjectId.toUpperCase()}`;
  document.querySelector("#memoryDialogCopy").textContent = `Sentinel will remember this context in future conversations about ${name}.`;
  document.querySelector(".heading-actions .button-orange").setAttribute("aria-label", `Save a decision for ${name}`);
  document.querySelectorAll(".project-item").forEach((button) => { const selected = button.dataset.project === activeProjectId; button.classList.toggle("selected", selected); if (selected) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current"); });
  document.querySelector("#memoryPreview").textContent = previewNotes().at(-1) ? `“${previewNotes().at(-1)}”` : "No saved decisions yet. Save a constraint or decision to use it in future conversations.";
}
document.querySelectorAll(".project-item[data-project]").forEach((button) => button.addEventListener("click", async () => {
  activeProjectId = button.dataset.project;
  if (!isFilePreview) { try { const response = await fetch("/api/projects"); if (response.ok) { const rows = await response.json(); rows.forEach((row) => { row.label = `Project ${row.id[0].toUpperCase()}${row.id.slice(1)}`; projectsById[row.id] = row; }); } } catch { /* Keep seeded project data available offline. */ } }
  conversationId = conversationFor(activeProjectId); renderProject(currentProject());
  messages.replaceChildren(); renderMessage("assistant", currentProject().label + (currentProject().scheduleVarianceDays > 0 ? " has schedule and dependency signals to review. Ask about its risks or create a recovery plan." : " is on track. Ask me to check cost, capacity, or delivery risk."));
  document.querySelector(".workflow-banner")?.remove(); document.querySelector(".workflow-result-card")?.remove(); setActivity([`Retrieved ${currentProject().label}`, "Checked project signals", "Ready for your question"]); if (!isFilePreview) loadProjectMemory();
}));
if (!isFilePreview) fetch("/api/projects").then((response) => response.json()).then((rows) => { rows.forEach((row) => { row.label = `Project ${row.id[0].toUpperCase()}${row.id.slice(1)}`; projectsById[row.id] = row; }); renderProject(currentProject()); }).then(() => loadProjectMemory()).catch(() => renderProject(currentProject()));
else renderProject(currentProject());

function previewNotes() {
  try { return JSON.parse(localStorage.getItem(notesKey()) || "[]"); } catch { return []; }
}

function storePreviewNote(note) {
  const notes = previewNotes(); notes.push(note);
  try { localStorage.setItem(notesKey(), JSON.stringify(notes.slice(-20))); } catch { /* Preview remains usable if browser storage is disabled. */ }
  return notes;
}

function localPreviewReply(message) {
  const lower = message.toLowerCase();
  const project = currentProject();
  const name = project.label;
  let notes = previewNotes();
  const isSaving = /\b(remember|save this|note that|we decided|decision)\b/i.test(message);
  if (isSaving) {
    const note = message.replace(/^(please\s+)?(remember|save this|note that)\s*/i, "").trim();
    if (note && note !== message) notes = storePreviewNote(note);
  }
  let answer;
  if (/\bdelta\b/.test(lower)) answer = "I can’t find Project Delta. I can help with Alpha, Beta, or Gamma.";
  else if (/\b(compare|versus|vs\.?)\b/i.test(message) && [...new Set([...message.matchAll(/\b(?:project\s+)?(alpha|beta|gamma)\b/gi)].map((match) => match[1].toLowerCase()))].length >= 2) {
    const ids = [...new Set([...message.matchAll(/\b(?:project\s+)?(alpha|beta|gamma)\b/gi)].map((match) => match[1].toLowerCase()))];
    const compared = ids.map((id) => projectsById[id]);
    const priority = [...compared].sort((a, b) => b.riskIndex - a.riskIndex)[0];
    answer = compared.map((item) => `${item.label}: ${item.status.toLowerCase()}, ${item.scheduleVarianceDays > 0 ? `${item.scheduleVarianceDays} days late` : "on schedule"}, ${item.costVariancePercent}% cost variance, ${item.resourceUtilizationPercent}% capacity, risk ${item.riskIndex}/100 (${item.riskLevel.toLowerCase()})`).join("; ") + `. ${priority.label} needs the closer schedule and dependency review; compare its open blockers with the other project's next milestone.`;
  }
  else if (/remember|save|note|decid|previously|constraint|told me|what did we/.test(lower)) answer = notes.length ? `Project memory says: “${notes.at(-1)}”` : "I don’t have a saved decision for this project yet. Use Save a decision to add one.";
  else if (/resource|utili[sz]/.test(lower)) answer = `${name} is using ${project.resourceUtilizationPercent}% of available capacity. ${project.resourceUtilizationPercent >= 90 ? "That is a tight operating margin and increases schedule risk." : "There is some room to absorb unplanned work."}`;
  else if (/cost|budget|variance/.test(lower) && !/schedule/.test(lower)) answer = `${name} is ${project.costVariancePercent}% over budget. Actual cost is ${money(project.actualCost)} against a ${money(project.budget)} budget.`;
  else if (/block|dependenc/.test(lower)) answer = `${project.blockedDependencies} task-to-task dependencies are blocked by overdue work. The project has ${project.delayedTasks} delayed tasks; focus on ${project.tasks?.find((task) => !task.actualEnd)?.id || "the next open task"}.`;
  else answer = `${name} is ${project.scheduleVarianceDays ? `${project.scheduleVarianceDays} days behind schedule` : "forecast to meet its deadline"}. The evidence points to ${project.delayedTasks} delayed tasks, ${project.blockedDependencies} blocked dependencies, and ${project.resourceUtilizationPercent}% resource utilization. Cost is ${project.costVariancePercent}% above plan. Review the critical path and capacity before deciding what to change.`;
  const plan = /recovery plan|create a plan/i.test(lower) ? {
    actions: [
      `Set a recovery checkpoint with the owner of ${project.tasks?.find((task) => !task.actualEnd)?.id || "the next open task"} (${project.tasks?.find((task) => !task.actualEnd)?.title || "critical work"}).`,
      `Confirm and clear the ${project.blockedDependencies} blocked dependencies on the critical path.`,
      `Reserve review capacity; utilization is ${project.resourceUtilizationPercent}% before the next delivery checkpoint.`
    ], expectedScheduleImpactDays: Math.max(0, project.scheduleVarianceDays)
  } : undefined;
  return { message: answer, conversationId, metadata: { projectId: activeProjectId, toolsUsed: ["get_project_status"], savedNotes: notes, plan, mode: "local-preview" } };
}

function enterApp() {
  landing.classList.add("is-hidden");
  application.classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => input.focus({ preventScroll: true }), 250);
}
document.querySelector("#openApp").addEventListener("click", enterApp);
document.querySelector("#backHome").addEventListener("click", (event) => {
  event.preventDefault(); application.classList.add("is-hidden"); landing.classList.remove("is-hidden"); window.scrollTo({ top: 0, behavior: "smooth" });
});

let toastTimer;
function showToast(text) {
  toast.textContent = text; toast.classList.add("visible"); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function element(tag, className, text) {
  const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node;
}

function renderMessage(role, text, metadata) {
  const wrap = element("div", role === "assistant" ? "assistant-message" : "user-message");
  if (role === "assistant") {
    const avatar = element("div", "assistant-avatar", "S"); avatar.append(element("span", "", "✳")); wrap.append(avatar);
  }
  const body = element("div");
  body.append(element("div", "message-meta", role === "assistant" ? "SENTINEL · JUST NOW" : "YOU · JUST NOW"));
  body.append(element("p", "", text)); wrap.append(body); messages.append(wrap);
  if (metadata?.plan) {
    const card = element("div", "plan-card");
    card.append(element("h3", "", "RECOVERY PLAN / DRAFT"));
    metadata.plan.actions.forEach((action, index) => card.append(element("div", "plan-step", `${String(index + 1).padStart(2, "0")}  ${action}`)));
    card.append(element("div", "plan-impact", metadata.plan.expectedScheduleImpactDays > 0 ? `EXPECTED SCHEDULE RECOVERY  /  UP TO ${metadata.plan.expectedScheduleImpactDays} DAYS` : "SCHEDULE FORECAST  /  ON TIME; NO RECOVERY DAYS ESTIMATED"));
    messages.append(card);
  }
  messages.scrollTop = messages.scrollHeight;
}

function setActivity(labels, activeIndex = -1) {
  activityList.replaceChildren();
  labels.forEach((label, index) => {
    const item = element("div", `activity-item ${index < activeIndex ? "complete" : index === activeIndex ? "running" : "idle"}`);
    item.append(element("i", "", index < activeIndex ? "✓" : index === activeIndex ? "↻" : "·"));
    item.append(element("span", "", label)); activityList.append(item);
  });
}

const baseActivity = [`Retrieved ${currentProject().label}`, "Checked schedule signals", "Mapped dependencies", "Analyzed resources", "Prepared findings"];
async function sendMessage(rawText) {
  const message = rawText.trim(); if (!message) return;
  renderMessage("user", message); input.value = ""; input.style.height = "auto";
  setActivity(baseActivity, 0);
  const isPlan = /recovery plan|create a plan/i.test(message);
  let progress = 0;
  const progressTimer = setInterval(() => { progress = Math.min(progress + 1, 4); setActivity(baseActivity, progress); }, 390);
  try {
    let data;
    if (isFilePreview) {
      await new Promise((resolve) => setTimeout(resolve, 260));
      data = localPreviewReply(message);
    } else {
      const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, projectId: activeProjectId, conversationId }) });
      data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sentinel could not complete that request.");
    }
    clearInterval(progressTimer);
    conversationId = data.conversationId;
    try { sessionStorage.setItem(`sentinel-conversation-${activeProjectId}`, conversationId); } catch { /* The in-memory conversation remains usable. */ }
    const usedLlama = data.metadata?.mode === "workers-ai";
    const calledStatusTool = data.metadata?.llmToolCalls?.includes("get_project_status");
    setActivity([`Retrieved ${currentProject().label}`, usedLlama ? `Workers AI / ${data.metadata.aiModel}` : "Grounded response mode", calledStatusTool ? "Llama selected get_project_status" : "No LLM tool call", "Checked verified project evidence", usedLlama ? "Synthesized with Workers AI" : "Prepared grounded response"], 5);
    renderMessage("assistant", data.message, data.metadata);
    if (data.metadata?.savedNotes?.length) document.querySelector("#memoryPreview").textContent = `“${data.metadata.savedNotes.at(-1)}”`;
    if (isPlan) startWorkflow();
  } catch (error) {
    clearInterval(progressTimer); setActivity(["Project data available", "AI response unavailable", "Grounded demo response is ready"], 3);
    renderMessage("assistant", `I couldn’t reach the project service. ${error.message} Please try again in a moment.`);
  }
}

form.addEventListener("submit", (event) => { event.preventDefault(); sendMessage(input.value); });
input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = `${Math.min(input.scrollHeight, 75)}px`; });
input.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
document.querySelectorAll("[data-prompt]").forEach((button) => button.addEventListener("click", () => sendMessage(button.dataset.prompt)));
document.querySelector("#askWhy").addEventListener("click", () => { input.value = `Why is ${currentProject().label} behind schedule?`; document.querySelector("#chatSection").scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => form.requestSubmit(), 350); });

document.querySelector("#saveDecision").addEventListener("click", () => { dialog.showModal(); document.querySelector("#decisionText").focus(); });
document.querySelector("#saveDecisionSubmit").addEventListener("click", async (event) => {
  event.preventDefault();
  const note = document.querySelector("#decisionText").value.trim();
  if (!note) { showToast("Add a decision or constraint first."); return; }
  try {
    if (isFilePreview) {
      storePreviewNote(note); document.querySelector("#memoryPreview").textContent = `“${note}”`;
      document.querySelector("#decisionText").value = ""; dialog.close(); showToast("Saved in this browser preview."); return;
    }
    const response = await fetch("/api/memory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId: activeProjectId, note }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not save this decision.");
    document.querySelector("#memoryPreview").textContent = `“${note}”`; document.querySelector("#decisionText").value = ""; dialog.close(); showToast(data.saved === false ? "That decision is already saved." : `Saved to ${currentProject().label} memory.`);
  } catch (error) { showToast(error.message); }
});
async function loadProjectMemory() {
  if (isFilePreview) return;
  try {
    const projectQuery = `projectId=${encodeURIComponent(activeProjectId)}`;
    const [notesResponse, analysisResponse] = await Promise.all([fetch(`/api/memory?${projectQuery}`), fetch(`/api/memory?${projectQuery}&kind=analysis`)]);
    const [notes, savedAnalysis] = await Promise.all([notesResponse.json(), analysisResponse.json()]);
    const latest = notes.notes?.at(-1);
    document.querySelector("#memoryPreview").textContent = latest ? `“${latest}”` : "No saved decisions yet. Save a constraint or decision to use it in future conversations.";
    document.querySelector(".workflow-result-card")?.remove();
    if (savedAnalysis.analysis) renderWorkflowResult(savedAnalysis.analysis);
  } catch { /* Keep current memory preview if the storage service is temporarily unavailable. */ }
}
function showMemory() {
  enterApp();
  if (isFilePreview) {
    const latest = previewNotes().at(-1);
    showToast(latest ? `Saved decision: “${latest}”` : "No decisions saved yet. Use Save a decision to add one."); return;
  }
  loadProjectMemory().then(() => {
    const latest = document.querySelector("#memoryPreview").textContent;
    showToast(latest.startsWith("“") ? `Saved decision: ${latest}` : latest);
  });
}
document.querySelector("#openMemory").addEventListener("click", showMemory);
document.querySelector("#navMemory").addEventListener("click", showMemory);
document.querySelector("#navAnalysis").addEventListener("click", () => { document.querySelector("#runAnalysis").click(); });
document.querySelector("#navOverview").addEventListener("click", () => {
  enterApp();
  document.querySelector(".project-heading").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelector("#helpButton").addEventListener("click", () => showToast("Ask about schedule, cost, capacity, blockers, or saved decisions. Use Run risk analysis for a durable project review."));
document.querySelector("#notificationsButton").addEventListener("click", () => showToast("No new notifications. Project signals are based on the Sep 30, 2026 demo snapshot."));
document.querySelector("#openCriticalPath").addEventListener("click", () => {
  const card = document.querySelector(".dependency-card");
  const ids = (currentProject().tasks || []).slice(0, 4).map((task) => task.id);
  card.tabIndex = -1;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.focus({ preventScroll: true });
  showToast(ids.length ? `Critical path tasks: ${ids.join(" → ")}` : "No critical path tasks are available for this project.");
});

let workflowPoll;
async function startWorkflow() {
  const existing = document.querySelector(".workflow-banner"); existing?.remove(); document.querySelector(".workflow-result-card")?.remove();
  const banner = element("div", "workflow-banner", `RISK ANALYSIS / QUEUED — ${currentProject().label} review starting…`);
  document.querySelector(".activity-pane").append(banner);
  try {
    if (isFilePreview) {
      banner.textContent = "FILE PREVIEW / Analysis has not run. Start Sentinel at http://localhost:8787 to analyze this project.";
      runHelpDialog.showModal();
      return;
    }
    const response = await fetch("/api/analysis", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId: activeProjectId }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || "Workflow unavailable.");
    banner.textContent = `RISK ANALYSIS / ${data.status.toUpperCase()} — checking project signals…`;
    clearInterval(workflowPoll); let attempts = 0;
    workflowPoll = setInterval(async () => {
      attempts++;
      try {
        const poll = await fetch(`/api/analysis/${encodeURIComponent(data.instanceId)}`); const state = await poll.json();
        banner.textContent = `RISK ANALYSIS / ${String(state.status || "running").toUpperCase()} — durable analysis in progress…`;
        if (["complete", "completed", "errored", "failed"].includes(String(state.status).toLowerCase()) || attempts > 18) {
          clearInterval(workflowPoll);
          if (["complete", "completed"].includes(String(state.status).toLowerCase())) {
            banner.textContent = "RISK ANALYSIS / COMPLETE — findings and recovery actions saved to project memory.";
            if (state.output) renderWorkflowResult(state.output);
          } else if (attempts > 18) banner.textContent = "RISK ANALYSIS / RUNNING — results will appear in project memory when complete.";
          else banner.textContent = "RISK ANALYSIS / COULD NOT COMPLETE — retry the analysis.";
        }
      } catch { clearInterval(workflowPoll); banner.textContent = "RISK ANALYSIS / STATUS UNAVAILABLE"; }
    }, 1600);
  } catch (error) { banner.textContent = `RISK ANALYSIS / ${error.message}`; }
}
function renderWorkflowResult(output) {
  const result = output?.findings ? output : output?.output?.findings ? output.output : output;
  const findings = result?.findings;
  if (!findings) return;
  document.querySelector(".workflow-result-card")?.remove();
  const card = element("section", "plan-card workflow-result-card");
  card.append(element("h3", "", "RISK REVIEW / FINDINGS"));
  const facts = findings.evidence || {};
  card.append(element("div", "workflow-finding-summary", `${facts.project || currentProject().label}: ${findings.delayedTaskIds?.length ?? facts.delayedTasks ?? 0} delayed tasks · ${findings.blockedDependencies ?? 0} blocked dependencies · ${findings.resourceUtilizationPercent ?? facts.resourceUtilizationPercent ?? "—"}% capacity · ${findings.costVariancePercent ?? facts.costVariancePercent ?? "—"}% cost variance`));
  const actions = result.recommendations?.actions || [];
  if (actions.length) {
    card.append(element("h3", "workflow-actions-title", "RECOMMENDED NEXT STEPS"));
    actions.forEach((action, index) => card.append(element("div", "plan-step", `${String(index + 1).padStart(2, "0")}  ${action}`)));
  }
  document.querySelector(".activity-pane").append(card);
  showToast(`Analysis complete: ${findings.delayedTaskIds?.length ?? 0} delayed tasks, ${findings.blockedDependencies ?? 0} blocked dependencies.`);
}
document.querySelector("#runAnalysis").addEventListener("click", async () => {
  enterApp(); setActivity([`Loading ${currentProject().label}`, "Analyzing task delays", "Checking dependencies", "Checking team capacity", "Reviewing cost variance", "Generating recommendations", "Saving findings"], 0);
  await startWorkflow();
});

// Keep the sidebar and activity controls reachable on small screens.
const sidebar = document.querySelector(".sidebar");
const mobileMenu = element("button", "icon-button mobile-menu", "☰");
mobileMenu.setAttribute("aria-label", "Open project navigation");
document.querySelector(".app-topbar").prepend(mobileMenu);
mobileMenu.addEventListener("click", () => sidebar.classList.toggle("mobile-open"));
sidebar.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => sidebar.classList.remove("mobile-open")));
document.querySelector(".activity-title").addEventListener("click", () => document.querySelector(".activity-pane").classList.toggle("mobile-open"));
document.querySelector("#mobileActivityButton").addEventListener("click", () => document.querySelector(".activity-pane").classList.toggle("mobile-open"));
document.querySelector(".activity-title").setAttribute("role", "button");
document.querySelector(".activity-title").setAttribute("tabindex", "0");
document.querySelector(".activity-title").addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") document.querySelector(".activity-title").click(); });

// Reveal editorial sections as they enter view; reduced-motion preferences are respected in CSS.
const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("revealed"); revealObserver.unobserve(entry.target); } }), { threshold: .12 });
document.querySelectorAll(".manifesto,.feature-cards,.landing-footer").forEach((section) => revealObserver.observe(section));
