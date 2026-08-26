const PLACES = [
  {
    name: "Shree Ramnath Damodar Temple",
    area: "Zambaulim, South Goa",
    cat: "Spiritual",
    dist: "196 m away",
    rating: "4.8",
    img: "https://images.unsplash.com/photo-1582510003544-4d00b8af1fe0?auto=format&fit=crop&w=1200&q=80",
    about:
      "A living temple — not a postcard stop. Come at dusk when the lamps are lit and the courtyard still belongs to the village.",
  },
  {
    name: "Vagator Beach",
    area: "Bardez, North Goa",
    cat: "Beaches",
    dist: "2.1 km away",
    rating: "4.7",
    img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    about:
      "Red cliffs, a wide curve of sand, and a sunset that still earns the crowds. Walk north for quieter water.",
  },
  {
    name: "Cafe Bodega",
    area: "Panaji",
    cat: "Food & Drink",
    dist: "4.8 km away",
    rating: "4.6",
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    about:
      "Courtyard tables, strong coffee, and Goan bakery that locals actually queue for. Best before 11.",
  },
  {
    name: "Dudhsagar trailhead",
    area: "Sonaulim",
    cat: "Hidden Goa",
    dist: "38 km away",
    rating: "4.9",
    img: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
    about:
      "Mist, forest, and a fall that looks like milk from a distance. Go early. Skip it in peak monsoon if you dislike mud.",
  },
  {
    name: "Palolem night market",
    area: "Canacona",
    cat: "Nightlife",
    dist: "12 km away",
    rating: "4.4",
    img: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
    about:
      "Soft lamps, live music, and seafood that still tastes of the catch. Stay for the last song, leave before the scooters pile up.",
  },
];

const CATS = ["All", "Beaches", "Food & Drink", "Stays", "Hidden Goa", "Nightlife", "Spiritual"];
const SCREENS = [
  ["discover", "Discover"],
  ["detail", "Place detail"],
  ["map", "Map"],
  ["plan", "Plan trip"],
  ["itinerary", "Itinerary"],
  ["saved", "Saved"],
  ["journal", "Journal"],
  ["guide", "GoaGuide AI"],
  ["profile", "Profile"],
];

const INTERESTS = [
  ["🏖️", "Beaches"],
  ["🍽️", "Food & drink"],
  ["⛰️", "Adventure"],
  ["🍸", "Nightlife"],
  ["🛕", "Culture"],
  ["🌿", "Nature"],
  ["🛍️", "Shopping"],
  ["📷", "Photography"],
];

let cat = "All";
let index = 0;
let saved = [PLACES[0]];
let planStep = 0;
const plan = {
  where: "Goa",
  who: "Friends",
  style: "Mid-range",
  vibe: "Relaxation",
  loves: ["Beaches", "Food & drink"],
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function toast(msg) {
  const el = $("#toast");
  el.hidden = false;
  el.textContent = msg;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 1600);
}

function go(name) {
  $$(".screen").forEach((s) => s.classList.toggle("is-active", s.dataset.screen === name));
  $$("#tabbar button[data-go]").forEach((b) => b.classList.toggle("is-on", b.dataset.go === name));
  $$("#screenNav button").forEach((b) => b.classList.toggle("is-on", b.dataset.go === name));
  if (name === "detail") renderDetail();
  if (name === "map") renderMapSheet();
  if (name === "saved") renderSaved();
  if (name === "plan") renderPlan();
}

function filtered() {
  return cat === "All" ? PLACES : PLACES.filter((p) => p.cat === cat);
}

function current() {
  const list = filtered();
  return list[index % list.length];
}

function renderChips() {
  $("#categoryChips").innerHTML = CATS.map(
    (c) => `<button data-cat="${c}" class="${c === cat ? "is-on" : ""}">${c}</button>`
  ).join("");
}

function renderDeck() {
  const list = filtered();
  if (!list.length) {
    $("#deck").innerHTML = `<div class="card behind"></div>`;
    return;
  }
  const a = list[index % list.length];
  const b = list[(index + 1) % list.length];
  $("#deck").innerHTML = `
    <article class="card behind">
      <img src="${b.img}" alt="" />
    </article>
    <article class="card" id="topCard">
      <img src="${a.img}" alt="${a.name}" />
      <div class="shade"></div>
      <div class="badges-row">
        <div>
          <span class="pill cat">${a.cat}</span>
          <div class="pill dist">${a.dist}</div>
        </div>
        <span class="pill ok">Verified</span>
      </div>
      <div class="card-copy">
        <h3>${a.name}</h3>
        <p>📍 ${a.area} · ★ ${a.rating}</p>
      </div>
    </article>
  `;
  bindSwipe($("#topCard"));
}

function bindSwipe(card) {
  if (!card) return;
  let x0 = 0, dragging = false;
  const start = (x) => { dragging = true; x0 = x; card.style.transition = "none"; };
  const move = (x) => {
    if (!dragging) return;
    const dx = x - x0;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 28}deg)`;
  };
  const end = (x) => {
    if (!dragging) return;
    dragging = false;
    const dx = x - x0;
    card.style.transition = "transform .35s ease, opacity .35s ease";
    if (dx > 90) { card.style.transform = "translateX(420px) rotate(18deg)"; setTimeout(() => savePlace(), 220); }
    else if (dx < -90) { card.style.transform = "translateX(-420px) rotate(-18deg)"; setTimeout(() => skipPlace(), 220); }
    else card.style.transform = "";
  };
  card.onpointerdown = (e) => { card.setPointerCapture(e.pointerId); start(e.clientX); };
  card.onpointermove = (e) => move(e.clientX);
  card.onpointerup = (e) => end(e.clientX);
}

function skipPlace() {
  index += 1;
  toast("Passed");
  renderDeck();
}

function savePlace() {
  const p = current();
  if (!saved.find((s) => s.name === p.name)) saved.unshift(p);
  toast("Saved to your Goa list");
  index += 1;
  renderDeck();
}

function renderDetail() {
  const p = current();
  const img = $("#detailImg");
  img.src = p.img;
  img.alt = p.name;
  $("#detailBody").innerHTML = `
    <span class="pill cat">${p.cat}</span>
    <h2>${p.name}</h2>
    <div class="meta"><span>★ ${p.rating}</span><span>·</span><span>${p.dist}</span><span>·</span><span>${p.area}</span></div>
    <p class="about">${p.about}</p>
    <h4 class="section-h">Good to know</h4>
    <p class="about">Open now · Quietest after 6pm · Pair with a slow walk through the village lanes.</p>
  `;
}

function renderMapSheet() {
  const p = current();
  $("#mapSheet").innerHTML = `
    <p class="kicker gold">Nearby</p>
    <h3>${p.name}</h3>
    <p>${p.dist} · ${p.area}</p>
    <button class="btn solid full" data-go="detail">View place</button>
  `;
}

function renderSaved() {
  $("#savedList").innerHTML = saved
    .map(
      (p) => `
      <article class="saved-row">
        <img src="${p.img}" alt="" />
        <div>
          <h4>${p.name}</h4>
          <p>${p.area}</p>
        </div>
      </article>`
    )
    .join("");
}

function renderPlan() {
  const titles = [
    "Where, and with whom?",
    "What excites you most?",
    "How do you like to travel?",
    "We’ll shape the days around you.",
  ];
  $("#planTitle").textContent = titles[planStep];
  $("#planProgress").innerHTML = [0, 1, 2, 3].map((i) => `<i class="${i <= planStep ? "on" : ""}"></i>`).join("");
  const nextLabel = planStep === 3 ? "Build my itinerary" : "Continue";
  $("#planNext").textContent = nextLabel;

  if (planStep === 0) {
    $("#planStep").innerHTML = `
      <p class="kicker">Where are you going?</p>
      <div class="choice" id="where">
        ${["Goa", "Gokarna", "Kerala", "Andaman"].map((w) => `<button class="${plan.where === w ? "on" : ""}">${w}</button>`).join("")}
      </div>
      <p class="kicker">When</p>
      <div class="dates">
        <label>Check-in<b>12 Sep</b></label>
        <label>Check-out<b>16 Sep</b></label>
      </div>
      <p class="kicker" style="margin-top:18px">Who’s coming?</p>
      <div class="choice" id="who">
        ${["Solo", "Couple", "Friends", "Family"].map((w) => `<button class="${plan.who === w ? "on" : ""}">${w}</button>`).join("")}
      </div>
    `;
  }
  if (planStep === 1) {
    $("#planStep").innerHTML = `
      <p class="kicker">Choose up to 5</p>
      <div class="interest-grid">
        ${INTERESTS.map(
          ([i, n]) => `<button class="interest ${plan.loves.includes(n) ? "on" : ""}" data-n="${n}"><span>${i}</span>${n}</button>`
        ).join("")}
      </div>
    `;
  }
  if (planStep === 2) {
    $("#planStep").innerHTML = `
      <p class="kicker">Budget</p>
      <div class="choice" id="style">
        ${["Budget", "Mid-range", "Luxury"].map((w) => `<button class="${plan.style === w ? "on" : ""}">${w}</button>`).join("")}
      </div>
      <p class="kicker">Trip type</p>
      <div class="choice" id="vibe">
        ${["Relaxation", "Adventure", "Party"].map((w) => `<button class="${plan.vibe === w ? "on" : ""}">${w}</button>`).join("")}
      </div>
    `;
  }
  if (planStep === 3) {
    $("#planStep").innerHTML = `
      <article class="trip-card">
        <div>
          <p class="kicker gold">${plan.who} · ${plan.style}</p>
          <h3>${plan.where} trip</h3>
          <p>4 nights · ${plan.loves.slice(0, 2).join(" + ")} · ${plan.vibe}</p>
        </div>
      </article>
      <p class="about" style="margin-top:16px">A day-wise plan with honest places — not a copy-paste circuit. You can swap any stop.</p>
    `;
  }
}

function renderNav() {
  $("#screenNav").innerHTML = SCREENS.map(
    ([id, label], i) => `<button data-go="${id}" class="${i === 0 ? "is-on" : ""}">${String(i + 1).padStart(2, "0")}  ${label}</button>`
  ).join("");
}

function renderChat() {
  $("#quickAsks").innerHTML = ["Hidden beaches", "Local food", "2-day itinerary"]
    .map((t) => `<button type="button">${t}</button>`)
    .join("");
  $("#chatLog").innerHTML = `
    <div class="bubble me">Best hidden beach near Palolem?</div>
    <div class="bubble bot">Rajbaug — locals go when Palolem fills up.<span class="meta-line">12 min drive · quiet at sunset</span></div>
  `;
}

document.addEventListener("click", (e) => {
  const goBtn = e.target.closest("[data-go]");
  if (goBtn) {
    const name = goBtn.dataset.go;
    if (name === "plan") planStep = 0;
    go(name);
  }
  const chip = e.target.closest("[data-cat]");
  if (chip) {
    cat = chip.dataset.cat;
    index = 0;
    renderChips();
    renderDeck();
  }
  const interest = e.target.closest(".interest");
  if (interest) {
    const n = interest.dataset.n;
    plan.loves = plan.loves.includes(n) ? plan.loves.filter((x) => x !== n) : [...plan.loves, n].slice(0, 5);
    renderPlan();
  }
  const choice = e.target.closest(".choice button");
  if (choice) {
    const group = choice.parentElement.id;
    if (group === "where") plan.where = choice.textContent;
    if (group === "who") plan.who = choice.textContent;
    if (group === "style") plan.style = choice.textContent;
    if (group === "vibe") plan.vibe = choice.textContent;
    renderPlan();
  }
  const pin = e.target.closest(".pin");
  if (pin) {
    $$(".pin").forEach((p) => p.classList.remove("is-on"));
    pin.classList.add("is-on");
    index = Number(pin.dataset.pin);
    renderMapSheet();
  }
  if (e.target.closest("#quickAsks button")) {
    const q = e.target.textContent;
    $("#chatLog").insertAdjacentHTML("beforeend", `<div class="bubble me">${q}</div><div class="bubble bot">Give me a neighbourhood and a mood — I’ll keep it local, not tourist-default.</div>`);
    $("#chatLog").scrollTop = 9999;
  }
});

$("#btnSkip").onclick = skipPlace;
$("#btnInfo").onclick = () => go("detail");
$("#btnSave").onclick = savePlace;
$("#planNext").onclick = () => {
  if (planStep < 3) {
    planStep += 1;
    renderPlan();
  } else go("itinerary");
};
$("#chatForm").onsubmit = (e) => {
  e.preventDefault();
  const v = $("#chatInput").value.trim();
  if (!v) return;
  $("#chatInput").value = "";
  $("#chatLog").insertAdjacentHTML(
    "beforeend",
    `<div class="bubble me">${v}</div><div class="bubble bot">Noted. If you’re near ${current().area.split(",")[0]}, start there — then wander without a checklist.</div>`
  );
  $("#chatLog").scrollTop = 9999;
};

renderNav();
renderChips();
renderDeck();
renderChat();
renderSaved();
