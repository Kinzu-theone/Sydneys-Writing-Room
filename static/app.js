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
  el.innerHTML = `<svg width="320" height="180" viewBox="0 0 320 180" overflow="visible" fill="none" xmlns="http://www.w3.org/2000/svg">

    <!-- TAIL -->
    <path d="M320 112 Q295 100 270 110 Q250 118 235 114" stroke="#7a1515" stroke-width="20" stroke-linecap="round" fill="none"/>
    <path d="M235 114 Q218 110 205 120" stroke="#7a1515" stroke-width="22" stroke-linecap="round" fill="none"/>
    <path d="M320 112 Q295 98 270 108 Q250 116 235 112" stroke="#b02020" stroke-width="9" stroke-linecap="round" fill="none" opacity="0.4"/>
    <path d="M320 112 Q332 102 328 92 Q322 84 314 90 Q308 84 308 94 Q304 104 316 110Z" fill="#300808"/>
    <path d="M300 98 L303 84 L309 98Z" fill="#4a0808" stroke="#300808" stroke-width="1.5"/>
    <path d="M283 106 L286 92 L292 106Z" fill="#4a0808" stroke="#300808" stroke-width="1.5"/>
    <path d="M267 112 L270 99 L276 112Z" fill="#4a0808" stroke="#300808" stroke-width="1.5"/>
    <path d="M251 115 L254 102 L259 115Z" fill="#4a0808" stroke="#300808" stroke-width="1"/>

    <!-- BODY -->
    <ellipse cx="195" cy="130" rx="76" ry="42" fill="#7a1515"/>
    <ellipse cx="188" cy="122" rx="58" ry="28" fill="#b02020" opacity="0.35"/>
    <ellipse cx="190" cy="145" rx="53" ry="20" fill="#d4603a"/>
    <path d="M148 144 Q160 138 172 144 Q184 138 196 144 Q208 138 220 144 Q232 138 238 144" stroke="#b04428" stroke-width="1.5" fill="none" opacity="0.7"/>
    <path d="M152 153 Q164 147 176 153 Q188 147 200 153 Q212 147 224 153 Q232 147 236 153" stroke="#b04428" stroke-width="1.5" fill="none" opacity="0.6"/>
    <path d="M158 120 Q163 114 168 120 Q173 114 178 120 Q183 114 188 120 Q193 114 198 120 Q203 114 208 120 Q213 114 218 120 Q223 114 228 120" stroke="#300808" stroke-width="1.5" fill="none" opacity="0.45"/>
    <path d="M155 132 Q160 126 165 132 Q170 126 175 132 Q180 126 185 132 Q190 126 195 132 Q200 126 205 132 Q210 126 215 132 Q220 126 225 132 Q230 126 235 132" stroke="#300808" stroke-width="1.5" fill="none" opacity="0.45"/>

    <!-- BACK WING (behind body) -->
    <path d="M205 117 L242 32 L270 16 L262 48 L298 22 L284 60 L320 42 L304 82 L318 70 L308 102 L215 127 Z" fill="#4a0808" opacity="0.82"/>
    <path d="M208 120 L245 35" stroke="#300808" stroke-width="3.5" fill="none"/>
    <path d="M211 118 L272 18" stroke="#300808" stroke-width="3" fill="none"/>
    <path d="M214 116 L300 25" stroke="#300808" stroke-width="2.5" fill="none"/>
    <path d="M217 114 L320 44" stroke="#300808" stroke-width="2" fill="none"/>
    <path d="M228 107 Q258 62 272 20" stroke="#300808" stroke-width="1" fill="none" opacity="0.4"/>
    <path d="M240 102 Q272 68 304 30" stroke="#300808" stroke-width="1" fill="none" opacity="0.4"/>
    <path d="M242 32 L270 16 L298 22 L320 42 L308 102" stroke="#7a1515" stroke-width="2" fill="none" opacity="0.55"/>

    <!-- FRONT WING (in front) -->
    <path d="M172 112 L184 36 L208 13 L204 46 L234 20 L224 56 L252 38 L240 76 L248 66 L240 96 L182 120 Z" fill="#5a0c0c" opacity="0.88"/>
    <path d="M174 114 L187 38" stroke="#300808" stroke-width="3.5" fill="none"/>
    <path d="M177 112 L210 15" stroke="#300808" stroke-width="3" fill="none"/>
    <path d="M180 110 L236 22" stroke="#300808" stroke-width="2.5" fill="none"/>
    <path d="M182 108 L252 40" stroke="#300808" stroke-width="2" fill="none"/>
    <path d="M190 107 Q210 70 212 18" stroke="#300808" stroke-width="1" fill="none" opacity="0.4"/>
    <path d="M202 104 Q224 74 240 30" stroke="#300808" stroke-width="1" fill="none" opacity="0.4"/>
    <path d="M184 36 L208 13 L234 20 L252 38 L240 96" stroke="#7a1515" stroke-width="2" fill="none" opacity="0.55"/>

    <!-- NECK -->
    <path d="M150 122 Q118 110 94 102 Q70 96 48 92" stroke="#7a1515" stroke-width="30" stroke-linecap="round" fill="none"/>
    <path d="M150 120 Q118 108 94 100 Q70 94 48 90" stroke="#b02020" stroke-width="13" stroke-linecap="round" fill="none" opacity="0.3"/>
    <path d="M139 106 L143 90 L149 106Z" fill="#4a0808" stroke="#300808" stroke-width="1.5"/>
    <path d="M123 102 L127 86 L133 102Z" fill="#4a0808" stroke="#300808" stroke-width="1.5"/>
    <path d="M107 98 L111 82 L117 98Z" fill="#4a0808" stroke="#300808" stroke-width="1.5"/>
    <path d="M91 94 L94 79 L100 93Z" fill="#4a0808" stroke="#300808" stroke-width="1"/>
    <path d="M74 91 L77 76 L83 90Z" fill="#4a0808" stroke="#300808" stroke-width="1"/>

    <!-- HEAD (upper jaw) -->
    <ellipse cx="36" cy="90" rx="35" ry="24" fill="#7a1515"/>
    <path d="M36 80 Q16 76 2 78 Q-6 80 -8 87 Q-6 92 2 94 Q16 96 36 97Z" fill="#7a1515"/>
    <path d="M36 82 Q18 78 4 80 Q-2 82 -4 87" stroke="#b02020" stroke-width="3" fill="none" opacity="0.35" stroke-linecap="round"/>
    <path d="M8 82 Q13 78 18 82 Q23 78 28 82 Q33 78 36 82" stroke="#300808" stroke-width="1.5" fill="none" opacity="0.45"/>

    <!-- LOWER JAW -->
    <path d="M2 94 Q10 106 28 112 Q38 116 50 114 Q58 110 60 102 Q54 98 36 97 Q16 96 2 94Z" fill="#5a0808"/>
    <path d="M4 94 Q12 104 30 110 Q40 114 48 112" stroke="#8a2020" stroke-width="2" fill="none" opacity="0.35" stroke-linecap="round"/>

    <!-- MOUTH DARKNESS -->
    <path d="M2 94 Q20 98 36 97 Q36 102 26 106 Q12 103 2 94Z" fill="#150000" opacity="0.75"/>

    <!-- TEETH UPPER -->
    <path d="M6 94 L3 104 L10 94Z" fill="#f0ece0"/>
    <path d="M18 96 L16 106 L22 96Z" fill="#f0ece0"/>
    <path d="M30 97 L29 107 L34 97Z" fill="#f0ece0"/>
    <!-- TEETH LOWER -->
    <path d="M10 104 L8 94 L15 104Z" fill="#e8e4d8"/>
    <path d="M23 108 L22 98 L28 108Z" fill="#e8e4d8"/>

    <!-- TONGUE (forked) -->
    <path d="M-4 90 Q-15 88 -22 84" stroke="#cc2244" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M-22 84 Q-28 80 -30 76" stroke="#cc2244" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M-22 84 Q-28 88 -30 92" stroke="#cc2244" stroke-width="2.5" stroke-linecap="round" fill="none"/>

    <!-- NOSTRIL -->
    <ellipse cx="-3" cy="82" rx="2.5" ry="2" fill="#300808" transform="rotate(-15 -3 82)"/>

    <!-- EYE RIDGE / BROW -->
    <path d="M40 78 Q50 72 60 74" stroke="#300808" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <!-- EYE -->
    <ellipse cx="48" cy="80" rx="7.5" ry="6.5" fill="#0a0200"/>
    <ellipse cx="48" cy="80" rx="5.8" ry="5" fill="#e08010"/>
    <ellipse cx="48" cy="80" rx="2" ry="4.5" fill="#0a0200"/>
    <circle cx="49.5" cy="77" r="1.5" fill="white" opacity="0.85"/>

    <!-- HORNS -->
    <path d="M58 74 Q65 57 61 44" stroke="#300808" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M58 74 Q67 57 65 44" stroke="#5a0808" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.55"/>
    <path d="M48 72 Q52 58 48 48" stroke="#300808" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- EAR FRILL -->
    <path d="M34 78 Q24 67 18 60 Q28 70 34 78Z" fill="#4a0808"/>
    <path d="M34 78 Q22 70 16 66" stroke="#300808" stroke-width="1.5" fill="none" opacity="0.5"/>

    <!-- FIRE BREATH (mouth to left) -->
    <path d="M-8 88 Q-42 72 -72 60 Q-56 76 -74 82 Q-56 88 -72 104 Q-42 94 -8 92Z" fill="#ff6600" opacity="0.9"/>
    <path d="M-8 88 Q-36 74 -56 68 Q-42 80 -56 84 Q-42 88 -8 91Z" fill="#ffcc00" opacity="0.85"/>
    <path d="M-8 88 Q-26 80 -38 78 Q-28 83 -38 86 Q-28 89 -8 90Z" fill="#fff4a0" opacity="0.8"/>
    <path d="M-5 88 Q-15 84 -22 84 Q-15 86 -22 88 Q-15 90 -5 89Z" fill="white" opacity="0.65"/>

    <!-- FRONT CLAW -->
    <path d="M156 158 Q145 167 138 173" stroke="#5a0808" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M138 173 Q129 179 123 183" stroke="#300808" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M138 173 Q131 180 129 186" stroke="#300808" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M138 173 Q135 181 135 188" stroke="#300808" stroke-width="3" stroke-linecap="round" fill="none"/>

  </svg>`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());

  const babyConfigs = [
    { delay: 2.3, bottom: 108, bobDur: '0.38s', scale: 1.0 },
    { delay: 2.9, bottom:  96, bobDur: '0.44s', scale: 0.85 },
    { delay: 3.5, bottom: 112, bobDur: '0.36s', scale: 0.72 },
  ];

  const babySVG = `<svg width="90" height="75" viewBox="0 0 90 75" overflow="visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M90 38 Q78 34 70 40 Q64 45 60 42" stroke="#b02020" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M90 38 Q96 32 93 27 Q89 23 85 27 Q81 23 81 29 Q79 35 87 38Z" fill="#7a1515"/>
    <path d="M78 32 L80 24 L84 32Z" fill="#4a0808" stroke="#300808" stroke-width="1"/>
    <path d="M68 37 L70 29 L74 37Z" fill="#4a0808" stroke="#300808" stroke-width="1"/>
    <ellipse cx="56" cy="46" rx="24" ry="17" fill="#c23030"/>
    <ellipse cx="54" cy="53" rx="16" ry="9" fill="#e87050"/>
    <path d="M40 42 Q44 38 48 42 Q52 38 56 42 Q60 38 64 42 Q68 38 72 42" stroke="#300808" stroke-width="1" fill="none" opacity="0.4"/>
    <path d="M60 38 L66 16 L76 12 L72 24 L82 15 L76 32 L82 26 L78 42 L64 44Z" fill="#7a1515" opacity="0.85"/>
    <path d="M62 40 L68 18" stroke="#300808" stroke-width="2" fill="none"/>
    <path d="M64 39 L76 14" stroke="#300808" stroke-width="1.5" fill="none"/>
    <path d="M66 37 L82 17" stroke="#300808" stroke-width="1" fill="none"/>
    <path d="M66 16 L76 12 L82 15 L78 42" stroke="#7a1515" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M36 44 Q26 40 16 38" stroke="#c23030" stroke-width="13" stroke-linecap="round" fill="none"/>
    <path d="M36 43 Q26 39 16 37" stroke="#d85050" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.25"/>
    <path d="M30 36 L32 28 L36 36Z" fill="#4a0808" stroke="#300808" stroke-width="1"/>
    <path d="M22 34 L24 26 L28 34Z" fill="#4a0808" stroke="#300808" stroke-width="1"/>
    <ellipse cx="11" cy="36" rx="13" ry="10" fill="#c23030"/>
    <path d="M10 32 Q0 30 -5 32 Q-9 34 -9 38 Q-7 42 0 44 Q8 46 12 44Z" fill="#c23030"/>
    <path d="M10 34 Q0 32 -5 34" stroke="#d85050" stroke-width="1.5" fill="none" opacity="0.3"/>
    <ellipse cx="-6" cy="37" rx="1.8" ry="1.4" fill="#7a1515"/>
    <ellipse cx="-6" cy="41" rx="1.8" ry="1.4" fill="#7a1515"/>
    <path d="M19 29 Q18 11 20 4 Q22 0 25 4 Q27 11 25 29Z" fill="#c23030" stroke="#7a1515" stroke-width="1.5"/>
    <path d="M19 29 Q18 13 20 7 Q22 4 24 7 Q25 13 24 29Z" fill="#f0a080" opacity="0.55"/>
    <path d="M10 28 Q8 10 10 3 Q13 -1 16 3 Q18 10 16 28Z" fill="#c23030" stroke="#7a1515" stroke-width="1.5"/>
    <path d="M10 28 Q9 12 11 5 Q13 2 15 5 Q16 12 15 28Z" fill="#f0a080" opacity="0.55"/>
    <ellipse cx="14" cy="34" rx="4" ry="3.5" fill="#0a0200"/>
    <ellipse cx="14" cy="34" rx="2.8" ry="2.5" fill="#e08010"/>
    <ellipse cx="14" cy="34" rx="0.9" ry="2" fill="#0a0200"/>
    <circle cx="15" cy="32.5" r="0.8" fill="white" opacity="0.9"/>
    <path d="M-9 37 Q-20 33 -28 31 Q-22 36 -28 38 Q-22 40 -9 39Z" fill="#ff8800" opacity="0.85"/>
    <path d="M-9 37 Q-18 34 -22 33 Q-18 36 -22 38 Q-18 39 -9 38Z" fill="#ffdd00" opacity="0.9"/>
    <path d="M44 58 Q43 66 44 72" stroke="#9a2020" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M52 60 Q52 68 53 74" stroke="#9a2020" stroke-width="4" stroke-linecap="round" fill="none"/>
    <ellipse cx="44" cy="73" rx="4" ry="2.5" fill="#3a0808"/>
    <ellipse cx="53" cy="75" rx="4" ry="2.5" fill="#3a0808"/>
    <path d="M22 32 Q21 24 23 18" stroke="#7a1515" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M18 31 Q16 23 18 17" stroke="#7a1515" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </svg>`;

  babyConfigs.forEach(cfg => {
    const wrapper = document.createElement('div');
    wrapper.className = 'baby-dragon-wrapper';
    wrapper.style.bottom = cfg.bottom + 'px';
    wrapper.style.animation = `dragonFly 4.5s linear ${cfg.delay}s 1 forwards`;
    const bobDiv = document.createElement('div');
    bobDiv.className = 'baby-bob';
    bobDiv.style.animationDuration = cfg.bobDur;
    bobDiv.style.transform = `scale(${cfg.scale})`;
    bobDiv.style.transformOrigin = 'left center';
    bobDiv.innerHTML = babySVG;
    wrapper.appendChild(bobDiv);
    document.body.appendChild(wrapper);
    wrapper.addEventListener('animationend', () => wrapper.remove());
  });

  const canvas = document.getElementById('fire-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  let fireActive = true;

  function Particle(x, y) {
    this.x = x + (Math.random() - 0.5) * 40;
    this.y = y + Math.random() * 10;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -(1 + Math.random() * 3.5);
    this.life = 1;
    this.decay = 0.006 + Math.random() * 0.01;
    this.size = 8 + Math.random() * 22;
  }

  function fireLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (fireActive && el.isConnected) {
      const rect = el.getBoundingClientRect();
      const fireX = rect.left + 20;
      const fireY = rect.bottom - 20;
      for (let i = 0; i < 8; i++) particles.push(new Particle(fireX, fireY));
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.97;
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0,   `rgba(255, 240, 180, ${p.life})`);
      grad.addColorStop(0.4, `rgba(255, 100, 10, ${p.life * 0.85})`);
      grad.addColorStop(1,   `rgba(80, 0, 0, 0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    if (fireActive || particles.length > 0) requestAnimationFrame(fireLoop);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  setTimeout(() => {
    fireActive = false;
  }, 1500 + 4500 + 5000);

  setTimeout(fireLoop, 1500);
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
