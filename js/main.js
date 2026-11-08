/* =====================================================================
   Page behaviour: renders content from data.js and wires up interaction
   ===================================================================== */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ICONS = {
  hourglass: '<path d="M6 2h12M6 22h12M7 2c0 5 10 6 10 10S7 17 7 22M17 2c0 5-10 6-10 10s10 5 10 10"/>',
  brain: '<path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 1 5 3 3 0 0 0 4 3 2 2 0 0 0 3-1V5a2 2 0 0 0-3-2zM15 3a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-1 5 3 3 0 0 1-4 3 2 2 0 0 1-3-1"/>',
  network: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><circle cx="12" cy="13" r="1.8"/><path d="M12 7.5v3.7M10.6 14.2l-3.7 2.4M13.4 14.2l3.7 2.4M7.4 18h9.2"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
};
const ARROW = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M7 17 17 7M9 7h8v8"/></svg>';

/* ---------- small helpers ---------- */
function spotlight(el) {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", e.clientX - r.left + "px");
    el.style.setProperty("--my", e.clientY - r.top + "px");
  });
}

/* ---------- hero ---------- */
function initHero() {
  $("#tagline").textContent = SITE.tagline;
  $("#highlights").innerHTML = HIGHLIGHTS.map(
    (h) => `<div class="hl"><dt class="mono">${esc(h.label)}</dt><dd>${esc(h.text)}</dd></div>`
  ).join("");
  const el = $("#typed");
  if (REDUCED_MOTION) { el.textContent = SITE.roles[0]; return; }
  let r = 0, i = 0, deleting = false;
  (function step() {
    const word = SITE.roles[r];
    i += deleting ? -1 : 1;
    el.textContent = word.slice(0, i);
    let delay = deleting ? 35 : 70;
    if (!deleting && i === word.length) { deleting = true; delay = 1800; }
    else if (deleting && i === 0) { deleting = false; r = (r + 1) % SITE.roles.length; delay = 300; }
    setTimeout(step, delay);
  })();
}

/* ---------- about ---------- */
function renderAbout() {
  $("#stats").innerHTML = STATS.map(
    (s) => `<div class="stat"><div class="stat__value" data-count="${s.value}" data-suffix="${s.suffix}">0${s.suffix}</div><div class="stat__label">${esc(s.label)}</div></div>`
  ).join("");

  $("#interests").innerHTML = INTERESTS.map(
    (it, i) => `<article class="card reveal" style="transition-delay:${i * 80}ms">
      <div class="card__icon"><svg viewBox="0 0 24 24">${ICONS[it.icon]}</svg></div>
      <h4>${esc(it.title)}</h4><p>${esc(it.text)}</p></article>`
  ).join("");

  $("#journey").innerHTML = JOURNEY.map(
    (j, i) => `<div class="stop${i === JOURNEY.length - 1 ? " is-current" : ""}">
      <div class="stop__dot">${String(i + 1).padStart(2, "0")}</div>
      <div class="stop__city">${esc(j.city)}</div>
      <div class="stop__years">${esc(j.country)} · ${esc(j.years)}</div>
      <div class="stop__what">${esc(j.what)}</div></div>`
  ).join("");
}

function countUp(el) {
  const target = +el.dataset.count, suffix = el.dataset.suffix || "";
  if (REDUCED_MOTION) { el.textContent = target + suffix; return; }
  const t0 = performance.now(), dur = 1400;
  (function f(t) {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}

/* ---------- experience ---------- */
function renderExperience() {
  const tl = $("#timeline");
  tl.innerHTML = EXPERIENCE.map(
    (j, i) => `<div class="job reveal${j.current ? " is-current" : ""}${i === 0 ? " is-open" : ""}">
      <button class="job__btn" aria-expanded="${i === 0}" aria-controls="job-${i}">
        <span class="job__org">${esc(j.org)}</span>
        <span class="job__meta">
          ${j.current ? '<span class="badge-now">NOW</span>' : ""}
          <span class="job__dates">${esc(j.dates)}</span>
          <svg class="job__chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
        </span>
        <span class="job__role">${esc(j.role)} · ${esc(j.place)}</span>
      </button>
      <div class="job__panel" id="job-${i}"><div><div class="job__content">
        ${j.group ? `<p class="job__group">${esc(j.group)}</p>` : ""}
        <ul>${j.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <div class="job__foot">
          ${(j.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}
          ${j.link ? `<a class="link-arrow" href="${j.link}" target="_blank" rel="noopener">${esc(j.linkLabel || "Lab website")} ${ARROW}</a>` : ""}
        </div>
      </div></div></div>
    </div>`
  ).join("");

  tl.addEventListener("click", (e) => {
    const btn = e.target.closest(".job__btn");
    if (!btn) return;
    const job = btn.parentElement;
    const open = job.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open);
  });
}

/* ---------- skills ---------- */
function initSkills() {
  const filters = $("#skillFilters");
  const list = $("#skillList");
  let current = null;
  const graph = initSkillsGraph((group) => setGroup(group));

  filters.innerHTML =
    `<button class="chip is-active" data-group="">All domains</button>` +
    SKILLS.map(
      (s) => `<button class="chip" data-group="${esc(s.group)}" style="--chip:${s.color}">
        <span class="chip__dot"></span>${esc(s.group)} <span class="chip__count">${s.items.length}</span></button>`
    ).join("");

  function setGroup(group) {
    current = group || null;
    $$(".chip", filters).forEach((c) => c.classList.toggle("is-active", (c.dataset.group || null) === current));
    graph.select(current);
    const groups = current ? SKILLS.filter((s) => s.group === current) : SKILLS;
    list.innerHTML = groups
      .flatMap((g) => g.items.map((it) => ({ it, color: g.color })))
      .map((o, i) => `<span class="tag" style="animation-delay:${Math.min(i * 12, 500)}ms;border-color:${o.color}55">${esc(o.it)}</span>`)
      .join("");
  }

  filters.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const g = chip.dataset.group || null;
    setGroup(g === current ? null : g);
  });
  setGroup(null);
}

/* ---------- publications ---------- */
const PUB_TYPES = [
  { key: "all", label: "All" },
  { key: "journal", label: "Journal articles" },
  { key: "abstract", label: "Abstracts" },
  { key: "presentation", label: "Presentations" },
  { key: "preparation", label: "In preparation" },
];
const TYPE_LABEL = { journal: "Journal article", abstract: "Conference abstract", presentation: "Presentation", preparation: "In preparation" };

function initPublications() {
  const state = { type: "all", q: "", first: false, year: null };
  const listEl = $("#pubList"), emptyEl = $("#pubEmpty"), chartEl = $("#pubChart");

  // selected papers as highlight cards
  $("#featured").innerHTML = PUBLICATIONS.filter((p) => p.featured).map((p, i) => {
    const first = /^Alanya H/.test(p.authors || "");
    return `<a class="feat reveal" href="${p.link}" target="_blank" rel="noopener" style="transition-delay:${i * 90}ms">
      <div class="feat__top">
        <span class="feat__journal">${esc(p.journal || p.venue)}</span>
        <span class="feat__year mono">${p.year}</span>
      </div>
      <h3 class="feat__title">${esc(p.title)}</h3>
      <p class="feat__summary">${esc(p.summary || "")}</p>
      <div class="feat__foot">
        <span class="feat__role${first ? " is-first" : ""}">${first ? "First author" : "Co-author"}</span>
        <span class="feat__read">Read paper ${ARROW}</span>
      </div>
    </a>`;
  }).join("");

  $("#pubFilters").innerHTML = PUB_TYPES.map((t) => {
    const n = t.key === "all" ? PUBLICATIONS.length : PUBLICATIONS.filter((p) => p.type === t.key).length;
    return `<button class="chip${t.key === "all" ? " is-active" : ""}" data-type="${t.key}" role="tab">${t.label} <span class="chip__count">${n}</span></button>`;
  }).join("");

  const mark = (text, q) => {
    const safe = esc(text);
    if (!q) return safe;
    const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    return safe.replace(re, "<mark>$1</mark>");
  };

  function authorsHTML(p, q, idx) {
    if (!p.authors) return "";
    const list = p.authors.split(/,\s*/);
    const me = list.findIndex((a) => /^Alanya H/.test(a));
    const cut = Math.max(8, me + 2);
    const fmt = (a) => (/^Alanya H/.test(a) ? `<b>${mark(a, q)}</b>` : mark(a, q));
    if (list.length <= cut + 1 || p._expanded) return list.map(fmt).join(", ");
    return list.slice(0, cut).map(fmt).join(", ") + `, … <button class="more" data-expand="${idx}">+${list.length - cut} more</button>`;
  }

  function matches(p) {
    if (state.type !== "all" && p.type !== state.type) return false;
    if (state.first && !(p.authors && /^Alanya H/.test(p.authors))) return false;
    if (state.q) {
      const hay = [p.title, p.authors, p.venue, (p.tags || []).join(" ")].join(" ").toLowerCase();
      if (!hay.includes(state.q.toLowerCase())) return false;
    }
    return true;
  }

  function renderChart(items) {
    const years = {};
    PUBLICATIONS.forEach((p) => { if (p.year) years[p.year] = 0; });
    items.forEach((p) => { if (p.year) years[p.year]++; });
    const keys = Object.keys(years).sort();
    const max = Math.max(1, ...Object.values(years));
    chartEl.innerHTML = keys.map(
      (y) => `<div class="bar${state.year == y ? " is-active" : ""}${state.year && state.year != y ? " is-dim" : ""}" data-year="${y}" title="${years[y]} in ${y}">
        <span class="bar__n">${years[y] || ""}</span>
        <span class="bar__fill" data-h="${(years[y] / max) * 70}"></span>
        <span class="bar__year">${y}</span></div>`
    ).join("");
    requestAnimationFrame(() => $$(".bar__fill", chartEl).forEach((b) => (b.style.height = b.dataset.h + "%")));
  }

  function render() {
    const base = PUBLICATIONS.filter(matches);
    const items = state.year ? base.filter((p) => p.year == state.year) : base;
    renderChart(base);
    listEl.innerHTML = items.map((p) => {
      const idx = PUBLICATIONS.indexOf(p);
      return `<li class="pub" style="animation-delay:${Math.min(items.indexOf(p) * 40, 400)}ms">
        <div class="pub__year">${p.year || "TBA"}</div>
        <div>
          <span class="pub__type t-${p.type}">${TYPE_LABEL[p.type]}${p.presenter ? " · presenter" : ""}</span>
          <h3 class="pub__title">${mark(p.title, state.q)}</h3>
          ${p.authors ? `<p class="pub__authors">${authorsHTML(p, state.q, idx)}</p>` : ""}
          ${p.venue ? `<p class="pub__venue">${mark(p.venue, state.q)}</p>` : ""}
          ${(p.tags || p.link) ? `<div class="pub__foot">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}
            ${p.link ? `<a class="link-arrow" href="${p.link}" target="_blank" rel="noopener">Read ${ARROW}</a>` : ""}</div>` : ""}
        </div></li>`;
    }).join("");
    emptyEl.hidden = items.length > 0;
  }

  $("#pubFilters").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.type = chip.dataset.type;
    state.year = null;
    $$("#pubFilters .chip").forEach((c) => c.classList.toggle("is-active", c === chip));
    render();
  });
  $("#pubSearch").addEventListener("input", (e) => { state.q = e.target.value.trim(); render(); });
  $("#firstAuthor").addEventListener("change", (e) => { state.first = e.target.checked; render(); });
  chartEl.addEventListener("click", (e) => {
    const bar = e.target.closest(".bar");
    if (!bar) return;
    state.year = state.year === bar.dataset.year ? null : bar.dataset.year;
    render();
  });
  listEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-expand]");
    if (!b) return;
    PUBLICATIONS[+b.dataset.expand]._expanded = true;
    render();
  });

  // draw bars only once the section scrolls into view
  let shown = false;
  new IntersectionObserver(([en], o) => {
    if (en.isIntersecting && !shown) { shown = true; render(); o.disconnect(); }
  }).observe(chartEl);
  render();
}

/* ---------- education + extras ---------- */
function renderEducation() {
  $("#eduList").innerHTML = EDUCATION.map(
    (e, i) => `<article class="card edu__card reveal" style="transition-delay:${i * 90}ms">
      <div class="edu__degree grad">${esc(e.degree)}</div>
      <div class="edu__field">${esc(e.field)}</div>
      <div class="edu__school">${esc(e.school)} · ${esc(e.place)}</div>
      <div class="edu__years">${esc(e.years)}</div>
      <p class="edu__note">${esc(e.note)}</p>
      ${e.link ? `<a class="link-arrow" href="${e.link}" target="_blank" rel="noopener">Programme ${ARROW}</a>` : ""}
    </article>`
  ).join("");

  const mini = (when, what, where) =>
    `<li><span class="when">${esc(when)}</span><span class="what">${esc(what)}<span class="where">${esc(where)}</span></span></li>`;
  $("#awards").innerHTML = AWARDS.map((a) => mini(a.year, a.title, a.org)).join("");
  $("#mentoring").innerHTML = MENTORING.map((m) => mini(m.year, m.name, m.detail)).join("");
  $("#training").innerHTML = TRAINING.map((t) => mini(t.date, t.title, t.org)).join("");
  $("#languages").innerHTML = LANGUAGES.map(
    (l) => `<div class="lang"><div class="lang__row"><span>${esc(l.name)}</span><span>${esc(l.level)}</span></div>
      <div class="lang__bar"><i data-w="${l.pct}"></i></div></div>`
  ).join("");
}

/* ---------- terminal ---------- */
function initTerminal() {
  const out = $("#termOut"), input = $("#termInput"), body = $("#termBody");
  const history = [];
  let hIdx = 0;

  const print = (html, cls = "out") => {
    const d = document.createElement("div");
    d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
    body.scrollTop = body.scrollHeight;
  };

  const goto = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };

  const COMMANDS = {
    help: () =>
      [
        "Available commands:",
        "  <span class='acc'>about</span>        who I am",
        "  <span class='acc'>research</span>     current research interests",
        "  <span class='acc'>experience</span>   positions, newest first",
        "  <span class='acc'>education</span>    degrees",
        "  <span class='acc'>skills</span> [x]   toolkit, or one domain (e.g. skills single)",
        "  <span class='acc'>pubs</span>         journal publications",
        "  <span class='acc'>contact</span>      how to reach me",
        "  <span class='acc'>goto</span> &lt;s&gt;     scroll to a section (about, skills, …)",
        "  <span class='acc'>clear</span>        clear the screen",
      ].join("\n"),
    about: () => `<span class='acc'>${SITE.name}</span>\n${esc(SITE.tagline)}\nBased in ${SITE.location}.`,
    whoami: () => COMMANDS.about(),
    research: () => INTERESTS.map((i) => `<span class='acc'>▸ ${esc(i.title)}</span>\n  ${esc(i.text)}`).join("\n"),
    experience: () => EXPERIENCE.map((j) => `<span class='acc'>${esc(j.dates.padEnd(20))}</span>${esc(j.org)}, ${esc(j.role)}`).join("\n"),
    education: () => EDUCATION.map((e) => `<span class='acc'>${esc(e.degree.padEnd(5))}</span>${esc(e.field)}, ${esc(e.school)} (${esc(e.years)})`).join("\n"),
    skills: (arg) => {
      const groups = arg ? SKILLS.filter((s) => s.group.toLowerCase().includes(arg.toLowerCase())) : SKILLS;
      if (!groups.length) return `No domain matches "${esc(arg)}". Try: ${SKILLS.map((s) => s.group.split(" ")[0].toLowerCase()).join(", ")}`;
      return groups.map((g) => `<span class='acc'>${esc(g.group)}</span>\n  ${esc(g.items.join(", "))}`).join("\n");
    },
    pubs: () =>
      PUBLICATIONS.filter((p) => p.type === "journal")
        .map((p) => `<span class='acc'>[${p.year}]</span> ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title)}\n       <span class='acc2'>${esc(p.venue)}</span>`)
        .join("\n"),
    publications: () => COMMANDS.pubs(),
    contact: () =>
      `linkedin  <a href="${SITE.linkedin}" target="_blank" rel="noopener">${SITE.linkedin}</a>  (best way to reach me)\ngithub    <a href="${SITE.github}" target="_blank" rel="noopener">${SITE.github}</a>`,
    ls: () => "about/  research/  experience/  education/  skills/  publications/  contact/",
    goto: (arg) => {
      const map = { about: "about", experience: "experience", skills: "skills", pubs: "publications", publications: "publications", education: "education", contact: "contact", home: "home" };
      if (!map[arg]) return "usage: goto about | experience | skills | pubs | education | contact";
      goto(map[arg]);
      return `→ ${arg}`;
    },
    date: () => new Date().toString(),
    echo: (arg) => esc(arg || ""),
    sudo: (arg) => (/hire/.test(arg || "") ? "<span class='acc2'>Permission granted.</span> Run <span class='acc'>contact</span> to proceed. 🧬" : "nice try."),
    clear: () => { out.innerHTML = ""; return null; },
  };

  function run(line) {
    print(esc(line), "cmd");
    const [cmd, ...rest] = line.trim().split(/\s+/);
    if (!cmd) return;
    const fn = COMMANDS[cmd.toLowerCase()];
    const res = fn ? fn(rest.join(" ")) : `command not found: ${esc(cmd)}. Type <span class='acc'>help</span>.`;
    if (res) print(res);
  }

  print("Welcome! This shell is a tiny guide to my work.\nType <span class='acc'>help</span> to see the commands, or try <span class='acc'>skills single</span>.");

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = input.value;
      if (v.trim()) history.push(v);
      hIdx = history.length;
      input.value = "";
      run(v);
    } else if (e.key === "ArrowUp") {
      if (hIdx > 0) input.value = history[--hIdx];
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      hIdx = Math.min(history.length, hIdx + 1);
      input.value = history[hIdx] || "";
      e.preventDefault();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const m = Object.keys(COMMANDS).filter((c) => c.startsWith(input.value));
      if (m.length === 1) input.value = m[0] + " ";
      else if (m.length > 1) print(m.join("  "));
    }
  });
  body.addEventListener("click", () => { if (!window.getSelection().toString()) input.focus({ preventScroll: true }); });
}

/* ---------- chrome: nav, theme, reveal, progress ---------- */
function initChrome() {
  const nav = $("#nav"), links = $("#navLinks"), burger = $("#burger");
  const progress = $("#progress"), glow = $("#cursorGlow");

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 20);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  burger.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
  });
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") { links.classList.remove("is-open"); burger.setAttribute("aria-expanded", false); }
  });

  // highlight the nav link of the section in view
  const navMap = new Map($$("a", links).map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) {
        navMap.forEach((a) => a.classList.remove("is-active"));
        navMap.get(en.target.id)?.classList.add("is-active");
      }
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("main section[id]").forEach((s) => spy.observe(s));

  // theme
  $("#themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    $('meta[name="theme-color"]').setAttribute("content", next === "dark" ? "#0c0807" : "#fbf7f4");
    try { localStorage.setItem("theme", next); } catch (e) {}
    document.dispatchEvent(new Event("themechange"));
  });

  // cursor glow
  if (matchMedia("(hover: hover)").matches && !REDUCED_MOTION) {
    window.addEventListener("pointermove", (e) => {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }, { passive: true });
  }

  // reveal + one-off animations when things scroll into view
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add("is-in");
      $$("[data-count]", el).forEach(countUp);
      $$(".lang__bar i", el).forEach((b) => (b.style.width = b.dataset.w + "%"));
      io.unobserve(el);
    }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  $$(".card, .feat").forEach(spotlight);

  $("#year").textContent = new Date().getFullYear();
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initHero();
  renderAbout();
  renderExperience();
  renderEducation();
  initPublications();
  initSkills();
  initTerminal();
  initChrome();
  initNetwork();
  initHelix();
});
