const STORAGE_KEY = "summitmind:v1";

const form = document.querySelector("#memoryForm");
const titleInput = document.querySelector("#titleInput");
const typeInput = document.querySelector("#typeInput");
const bodyInput = document.querySelector("#bodyInput");
const tagsInput = document.querySelector("#tagsInput");
const searchInput = document.querySelector("#searchInput");
const timeline = document.querySelector("#timeline");
const archiveCount = document.querySelector("#archiveCount");
const insightGrid = document.querySelector("#insightGrid");
const tagFilters = document.querySelector("#tagFilters");
const memoryTemplate = document.querySelector("#memoryTemplate");
const exportButton = document.querySelector("#exportButton");
const importInput = document.querySelector("#importInput");
const sampleButton = document.querySelector("#sampleButton");
const saveButton = document.querySelector("#saveButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const reportButton = document.querySelector("#reportButton");
const copyReportButton = document.querySelector("#copyReportButton");
const printButton = document.querySelector("#printButton");
const reflectionReport = document.querySelector("#reflectionReport");
const statusMessage = document.querySelector("#statusMessage");

let memories = loadMemories();
let editingId = null;
let activeTag = "";

applyDemoParams();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const wasEditing = Boolean(editingId);

  const nextMemory = {
    id: editingId || createId(),
    title: titleInput.value.trim(),
    type: typeInput.value,
    body: bodyInput.value.trim(),
    tags: parseTags(tagsInput.value),
    pinned: editingId
      ? Boolean(memories.find((item) => item.id === editingId)?.pinned)
      : false,
    createdAt: editingId
      ? memories.find((item) => item.id === editingId)?.createdAt ||
        new Date().toISOString()
      : new Date().toISOString(),
    updatedAt: editingId ? new Date().toISOString() : undefined,
  };

  if (editingId) {
    memories = memories.map((memory) =>
      memory.id === editingId ? nextMemory : memory,
    );
  } else {
    memories = [nextMemory, ...memories];
  }

  saveMemories(memories);
  resetForm();
  announce(wasEditing ? "Memory updated." : "Memory saved.");
  render();
});

document.addEventListener("keydown", (event) => {
  const modifier = event.metaKey || event.ctrlKey;

  if (modifier && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }

  if (modifier && event.key === "Enter") {
    event.preventDefault();
    form.requestSubmit();
  }
});

cancelEditButton.addEventListener("click", () => {
  resetForm();
});

searchInput.addEventListener("input", render);

sampleButton.addEventListener("click", () => {
  const ok = memories.length
    ? confirm(
        "Load demo memories? They will be merged with your current archive.",
      )
    : true;

  if (!ok) return;

  memories = mergeMemories(memories, demoMemories());
  saveMemories(memories);
  announce("Demo memories loaded.");
  render();
});

reportButton.addEventListener("click", () => {
  reflectionReport.hidden = !reflectionReport.hidden;
  copyReportButton.disabled = reflectionReport.hidden;
  if (!reflectionReport.hidden) {
    renderReflectionReport(memories);
    announce("Reflection report opened.");
  }
});

copyReportButton.addEventListener("click", async () => {
  const markdown = buildReportMarkdown(memories);

  try {
    await navigator.clipboard.writeText(markdown);
    announce("Report copied as Markdown.");
  } catch {
    downloadText(
      markdown,
      `summitmind-report-${new Date().toISOString().slice(0, 10)}.md`,
      "text/markdown",
    );
    announce("Clipboard unavailable. Report downloaded instead.");
  }
});

printButton.addEventListener("click", () => {
  if (reflectionReport.hidden) {
    reflectionReport.hidden = false;
    copyReportButton.disabled = false;
    renderReflectionReport(memories);
  }
  window.print();
});

exportButton.addEventListener("click", () => {
  const payload = {
    app: "SummitMind",
    version: 2,
    exportedAt: new Date().toISOString(),
    memories,
  };
  downloadText(
    JSON.stringify(payload, null, 2),
    `summitmind-archive-${new Date().toISOString().slice(0, 10)}.json`,
    "application/json",
  );
  announce("Archive exported.");
});

importInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const imported = Array.isArray(parsed) ? parsed : parsed.memories;

    if (!Array.isArray(imported)) {
      throw new Error("The file does not contain a memories array.");
    }

    const cleaned = imported.map(normalizeMemory).filter(Boolean);
    memories = mergeMemories(memories, cleaned);
    saveMemories(memories);
    announce(
      `${cleaned.length} imported memor${cleaned.length === 1 ? "y" : "ies"} merged.`,
    );
    render();
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  } finally {
    importInput.value = "";
  }
});

tagFilters.addEventListener("click", (event) => {
  const button = event.target.closest(".tag-filter");
  if (!button) return;

  activeTag = button.dataset.tag || "";
  render();
});

timeline.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = button.dataset.id;
  const memory = memories.find((item) => item.id === id);
  if (!memory) return;

  if (button.classList.contains("delete-button")) {
    deleteMemory(memory);
    return;
  }

  if (button.classList.contains("edit-button")) {
    startEditing(memory);
    return;
  }

  if (button.classList.contains("pin-button")) {
    togglePinned(memory);
  }
});

function loadMemories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedMemories();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(normalizeMemory).filter(Boolean)
      : [];
  } catch {
    return seedMemories();
  }
}

function saveMemories(nextMemories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMemories));
}

function downloadText(text, filename, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function announce(message) {
  statusMessage.textContent = message;
}

function normalizeMemory(item) {
  if (!item || typeof item !== "object") return null;
  const title = String(item.title || "").trim();
  const body = String(item.body || "").trim();
  if (!title || !body) return null;

  return {
    id: String(item.id || createId()),
    title,
    type: String(item.type || "Reflection"),
    body,
    tags: Array.isArray(item.tags)
      ? item.tags.map(String).map(cleanTag).filter(Boolean)
      : [],
    pinned: Boolean(item.pinned),
    createdAt: isValidDate(item.createdAt)
      ? item.createdAt
      : new Date().toISOString(),
    updatedAt: isValidDate(item.updatedAt) ? item.updatedAt : undefined,
  };
}

function mergeMemories(current, imported) {
  const byId = new Map();
  [...imported, ...current].forEach((memory) =>
    byId.set(memory.id, normalizeMemory(memory)),
  );
  return [...byId.values()].filter(Boolean).sort(sortMemories);
}

function parseTags(value) {
  return value.split(",").map(cleanTag).filter(Boolean);
}

function cleanTag(tag) {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

function isValidDate(value) {
  return value && !Number.isNaN(new Date(value).getTime());
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function applyDemoParams() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("demo") === "1") {
    memories = mergeMemories(memories, demoMemories());
    saveMemories(memories);
  }

  if (params.get("report") === "1") {
    reflectionReport.hidden = false;
    copyReportButton.disabled = false;
  }
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = memories
    .filter((memory) => matchesQuery(memory, query))
    .filter(matchesActiveTag)
    .sort(sortMemories);

  archiveCount.textContent =
    memories.length === 1
      ? "1 memory saved."
      : `${memories.length} memories saved.`;

  renderInsights(memories);
  renderTagFilters(memories);
  renderTimeline(filtered, query);

  if (!reflectionReport.hidden) {
    renderReflectionReport(memories);
  }
}

function matchesQuery(memory, query) {
  if (!query) return true;
  const haystack = [
    memory.title,
    memory.type,
    memory.body,
    memory.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function matchesActiveTag(memory) {
  return !activeTag || memory.tags.includes(activeTag);
}

function sortMemories(a, b) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function renderTagFilters(items) {
  tagFilters.innerHTML = "";
  const tags = countItems(items.flatMap((item) => item.tags));
  const entries = Object.entries(tags).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  if (!entries.length) {
    tagFilters.hidden = true;
    activeTag = "";
    return;
  }

  tagFilters.hidden = false;
  tagFilters.append(createTagFilterButton("All", "", items.length));
  entries.forEach(([tag, count]) =>
    tagFilters.append(createTagFilterButton(tag, tag, count)),
  );
}

function createTagFilterButton(label, tag, count) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `tag-filter${activeTag === tag ? " active" : ""}`;
  button.dataset.tag = tag;
  button.setAttribute("aria-pressed", String(activeTag === tag));
  button.textContent = `${label} (${count})`;
  return button;
}

function renderTimeline(items, query) {
  timeline.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent =
      query || activeTag
        ? "No memories match that filter yet."
        : "Start with one honest memory. The archive becomes useful when it remembers the context you usually lose.";
    timeline.append(empty);
    return;
  }

  const groups = groupByMonth(items);
  Object.entries(groups).forEach(([month, group]) => {
    const section = document.createElement("section");
    section.className = "month-group";

    const title = document.createElement("h3");
    title.className = "month-title";
    title.textContent = month;
    section.append(title);

    group.forEach((memory) => section.append(createMemoryCard(memory)));
    timeline.append(section);
  });
}

function createMemoryCard(memory) {
  const node = memoryTemplate.content.firstElementChild.cloneNode(true);
  node.classList.toggle("pinned", memory.pinned);
  node.querySelector(".memory-meta").textContent =
    `${memory.pinned ? "Pinned | " : ""}${memory.type} | ${formatDate(memory.createdAt)}`;
  node.querySelector("h3").textContent = memory.title;
  node.querySelector(".memory-body").textContent = memory.body;

  const pinButton = node.querySelector(".pin-button");
  pinButton.dataset.id = memory.id;
  pinButton.textContent = memory.pinned ? "Unpin" : "Pin";

  const editButton = node.querySelector(".edit-button");
  editButton.dataset.id = memory.id;

  const deleteButton = node.querySelector(".delete-button");
  deleteButton.dataset.id = memory.id;

  const tagRow = node.querySelector(".tag-row");
  memory.tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.textContent = tag;
    tagRow.append(chip);
  });

  return node;
}

function groupByMonth(items) {
  return items.reduce((groups, memory) => {
    const label = new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
    }).format(new Date(memory.createdAt));
    groups[label] ||= [];
    groups[label].push(memory);
    return groups;
  }, {});
}

function startEditing(memory) {
  editingId = memory.id;
  titleInput.value = memory.title;
  typeInput.value = memory.type;
  bodyInput.value = memory.body;
  tagsInput.value = memory.tags.join(", ");
  saveButton.textContent = "Update memory";
  cancelEditButton.classList.remove("hidden");
  titleInput.focus();
}

function resetForm() {
  editingId = null;
  form.reset();
  saveButton.textContent = "Save memory";
  cancelEditButton.classList.add("hidden");
  titleInput.focus();
}

function deleteMemory(memory) {
  const ok = confirm(`Delete "${memory.title}"?`);
  if (!ok) return;

  memories = memories.filter((item) => item.id !== memory.id);
  saveMemories(memories);
  announce("Memory deleted.");
  render();
}

function togglePinned(memory) {
  memories = memories.map((item) =>
    item.id === memory.id
      ? { ...item, pinned: !item.pinned, updatedAt: new Date().toISOString() }
      : item,
  );
  saveMemories(memories);
  announce(memory.pinned ? "Memory unpinned." : "Memory pinned.");
  render();
}

function renderInsights(items) {
  insightGrid.innerHTML = "";
  const insights = analyzeMemories(items);

  insights.forEach((insight) => {
    const card = document.createElement("article");
    card.className = "insight-card";
    card.innerHTML = `<strong></strong><span></span>`;
    card.querySelector("strong").textContent = insight.title;
    card.querySelector("span").textContent = insight.body;
    insightGrid.append(card);
  });
}

function analyzeMemories(items) {
  if (!items.length) {
    return [
      {
        title: "No archive yet",
        body: "Save a few memories and this space will start showing recurring themes, decisions, and unfinished loops.",
      },
    ];
  }

  const allText = items
    .map((item) => `${item.title} ${item.body} ${item.tags.join(" ")}`)
    .join(" ")
    .toLowerCase();
  const tags = countItems(items.flatMap((item) => item.tags));
  const types = countItems(items.map((item) => item.type));
  const decisionCount = countMatches(allText, [
    "decided",
    "choose",
    "choice",
    "changed my mind",
    "commit",
  ]);
  const unfinishedCount = countMatches(allText, [
    "unfinished",
    "stuck",
    "paused",
    "later",
    "someday",
    "blocked",
  ]);
  const feelingCount = countMatches(allText, [
    "felt",
    "feel",
    "afraid",
    "excited",
    "tired",
    "confused",
    "clear",
  ]);
  const topTag = Object.entries(tags).sort((a, b) => b[1] - a[1])[0];
  const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
  const pinnedCount = items.filter((item) => item.pinned).length;

  return [
    {
      title: "Strongest theme",
      body: topTag
        ? `"${topTag[0]}" appears most often. That might be where your attention keeps returning.`
        : "Add tags to reveal recurring themes.",
    },
    {
      title: "Archive shape",
      body: topType
        ? `${topType[0]} is your most common memory type. Your archive currently leans that way.`
        : "Your archive is still forming.",
    },
    {
      title: "Decisions noticed",
      body: decisionCount
        ? `${decisionCount} decision signal${decisionCount === 1 ? "" : "s"} found. These are worth reviewing before you reopen old questions.`
        : "No strong decision signals yet.",
    },
    {
      title: "Unfinished loops",
      body: unfinishedCount
        ? `${unfinishedCount} unfinished signal${unfinishedCount === 1 ? "" : "s"} found. Some of these may be old weight, some may be live ideas.`
        : "No obvious unfinished loops yet.",
    },
    {
      title: "Pinned context",
      body: pinnedCount
        ? `${pinnedCount} pinned memor${pinnedCount === 1 ? "y" : "ies"} will stay above the timeline.`
        : "Pin a memory when it still matters.",
    },
    {
      title: "Emotional context",
      body: feelingCount
        ? `${feelingCount} feeling signal${feelingCount === 1 ? "" : "s"} found. This helps explain why things changed, not just what changed.`
        : "Try writing how a memory felt, not only what happened.",
    },
  ];
}

function renderReflectionReport(items) {
  const tags = Object.entries(countItems(items.flatMap((item) => item.tags)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const pinned = items.filter((item) => item.pinned).slice(0, 3);
  const recent = [...items]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  reflectionReport.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = "Monthly reflection report";
  reflectionReport.append(title);

  const summary = document.createElement("p");
  summary.textContent = items.length
    ? `Your archive has ${items.length} memories, ${pinned.length} pinned priorities, and ${tags.length} recurring themes. Use this report to review what still needs attention.`
    : "Your archive is empty. Add memories or load demo data to generate a useful report.";
  reflectionReport.append(summary);

  const list = document.createElement("ul");
  [
    tags.length
      ? `Recurring themes: ${tags.map(([tag, count]) => `${tag} (${count})`).join(", ")}.`
      : "No recurring tags yet.",
    pinned.length
      ? `Pinned review: ${pinned.map((item) => item.title).join("; ")}.`
      : "No pinned memories yet.",
    recent.length
      ? `Recent context: ${recent.map((item) => item.title).join("; ")}.`
      : "No recent memories yet.",
  ].forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  });
  reflectionReport.append(list);
}

function buildReportMarkdown(items) {
  const tags = Object.entries(countItems(items.flatMap((item) => item.tags)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const pinned = items.filter((item) => item.pinned).slice(0, 3);
  const recent = [...items]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  return [
    "# SummitMind Monthly Reflection Report",
    "",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    `Archive size: ${items.length} memories`,
    `Pinned priorities: ${pinned.length}`,
    "",
    "## Recurring Themes",
    tags.length
      ? tags.map(([tag, count]) => `- ${tag}: ${count}`).join("\n")
      : "- No recurring tags yet.",
    "",
    "## Pinned Review",
    pinned.length
      ? pinned.map((item) => `- ${item.title}`).join("\n")
      : "- No pinned memories yet.",
    "",
    "## Recent Context",
    recent.length
      ? recent.map((item) => `- ${item.title}`).join("\n")
      : "- No recent memories yet.",
    "",
  ].join("\n");
}

function countItems(items) {
  return items.reduce((counts, item) => {
    if (!item) return counts;
    counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});
}

function countMatches(text, needles) {
  return needles.reduce(
    (total, needle) => total + (text.includes(needle) ? 1 : 0),
    0,
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function seedMemories() {
  return [
    {
      id: createId(),
      title: "The first memory belongs to the person using this",
      type: "Reflection",
      body: "This sample is here so the app does not feel empty. Delete it when you are ready. A useful memory includes what happened, why it mattered, and what still feels open.",
      tags: ["starting-point", "reflection"],
      pinned: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

function demoMemories() {
  const now = Date.now();
  return [
    {
      id: "demo-finish-up",
      title: "I almost abandoned SummitMind",
      type: "Project log",
      body: "The original app could capture memories, but it still felt like a note list. I paused because the product did not yet show a real before and after.",
      tags: ["finish-up", "project", "blocked"],
      pinned: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
    },
    {
      id: "demo-decision",
      title: "Decided to keep it local-first",
      type: "Decision",
      body: "I decided the private archive should stay in the browser first. Sync can come later, but trust has to be the first feature.",
      tags: ["privacy", "decision", "local-first"],
      pinned: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 9).toISOString(),
    },
    {
      id: "demo-review",
      title: "Monthly review needs a clear report",
      type: "Reflection",
      body: "A useful memory tool should summarize what keeps repeating: unfinished work, decisions, emotions, and ideas worth reopening.",
      tags: ["reflection", "report", "patterns"],
      pinned: false,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
  ];
}

render();
