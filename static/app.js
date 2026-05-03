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

const ALL_PROMPTS = [
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
  "She was a cartographer of cursed lands — he was the curse she couldn't map.",
  "The sea witch offered her a voice. She asked for his name instead.",
  "Every time she used her magic, she aged a year. She'd burned through a decade for him before he even knew her name.",
  "He was the villain in every version of the prophecy. She was starting to think the prophecy was wrong.",
  "Write the first moment she realised she was falling for the one person she was supposed to destroy.",
  "The bond was supposed to be temporary. Neither of them knew how to tell the other it had stopped feeling that way.",
  "She built walls around her heart so high even gods couldn't breach them. He didn't climb them — he just waited on the other side.",
  "They were the same person in two different centuries, always missing each other by a lifetime.",
  "He could read every emotion she'd ever had — except the one she felt for him.",
  "The curse said she'd fall for her captor. She was furious to discover it was already happening.",
];

function getShuffledPrompts() {
  const arr = [...ALL_PROMPTS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let PROMPTS = getShuffledPrompts();

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
  if (tab === "prompts") PROMPTS = getShuffledPrompts();
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
  el.innerHTML = `<svg width="360" height="200" viewBox="0 0 360 200" overflow="visible" fill="none" xmlns="http://www.w3.org/2000/svg">

    <!-- TAIL -->
    <path d="M360 122 Q334 109 306 117 Q280 126 258 122" stroke="#1a2e42" stroke-width="22" stroke-linecap="round" fill="none"/>
    <path d="M258 122 Q238 116 218 126" stroke="#1a2e42" stroke-width="25" stroke-linecap="round" fill="none"/>
    <path d="M360 122 Q332 107 304 115 Q278 124 258 120" stroke="#2d4d68" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.45"/>
    <path d="M360 122 Q374 109 372 96 Q365 85 355 92 Q348 84 348 96 Q344 110 358 118Z" fill="#0d1a26"/>
    <path d="M336 106 L340 89 L346 106Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1.5"/>
    <path d="M314 114 L318 97 L324 114Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1.5"/>
    <path d="M292 118 L296 102 L302 118Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1.5"/>
    <path d="M270 121 L274 106 L279 121Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1"/>

    <!-- BODY -->
    <ellipse cx="202" cy="138" rx="82" ry="48" fill="#1a2e42"/>
    <ellipse cx="194" cy="126" rx="64" ry="32" fill="#2d4d68" opacity="0.28"/>
    <!-- BELLY - golden tan like reference -->
    <ellipse cx="198" cy="157" rx="58" ry="24" fill="#c8a050"/>
    <path d="M150 153 Q165 146 180 153 Q195 146 210 153 Q225 146 240 153 Q252 146 256 153" stroke="#a07838" stroke-width="1.5" fill="none" opacity="0.7"/>
    <path d="M154 164 Q169 157 184 164 Q199 157 214 164 Q228 157 242 164 Q252 157 255 164" stroke="#a07838" stroke-width="1.5" fill="none" opacity="0.6"/>
    <!-- Back scale texture -->
    <path d="M160 127 Q165 120 170 127 Q175 120 180 127 Q185 120 190 127 Q195 120 200 127 Q205 120 210 127 Q215 120 220 127 Q225 120 230 127" stroke="#0d1a26" stroke-width="1.5" fill="none" opacity="0.38"/>
    <!-- Back spines -->
    <path d="M156 119 L152 102 L160 117Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1"/>
    <path d="M173 114 L169 97 L177 112Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1"/>
    <path d="M190 110 L186 93 L194 108Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1"/>
    <path d="M207 111 L203 94 L211 109Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1"/>

    <!-- BACK WING (behind body) - large teal bat wing -->
    <path d="M212 122 L252 34 L282 16 L274 50 L312 26 L298 64 L336 46 L318 88 L332 76 L320 108 L222 132 Z" fill="#1f4a38" opacity="0.88"/>
    <path d="M215 125 L253 36" stroke="#0d1a26" stroke-width="3.5" fill="none"/>
    <path d="M218 122 L284 18" stroke="#0d1a26" stroke-width="3" fill="none"/>
    <path d="M222 118 L314 28" stroke="#0d1a26" stroke-width="2.5" fill="none"/>
    <path d="M226 114 L336 48" stroke="#0d1a26" stroke-width="2" fill="none"/>
    <path d="M252 34 L282 16 L312 26 L336 46 L320 108" stroke="#3d8b7a" stroke-width="2" fill="none" opacity="0.55"/>
    <path d="M216 124 L253 36 L282 16" stroke="#2a6858" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- FRONT WING (in front of body) - teal bat wing -->
    <path d="M176 115 L192 34 L220 10 L214 46 L246 20 L235 58 L264 40 L250 80 L258 68 L250 100 L186 125 Z" fill="#2a5c48" opacity="0.9"/>
    <path d="M178 117 L193 36" stroke="#0d1a26" stroke-width="3.5" fill="none"/>
    <path d="M181 114 L222 12" stroke="#0d1a26" stroke-width="3" fill="none"/>
    <path d="M185 111 L248 22" stroke="#0d1a26" stroke-width="2.5" fill="none"/>
    <path d="M188 108 L265 42" stroke="#0d1a26" stroke-width="2" fill="none"/>
    <path d="M192 34 L220 10 L246 20 L264 40 L250 100" stroke="#4aab9a" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M179 116 L193 36 L220 10" stroke="#3a8070" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- BACK LEG -->
    <path d="M232 174 Q224 183 216 190" stroke="#1a2e42" stroke-width="13" stroke-linecap="round" fill="none"/>
    <path d="M216 190 Q207 197 202 204" stroke="#0d1a26" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M216 190 Q208 198 205 205" stroke="#0d1a26" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M216 190 L213 200" stroke="#0d1a26" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M216 190 Q220 199 222 206" stroke="#0d1a26" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- FRONT LEG -->
    <path d="M160 162 Q150 172 142 180" stroke="#1a2e42" stroke-width="11" stroke-linecap="round" fill="none"/>
    <path d="M142 180 Q133 187 127 194" stroke="#0d1a26" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M142 180 Q135 188 132 195" stroke="#0d1a26" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M142 180 L139 191" stroke="#0d1a26" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M142 180 Q146 189 148 196" stroke="#0d1a26" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- NECK -->
    <path d="M154 126 Q120 112 95 104 Q70 98 48 94" stroke="#1a2e42" stroke-width="33" stroke-linecap="round" fill="none"/>
    <path d="M154 124 Q120 110 95 102 Q70 96 48 92" stroke="#2d4d68" stroke-width="14" stroke-linecap="round" fill="none" opacity="0.28"/>
    <path d="M150 138 Q118 126 93 118 Q68 112 48 108" stroke="#c8a050" stroke-width="14" stroke-linecap="round" fill="none" opacity="0.45"/>
    <path d="M141 108 L144 92 L150 108Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1.5"/>
    <path d="M124 104 L127 88 L133 104Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1.5"/>
    <path d="M107 100 L110 84 L116 100Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1.5"/>
    <path d="M90 96 L93 81 L99 95Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1"/>
    <path d="M73 93 L76 78 L82 92Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1"/>

    <!-- HEAD -->
    <ellipse cx="36" cy="92" rx="37" ry="26" fill="#1a2e42"/>
    <path d="M36 82 Q16 78 2 80 Q-8 82 -10 89 Q-8 94 2 96 Q16 98 36 99Z" fill="#1a2e42"/>
    <path d="M36 84 Q18 80 4 82 Q-3 84 -5 89" stroke="#2d4d68" stroke-width="3" fill="none" opacity="0.4" stroke-linecap="round"/>
    <path d="M8 83 Q13 79 18 83 Q23 79 28 83 Q33 79 36 83" stroke="#0d1a26" stroke-width="1.5" fill="none" opacity="0.45"/>

    <!-- LOWER JAW -->
    <path d="M2 96 Q10 108 28 114 Q38 118 52 116 Q61 112 63 104 Q57 100 36 99 Q16 98 2 96Z" fill="#152238"/>
    <path d="M4 96 Q12 106 30 112 Q40 116 50 114" stroke="#2d4d68" stroke-width="2" fill="none" opacity="0.35" stroke-linecap="round"/>
    <path d="M5 98 Q14 108 30 113 Q40 117 50 115" stroke="#c8a050" stroke-width="3" fill="none" opacity="0.38" stroke-linecap="round"/>

    <!-- MOUTH INTERIOR -->
    <path d="M2 96 Q20 100 36 99 Q36 104 26 108 Q12 105 2 96Z" fill="#080e1a" opacity="0.82"/>

    <!-- TEETH UPPER -->
    <path d="M6 96 L3 106 L10 96Z" fill="#f0ece0"/>
    <path d="M18 97 L16 107 L22 97Z" fill="#f0ece0"/>
    <path d="M30 98 L29 108 L34 98Z" fill="#f0ece0"/>
    <!-- TEETH LOWER -->
    <path d="M10 105 L8 95 L15 105Z" fill="#e8e4d8"/>
    <path d="M23 109 L22 99 L27 109Z" fill="#e8e4d8"/>

    <!-- TONGUE (forked) -->
    <path d="M-4 92 Q-16 90 -24 86" stroke="#cc2244" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M-24 86 Q-30 82 -32 77" stroke="#cc2244" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M-24 86 Q-30 90 -32 95" stroke="#cc2244" stroke-width="2.5" stroke-linecap="round" fill="none"/>

    <!-- NOSTRIL -->
    <ellipse cx="-4" cy="84" rx="2.5" ry="2" fill="#0d1a26" transform="rotate(-15 -4 84)"/>

    <!-- EYE BROW RIDGE -->
    <path d="M40 80 Q51 74 63 76" stroke="#0d1a26" stroke-width="5" stroke-linecap="round" fill="none"/>
    <!-- EYE -->
    <ellipse cx="50" cy="82" rx="8" ry="7" fill="#0a0e1a"/>
    <ellipse cx="50" cy="82" rx="6.2" ry="5.5" fill="#d4a010"/>
    <ellipse cx="50" cy="82" rx="2" ry="4.5" fill="#080600"/>
    <circle cx="51.5" cy="79" r="1.5" fill="white" opacity="0.85"/>

    <!-- HORNS -->
    <path d="M62 76 Q72 56 68 42" stroke="#0d1a26" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M62 76 Q74 56 72 42" stroke="#2d4060" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.45"/>
    <path d="M52 74 Q56 58 52 46" stroke="#0d1a26" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M44 77 Q47 64 44 54" stroke="#0d1a26" stroke-width="4" stroke-linecap="round" fill="none"/>

    <!-- EAR FRILL -->
    <path d="M36 80 Q25 68 19 62 Q29 72 36 80Z" fill="#1f4a38"/>
    <path d="M36 80 Q23 70 17 66" stroke="#0d1a26" stroke-width="1.5" fill="none" opacity="0.5"/>

    <!-- FIRE BREATH -->
    <path d="M-10 90 Q-44 74 -74 62 Q-58 78 -76 84 Q-58 90 -76 106 Q-44 96 -10 93Z" fill="#ff6600" opacity="0.9"/>
    <path d="M-10 90 Q-38 76 -58 70 Q-44 82 -58 86 Q-44 90 -10 92Z" fill="#ffcc00" opacity="0.85"/>
    <path d="M-10 90 Q-28 82 -40 80 Q-30 85 -40 88 Q-30 91 -10 91Z" fill="#fff4a0" opacity="0.8"/>
    <path d="M-7 90 Q-18 86 -25 86 Q-17 88 -25 90 Q-17 92 -7 91Z" fill="white" opacity="0.65"/>

  </svg>`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());

  const babyConfigs = [
    { delay: 2.3, bottom: 108, bobDur: '0.38s', scale: 1.0 },
    { delay: 2.9, bottom:  96, bobDur: '0.44s', scale: 0.85 },
    { delay: 3.5, bottom: 112, bobDur: '0.36s', scale: 0.72 },
  ];

  const babySVG = `<svg width="90" height="75" viewBox="0 0 90 75" overflow="visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M90 38 Q78 34 70 40 Q64 45 60 42" stroke="#1a2e42" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M90 38 Q96 32 93 27 Q89 23 85 27 Q81 23 81 29 Q79 35 87 38Z" fill="#0d1a26"/>
    <path d="M78 32 L80 24 L84 32Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1"/>
    <path d="M68 37 L70 29 L74 37Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1"/>
    <ellipse cx="56" cy="46" rx="24" ry="17" fill="#1a2e42"/>
    <ellipse cx="54" cy="53" rx="16" ry="9" fill="#c8a050"/>
    <path d="M40 42 Q44 38 48 42 Q52 38 56 42 Q60 38 64 42 Q68 38 72 42" stroke="#0d1a26" stroke-width="1" fill="none" opacity="0.4"/>
    <path d="M60 38 L66 16 L76 12 L72 24 L82 15 L76 32 L82 26 L78 42 L64 44Z" fill="#1f4a38" opacity="0.88"/>
    <path d="M62 40 L68 18" stroke="#0d1a26" stroke-width="2" fill="none"/>
    <path d="M64 39 L76 14" stroke="#0d1a26" stroke-width="1.5" fill="none"/>
    <path d="M66 37 L82 17" stroke="#0d1a26" stroke-width="1" fill="none"/>
    <path d="M66 16 L76 12 L82 15 L78 42" stroke="#3d8b7a" stroke-width="1.5" fill="none" opacity="0.55"/>
    <path d="M36 44 Q26 40 16 38" stroke="#1a2e42" stroke-width="13" stroke-linecap="round" fill="none"/>
    <path d="M36 43 Q26 39 16 37" stroke="#2d4d68" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.25"/>
    <path d="M30 36 L32 28 L36 36Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1"/>
    <path d="M22 34 L24 26 L28 34Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1"/>
    <ellipse cx="11" cy="36" rx="13" ry="10" fill="#1a2e42"/>
    <path d="M10 32 Q0 30 -5 32 Q-9 34 -9 38 Q-7 42 0 44 Q8 46 12 44Z" fill="#1a2e42"/>
    <path d="M10 34 Q0 32 -5 34" stroke="#2d4d68" stroke-width="1.5" fill="none" opacity="0.3"/>
    <ellipse cx="-6" cy="37" rx="1.8" ry="1.4" fill="#0d1a26"/>
    <ellipse cx="-6" cy="41" rx="1.8" ry="1.4" fill="#0d1a26"/>
    <path d="M19 29 Q18 11 20 4 Q22 0 25 4 Q27 11 25 29Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1.5"/>
    <path d="M19 29 Q18 13 20 7 Q22 4 24 7 Q25 13 24 29Z" fill="#4aab9a" opacity="0.5"/>
    <path d="M10 28 Q8 10 10 3 Q13 -1 16 3 Q18 10 16 28Z" fill="#2a5c48" stroke="#0d1a26" stroke-width="1.5"/>
    <path d="M10 28 Q9 12 11 5 Q13 2 15 5 Q16 12 15 28Z" fill="#4aab9a" opacity="0.5"/>
    <ellipse cx="14" cy="34" rx="4" ry="3.5" fill="#0a0e1a"/>
    <ellipse cx="14" cy="34" rx="2.8" ry="2.5" fill="#d4a010"/>
    <ellipse cx="14" cy="34" rx="0.9" ry="2" fill="#0a0e1a"/>
    <circle cx="15" cy="32.5" r="0.8" fill="white" opacity="0.9"/>
    <path d="M-9 37 Q-20 33 -28 31 Q-22 36 -28 38 Q-22 40 -9 39Z" fill="#ff8800" opacity="0.85"/>
    <path d="M-9 37 Q-18 34 -22 33 Q-18 36 -22 38 Q-18 39 -9 38Z" fill="#ffdd00" opacity="0.9"/>
    <path d="M44 58 Q43 66 44 72" stroke="#152238" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M52 60 Q52 68 53 74" stroke="#152238" stroke-width="4" stroke-linecap="round" fill="none"/>
    <ellipse cx="44" cy="73" rx="4" ry="2.5" fill="#0d1a26"/>
    <ellipse cx="53" cy="75" rx="4" ry="2.5" fill="#0d1a26"/>
    <path d="M22 32 Q21 24 23 18" stroke="#0d1a26" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M18 31 Q16 23 18 17" stroke="#0d1a26" stroke-width="2.5" stroke-linecap="round" fill="none"/>
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

  // Scorch mark canvas - reveals right-to-left as dragon flies past
  const scorchCanvas = document.createElement('canvas');
  scorchCanvas.style.cssText = 'position:fixed;bottom:0;left:0;pointer-events:none;z-index:9989;';
  scorchCanvas.width = window.innerWidth;
  scorchCanvas.height = 100;
  document.body.appendChild(scorchCanvas);
  const sCtx = scorchCanvas.getContext('2d');

  // Draw pattern on offscreen canvas so we can re-composite each frame
  const scorchOffscreen = document.createElement('canvas');
  scorchOffscreen.width = scorchCanvas.width;
  scorchOffscreen.height = scorchCanvas.height;
  const oCtx = scorchOffscreen.getContext('2d');
  const emberPositions = [];
  (function drawScorchPattern() {
    const w = scorchOffscreen.width;
    const h = scorchOffscreen.height;
    for (let x = -20; x < w + 20; x += 14) {
      const r = 28 + Math.random() * 38;
      const g = oCtx.createRadialGradient(x, h, 0, x, h, r);
      g.addColorStop(0,   'rgba(6, 2, 0, 0.88)');
      g.addColorStop(0.4, 'rgba(22, 7, 0, 0.48)');
      g.addColorStop(1,   'rgba(0,0,0,0)');
      oCtx.beginPath();
      oCtx.ellipse(x + (Math.random() - 0.5) * 20, h, r * 1.3, r * 0.55, 0, 0, Math.PI * 2);
      oCtx.fillStyle = g;
      oCtx.fill();
    }
    for (let x = 30; x < w; x += 50 + Math.random() * 60) {
      emberPositions.push(x);
      const eg = oCtx.createRadialGradient(x, h - 10, 0, x, h - 10, 14);
      eg.addColorStop(0,   'rgba(255, 110, 0, 0.55)');
      eg.addColorStop(0.5, 'rgba(180, 40, 0, 0.22)');
      eg.addColorStop(1,   'rgba(0,0,0,0)');
      oCtx.beginPath();
      oCtx.arc(x, h - 10, 14, 0, Math.PI * 2);
      oCtx.fillStyle = eg;
      oCtx.fill();
    }
  })();

  // Spark particles for live ember animation
  const sparks = [];
  function Spark(x) {
    this.x = x + (Math.random() - 0.5) * 24;
    this.y = scorchCanvas.height - 8;
    this.vx = (Math.random() - 0.5) * 1.4;
    this.vy = -(2.0 + Math.random() * 4.5);
    this.life = 0.9 + Math.random() * 0.1;
    this.decay = 0.006 + Math.random() * 0.010;
    this.size = 2.5 + Math.random() * 4.0;
    this.hot = Math.random() < 0.5;
  }

  let emberActive = false;
  function emberLoop() {
    if (!emberActive) return;
    sCtx.clearRect(0, 0, scorchCanvas.width, scorchCanvas.height);
    sCtx.drawImage(scorchOffscreen, 0, 0);

    // Spawn sparks
    if (Math.random() < 0.85 && emberPositions.length) {
      const px = emberPositions[Math.floor(Math.random() * emberPositions.length)];
      sparks.push(new Spark(px));
      if (Math.random() < 0.4) sparks.push(new Spark(px));
    }

    // Update and draw sparks with glow
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy *= 0.98;
      s.life -= s.decay;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const r = s.hot ? 255 : 255;
      const g = s.hot ? 180 : 80;
      const b = s.hot ? 50 : 0;
      // Glow halo
      const glow = sCtx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3);
      glow.addColorStop(0,   `rgba(${r},${g},${b},${s.life * 0.6})`);
      glow.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      sCtx.beginPath();
      sCtx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
      sCtx.fillStyle = glow;
      sCtx.fill();
      // Bright core
      sCtx.beginPath();
      sCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      sCtx.fillStyle = `rgba(${r},${g},${b},${s.life})`;
      sCtx.fill();
    }
    requestAnimationFrame(emberLoop);
  }

  // Animate reveal sweeping from right to left
  setTimeout(() => {
    const revealDuration = 3800;
    const startTime = performance.now();
    function revealScorch(timestamp) {
      const progress = Math.min((timestamp - startTime) / revealDuration, 1);
      const revealEdge = scorchCanvas.width * (1 - progress);
      sCtx.clearRect(0, 0, scorchCanvas.width, scorchCanvas.height);
      sCtx.drawImage(scorchOffscreen, 0, 0);
      sCtx.globalCompositeOperation = 'destination-out';
      const mask = sCtx.createLinearGradient(revealEdge, 0, revealEdge + 90, 0);
      mask.addColorStop(0, 'rgba(0,0,0,1)');
      mask.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = mask;
      sCtx.fillRect(0, 0, revealEdge + 90, scorchCanvas.height);
      sCtx.globalCompositeOperation = 'source-over';
      if (progress < 1) {
        requestAnimationFrame(revealScorch);
      } else {
        // Start ember animation once scorch is fully revealed
        emberActive = true;
        emberLoop();
        setTimeout(() => {
          emberActive = false;
          scorchCanvas.style.transition = 'opacity 10s ease';
          scorchCanvas.style.opacity = '0';
          setTimeout(() => scorchCanvas.remove(), 10500);
        }, 6000);
      }
    }
    requestAnimationFrame(revealScorch);
  }, 2200);

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
