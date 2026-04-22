let notes = [];
let activeTab = "pinned";
let editingId = null;

const grid = document.getElementById("notes-grid");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const form = document.getElementById("note-form");

async function fetchNotes() {
  const res = await fetch("/api/notes");
  notes = await res.json();
  renderNotes();
}

const PROMPTS = [
  "She touched the ancient map and felt it pulse beneath her fingers — it wasn't showing her a place. It was showing her a person.",
  "He was cursed to forget everyone he loved by sunrise. She was the only one who kept coming back.",
  "The dragon didn't take her as a prisoner. It brought her there to keep her safe from the kingdom that wanted her dead.",
  "Two rival heirs to enemy thrones are magically bound — they feel each other's pain, heartbeat, and worst of all, desire.",
  "She swore she'd never trust a fae. Then one saved her life and asked for nothing in return — which terrified her more.",
  "The stars in this world are the souls of dead gods. Tonight, one fell — and landed at her feet still breathing.",
  "He was sent to assassinate the queen. He did not expect the queen to already know he was coming, or to offer him tea.",
  "Write about a love that was prophesied but chose each other anyway.",
  "The enchanted forest only lets you leave if you give something up. She didn't expect it to ask for her loneliness.",
  "He has lived a thousand years and felt nothing. She walked in and ruined all of that in an afternoon.",
  "She found his name written in her own handwriting inside a book that was sealed for a century.",
  "They only ever meet in dreams. One night, he doesn't show up — and she realises she has to find him in the waking world.",
  "The magic chooses its wielder by heartbreak. She was the most powerful mage in a generation, which told you everything.",
  "Write the moment two enemies realise the war they've been fighting was engineered to keep them apart.",
  "She was made from moonlight and he was made from shadow — and every night they got exactly one hour together.",
  "They were each other's greatest love. Then she found out what he did to her kingdom, and had to decide if the truth could undo everything.",
  "He had her letters. All of them. Written before she knew he was the enemy — tender, honest, devastating. He never told her he'd read them.",
  "She loved him completely, until the night she watched him choose power over her. Now they sit on opposite sides of the same war council.",
  "Write the scene where two former lovers meet again across a battlefield — and neither of them gives the order to fire.",
  "He was the only person she ever truly trusted. Which is exactly why his betrayal broke something in her that magic couldn't fix.",
];

function getFilteredNotes() {
  if (activeTab === "pinned")   return notes.filter(n => n.pinned && !n.archived);
  if (activeTab === "all")      return notes.filter(n => !n.archived);
  if (activeTab === "archived") return notes.filter(n => n.archived);
  return notes.filter(n => !n.archived);
}

function tagClass(tag) {
  if (!tag) return "";
  const map = { "Idea": "tag-idea", "Work": "tag-work", "Personal": "tag-personal", "To-Do": "tag-todo" };
  return map[tag] || "tag-personal";
}

function renderNotes() {
  if (activeTab === "prompts") {
    grid.innerHTML = PROMPTS.map((p, i) => `
      <div class="note-card prompt-card" data-prompt-index="${i}">
        <div class="card-content" style="font-style:italic;">"${escHtml(p)}"</div>
        <div class="card-footer">
          <span class="use-prompt-btn">Use this prompt ✍️</span>
        </div>
      </div>
    `).join("");

  grid.querySelectorAll('.prompt-card').forEach(card => {
    card.addEventListener('click', () => {
      usePrompt(PROMPTS[card.dataset.promptIndex]);
    });
  });
    return;
  }
  const filtered = getFilteredNotes();
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>No notes here yet.</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(n => `
    <div class="note-card ${n.pinned ? "pinned" : ""}" data-id="${n.id}">
      <div class="card-actions">
        <button class="pinned-btn ${n.pinned ? "active" : ""}" onclick="togglePin('${n.id}', event)" title="${n.pinned ? "Unpin" : "Pin"}">📌</button>
        <button onclick="openEdit('${n.id}', event)" title="Edit">✏️</button>
        <button onclick="toggleArchive('${n.id}', event)" title="${n.archived ? "Unarchive" : "Archive"}">📦</button>
        <button onclick="deleteNote('${n.id}', event)" title="Delete">🗑️</button>
      </div>
      <div class="card-title">${escHtml(n.title)}</div>
      <div class="card-content">${escHtml(n.content)}</div>
      <div class="card-date">${n.created_at}</div>
      ${n.tag ? `<div class="card-footer"><span class="card-tag ${tagClass(n.tag)}">${escHtml(n.tag)}</span></div>` : ""}
    </div>
  `).join("");
}

function escHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
  renderNotes();
}

function usePrompt(prompt) {
  document.getElementById("writing-prompt-text").textContent = prompt;
  document.getElementById("writing-title").value = "";
  document.getElementById("writing-area").value = "";
  document.getElementById("writing-overlay").classList.add("open");
  setTimeout(() => document.getElementById("writing-area").focus(), 300);
}

function closeWriting() {
  document.getElementById("writing-overlay").classList.remove("open");
}

async function saveWriting() {
  const title = document.getElementById("writing-title").value.trim();
  const content = document.getElementById("writing-area").value.trim();
  const prompt = document.getElementById("writing-prompt-text").textContent;
  if (!title && !content) return;
  await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title || "Untitled",
      content: content,
      tag: "Idea",
      color: "#2d2d2d",
      pinned: false,
      archived: false,
    }),
  });
  closeWriting();
  fetchNotes();
  setTab("all");
}

function openAdd() {
  editingId = null;
  modalTitle.textContent = "New Note";
  form.reset();
  modal.classList.add("open");
}

function openEdit(id, e) {
  e.stopPropagation();
  editingId = id;
  const note = notes.find(n => n.id === id);
  if (!note) return;
  modalTitle.textContent = "Edit Note";
  document.getElementById("f-title").value = note.title;
  document.getElementById("f-content").value = note.content;
  document.getElementById("f-tag").value = note.tag || "";
  document.getElementById("f-pinned").checked = note.pinned;
  modal.classList.add("open");
}

function closeModal() {
  modal.classList.remove("open");
  editingId = null;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById("f-title").value.trim(),
    content: document.getElementById("f-content").value.trim(),
    tag: document.getElementById("f-tag").value,
    color: "#2d2d2d",
    pinned: document.getElementById("f-pinned").checked,
    archived: false,
  };
  if (!payload.title) return;

  if (editingId) {
    await fetch(`/api/notes/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } else {
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
  closeModal();
  fetchNotes();
});

async function togglePin(id, e) {
  e.stopPropagation();
  await fetch(`/api/notes/${id}/pin`, { method: "PATCH" });
  fetchNotes();
}

async function toggleArchive(id, e) {
  e.stopPropagation();
  await fetch(`/api/notes/${id}/archive`, { method: "PATCH" });
  fetchNotes();
}

async function deleteNote(id, e) {
  e.stopPropagation();
  if (!confirm("Delete this note?")) return;
  await fetch(`/api/notes/${id}`, { method: "DELETE" });
  fetchNotes();
}

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

fetchNotes();
spawnSparkles();
spawnFooterDragon();

function spawnFooterDragon() {
  setTimeout(_runDragon, 1500);
}

function _runDragon() {
  const el = document.createElement('div');
  el.id = 'footer-dragon';
  el.innerHTML = `<svg width="260" height="160" viewBox="0 0 260 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 82 Q-10 68 -35 58 Q-22 74 -38 80 Q-22 86 -35 102 Q-10 92 18 86Z" fill="#ff6600"/>
    <path d="M18 82 Q-6 70 -22 64 Q-10 78 -24 82 Q-10 86 18 85Z" fill="#ffdd00" opacity="0.9"/>
    <path d="M210 100 Q240 94 258 78 Q250 66 236 72 Q224 66 210 82Z" fill="#7b2fd4"/>
    <path d="M196 102 Q228 96 250 82 Q260 74 256 62 Q240 58 226 66 Q210 64 198 80Z" fill="#9044e0"/>
    <ellipse cx="138" cy="102" rx="78" ry="38" fill="#7b2fd4"/>
    <ellipse cx="126" cy="114" rx="56" ry="22" fill="#b060f0"/>
    <path d="M128 80 Q108 30 64 8 Q88 42 106 66Z" fill="#9933dd" opacity="0.9"/>
    <path d="M128 80 Q148 26 190 6 Q168 40 150 66Z" fill="#9933dd" opacity="0.9"/>
    <path d="M128 80 Q108 30 64 8" stroke="#5a00aa" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M128 80 Q148 26 190 6" stroke="#5a00aa" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M74 96 Q54 88 40 80" stroke="#7b2fd4" stroke-width="26" stroke-linecap="round" fill="none"/>
    <ellipse cx="32" cy="76" rx="32" ry="23" fill="#7b2fd4"/>
    <path d="M8 78 Q-4 76 -8 68 Q-4 60 10 64 Q20 60 30 68Z" fill="#5a00aa"/>
    <path d="M42 56 Q48 38 55 30" stroke="#5a00aa" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M34 53 Q38 36 42 27" stroke="#5a00aa" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M6 76 Q2 86 10 92 Q24 96 40 90 Q50 86 52 80" fill="#5a00aa"/>
    <path d="M12 78 L9 89 L16 79Z" fill="white"/>
    <path d="M24 76 L22 88 L29 77Z" fill="white"/>
    <circle cx="28" cy="68" r="9" fill="#1a0440"/>
    <circle cx="28" cy="68" r="6" fill="#ffdd00"/>
    <ellipse cx="28" cy="68" rx="2.5" ry="5" fill="#0a0220"/>
    <circle cx="30" cy="65" r="1.8" fill="white" opacity="0.9"/>
  </svg>`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function spawnSparkles() {
  const colors = ['#ffd700', '#ffec6e', '#ffe066', '#fbbf24', '#f59e0b', '#fff8dc', '#fffacd'];
  const count = 55;
  const headerH = document.querySelector('.header').offsetHeight + 100;

  for (let i = 0; i < count; i++) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('class', 'sparkle');
    const size = 24 + Math.random() * 36;
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * headerH;
    const delay = Math.random() * 1.0;
    const dur = 1.0 + Math.random() * 1.0;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const r = size / 2;
    const p = `${r},0 ${r*0.12},${r*0.12} 0,${r} ${-r*0.12},${r*0.12} ${-r},0 ${-r*0.12},${-r*0.12} 0,${-r} ${r*0.12},${-r*0.12}`;
    el.setAttribute('width', size);
    el.setAttribute('height', size);
    el.setAttribute('viewBox', `${-r} ${-r} ${size} ${size}`);
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;overflow:visible;pointer-events:none;z-index:999;animation:sparklePop ${dur}s ease-out ${delay}s 1 forwards;opacity:0;`;
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', p);
    poly.setAttribute('fill', color);
    el.appendChild(poly);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), (delay + dur + 0.1) * 1000);
  }
}
