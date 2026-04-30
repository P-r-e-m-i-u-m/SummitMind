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
const memoryTemplate = document.querySelector("#memoryTemplate");
const exportButton = document.querySelector("#exportButton");
const importInput = document.querySelector("#importInput");

let memories = loadMemories();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const memory = {
    id: createId(),
    title: titleInput.value.trim(),
    type: typeInput.value,
    body: bodyInput.value.trim(),
    tags: parseTags(tagsInput.value),
    createdAt: new Date().toISOString()
  };

  memories = [memory, ...memories];
  saveMemories(memories);
  form.reset();
  titleInput.focus();
  render();
});

searchInput.addEventListener("input", render);

exportButton.addEventListener("click", () => {
  const payload = {
    app: "SummitMind",
    version: 1,
    exportedAt: new Date().toISOString(),
    memories
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `memory-bank-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
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
    render();
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  } finally {
    importInput.value = "";
  }
});

timeline.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-button");
  if (!button) return;

  const id = button.dataset.id;
  const memory = memories.find((item) => item.id === id);
  if (!memory) return;

  const ok = confirm(`Delete "${memory.title}"?`);
  if (!ok) return;

  memories = memories.filter((item) => item.id !== id);
  saveMemories(memories);
  render();
});

function loadMemories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedMemories();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeMemory).filter(Boolean) : [];
  } catch {
    return seedMemories();
  }
}

function saveMemories(nextMemories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMemories));
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
    tags: Array.isArray(item.tags) ? item.tags.map(String).map(cleanTag).filter(Boolean) : [],
    createdAt: isValidDate(item.createdAt) ? item.createdAt : new Date().toISOString()
  };
}

function mergeMemories(current, imported) {
  const byId = new Map();
  [...imported, ...current].forEach((memory) => byId.set(memory.id, memory));
  return [...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = memories.filter((memory) => matchesQuery(memory, query));

  archiveCount.textContent = memories.length === 1
    ? "1 memory saved."
    : `${memories.length} memories saved.`;

  renderInsights(memories);
  renderTimeline(filtered, query);
}

function matchesQuery(memory, query) {
  if (!query) return true;
  const haystack = [
    memory.title,
    memory.type,
    memory.body,
    memory.tags.join(" ")
  ].join(" ").toLowerCase();
  return haystack.includes(query);
}

function renderTimeline(items, query) {
  timeline.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = query
      ? "No memories match that search yet."
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
  node.querySelector(".memory-meta").textContent = `${memory.type} | ${formatDate(memory.createdAt)}`;
  node.querySelector("h3").textContent = memory.title;
  node.querySelector(".memory-body").textContent = memory.body;

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
      year: "numeric"
    }).format(new Date(memory.createdAt));
    groups[label] ||= [];
    groups[label].push(memory);
    return groups;
  }, {});
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
        body: "Save a few memories and this space will start showing recurring themes, decisions, and unfinished loops."
      }
    ];
  }

  const allText = items.map((item) => `${item.title} ${item.body} ${item.tags.join(" ")}`).join(" ").toLowerCase();
  const tags = countItems(items.flatMap((item) => item.tags));
  const types = countItems(items.map((item) => item.type));
  const decisionCount = countMatches(allText, ["decided", "choose", "choice", "changed my mind", "commit"]);
  const unfinishedCount = countMatches(allText, ["unfinished", "stuck", "paused", "later", "someday", "blocked"]);
  const feelingCount = countMatches(allText, ["felt", "feel", "afraid", "excited", "tired", "confused", "clear"]);
  const topTag = Object.entries(tags).sort((a, b) => b[1] - a[1])[0];
  const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];

  return [
    {
      title: "Strongest theme",
      body: topTag ? `"${topTag[0]}" appears most often. That might be where your attention keeps returning.` : "Add tags to reveal recurring themes."
    },
    {
      title: "Archive shape",
      body: topType ? `${topType[0]} is your most common memory type. Your archive currently leans that way.` : "Your archive is still forming."
    },
    {
      title: "Decisions noticed",
      body: decisionCount ? `${decisionCount} decision signal${decisionCount === 1 ? "" : "s"} found. These are worth reviewing before you reopen old questions.` : "No strong decision signals yet."
    },
    {
      title: "Unfinished loops",
      body: unfinishedCount ? `${unfinishedCount} unfinished signal${unfinishedCount === 1 ? "" : "s"} found. Some of these may be old weight, some may be live ideas.` : "No obvious unfinished loops yet."
    },
    {
      title: "Emotional context",
      body: feelingCount ? `${feelingCount} feeling signal${feelingCount === 1 ? "" : "s"} found. This helps explain why things changed, not just what changed.` : "Try writing how a memory felt, not only what happened."
    }
  ];
}

function countItems(items) {
  return items.reduce((counts, item) => {
    if (!item) return counts;
    counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});
}

function countMatches(text, needles) {
  return needles.reduce((total, needle) => total + (text.includes(needle) ? 1 : 0), 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
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
      createdAt: new Date().toISOString()
    }
  ];
}

render();
