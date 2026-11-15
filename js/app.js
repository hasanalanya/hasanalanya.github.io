/* =====================================================================
   Page behaviour: scroll story ↔ globe, skill space, publications,
   experience, counters. Content comes from js/data.js.
   ===================================================================== */
import { createGlobe, PLACES } from "./globe3d.js";
import { createSkillSpace } from "./skills3d.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const HOVER = matchMedia("(hover: hover)").matches;
const ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

/* ---------- scroll story drives the globe ---------- */
function initStory() {
  let globe = null;
  try {
    globe = createGlobe({ view: $("#stageView"), canvas: $("#globe"), labels: $("#globeLabels"), hud: $("#hudCoords") });
  } catch (e) { document.body.classList.add("no-webgl"); }

  const rail = $$("#rail button");
  let current = null;
  function setStep(step) {
    if (step === current) return;
    current = step;
    $$(".chapter").forEach((c) => c.classList.toggle("is-active", +c.dataset.step === step));
    rail.forEach((b, i) => { b.classList.toggle("is-on", i === step + 1); b.classList.toggle("is-done", i < step + 1); });
    $("#stageView").classList.toggle("is-focus", step >= 0);
    if (globe) step < 0 ? globe.overview() : globe.focus(step);
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setStep(+en.target.dataset.step); });
  }, { rootMargin: "-49% 0px -49% 0px" });
  $$("[data-step]").forEach((el) => io.observe(el));
  setStep(-1);

  rail.forEach((b) => b.addEventListener("click", () => {
    const el = document.getElementById(b.dataset.go);
    const y = b.dataset.go === "top" ? 0 : el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2;
    scrollTo({ top: y, behavior: RM ? "auto" : "smooth" });
  }));
}

/* ---------- institutions marquee + fellowship card art ---------- */
function initDecor() {
  const inst = ["University of Birmingham", "Yale School of Medicine", "SciLifeLab", "Karolinska Institutet", "KTH Royal Institute of Technology", "Stockholm University", "Koç University", "Istanbul Bilgi University"];
  const row = inst.map((n) => `<span>${esc(n)}</span><i aria-hidden="true">✦</i>`).join("");
  $("#marquee").innerHTML = row + `<span aria-hidden="true" style="display:contents">${row}</span>`;

  // a small drug–gene network drawn on the fellowship card
  let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts = Array.from({ length: 26 }, () => ({ x: 150 + rnd() * 165, y: 8 + rnd() * 184, r: 1.4 + rnd() * 2.6 }));
  let svg = "";
  pts.forEach((a, i) => pts.slice(i + 1).forEach((b) => {
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < 52) svg += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" />`;
  }));
  pts.forEach((p, i) => (svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" class="${i % 6 === 0 ? "hot" : ""}" />`));
  $("#passNet").innerHTML = svg;
}

/* ---------- pointer tilt on cards ---------- */
function initTilt() {
  if (!HOVER || RM) return;
  $$(".tilt").forEach((el) => {
    const max = +el.dataset.tilt || 6;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--rx", `${((0.5 - y) * max).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * max).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      el.classList.add("is-tilting");
    });
    el.addEventListener("pointerleave", () => {
      el.style.removeProperty("--rx"); el.style.removeProperty("--ry"); el.classList.remove("is-tilting");
    });
  });
}

/* ---------- skill space ---------- */
const BLURB = {
  "Programming": "The languages behind every analysis and pipeline I build.",
  "Machine Learning": "Interpretable models: graph neural networks, causal ML and classical learners.",
  "Workflows & Infra": "Reproducible, containerised pipelines that run the same on a laptop or a cluster.",
  "Bulk RNA-seq": "From raw reads to differential expression and pathway enrichment.",
  "Single-cell": "Clustering, trajectories and regulatory networks at single-cell resolution.",
  "Genomics / WES": "Variant calling, annotation and relatedness checks on whole-exome data.",
  "Microarray & miRNA": "Expression arrays and small-RNA analysis, the data my bachelor's thesis was built on.",
  "Proteomics & Networks": "Protein-interaction networks and pathway databases for systems-level questions.",
  "Structural Biology": "Protein structure modelling and docking, from my protein-interaction research at Koç University.",
};
function initSkills() {
  const chips = $("#skillChips"), panel = $("#skillPanel"), total = SKILLS.reduce((n, g) => n + g.items.length, 0);
  let space = null, active = -1;

  chips.innerHTML = `<button class="schip is-on" data-g="-1" role="tab">All areas</button>` +
    SKILLS.map((g, i) => `<button class="schip" data-g="${i}" role="tab" style="--c:${g.color}"><i></i>${esc(g.group)}</button>`).join("");

  function render(g) {
    active = g;
    $$(".schip", chips).forEach((b) => b.classList.toggle("is-on", +b.dataset.g === g));
    if (g < 0) {
      const max = Math.max(...SKILLS.map((x) => x.items.length));
      panel.innerHTML = `<p class="panel__big"><b>${total}</b> tools<br /><b>${SKILLS.length}</b> areas</p>
        <p class="panel__p">Pick an area to see what's in it.</p>
        <ul class="bars">${SKILLS.map((x, i) => `<li><button data-g="${i}" style="--c:${x.color};--w:${(x.items.length / max) * 100}%"><span>${esc(x.group)}</span><em class="mono">${x.items.length}</em><i></i></button></li>`).join("")}</ul>`;
    } else {
      const x = SKILLS[g];
      panel.innerHTML = `<button class="panel__back mono" data-g="-1">← All areas</button>
        <p class="panel__name" style="--c:${x.color}"><i></i>${esc(x.group)}</p>
        <p class="panel__p">${esc(BLURB[x.group] || "")}</p>
        <ul class="tools">${x.items.map((t, k) => `<li style="--d:${k * 28}ms">${esc(t)}</li>`).join("")}</ul>`;
    }
  }
  const choose = (g) => { if (space) space.select(g < 0 ? active : g); else render(g === active ? -1 : g); };
  chips.addEventListener("click", (e) => { const b = e.target.closest("[data-g]"); if (b && +b.dataset.g !== active) choose(+b.dataset.g); });
  panel.addEventListener("click", (e) => { const b = e.target.closest("[data-g]"); if (b) choose(+b.dataset.g); });

  try {
    space = createSkillSpace({ wrap: $("#spaceView"), canvas: $("#space"), labels: $("#spaceLabels"), tip: $("#spaceTip"), groups: SKILLS, onSelect: render });
  } catch (e) { $("#spaceView").classList.add("is-off"); }
  render(-1);
}

/* ---------- publications ---------- */
function initPubs() {
  const me = (a) => esc(a).replace(/Alanya H/g, "<b>Alanya H</b>");
  $("#feats").innerHTML = PUBLICATIONS.filter((p) => p.featured).map((p) => {
    const first = /^Alanya H/.test(p.authors);
    return `<a class="feat tilt rv" data-tilt="7" href="${p.link}" target="_blank" rel="noopener">
      <span class="feat__glare" aria-hidden="true"></span>
      <p class="feat__top mono"><span class="${first ? "is-first" : ""}">${first ? "First author" : "Co-author"}</span><span>${p.year}</span></p>
      <p class="feat__journal">${esc(p.journal)}</p>
      <h3 class="feat__title">${esc(p.title)}</h3>
      <p class="feat__sum">${esc(p.summary)}</p>
      <span class="feat__go">Read the paper ${ARROW}</span></a>`;
  }).join("");

  const TYPES = [["journal", "Papers"], ["abstract", "Abstracts"], ["presentation", "Talks & posters"], ["preparation", "In preparation"]];
  const tabs = $("#pubTabs"), list = $("#pubList");
  tabs.innerHTML = TYPES.map(([k, label], i) => `<button class="tab${i ? "" : " is-on"}" role="tab" data-k="${k}">${label}<em class="mono">${PUBLICATIONS.filter((p) => p.type === k).length}</em></button>`).join("");
  function show(k) {
    $$(".tab", tabs).forEach((b) => b.classList.toggle("is-on", b.dataset.k === k));
    list.innerHTML = PUBLICATIONS.filter((p) => p.type === k).map((p, i) => {
      const first = p.authors && /^Alanya H/.test(p.authors), review = /under review/i.test(p.venue || "");
      const title = p.link ? `<a href="${p.link}" target="_blank" rel="noopener">${esc(p.title)} ${ARROW}</a>` : esc(p.title);
      const badges = [first && '<span class="badge badge--first">First author</span>', p.presenter && '<span class="badge">Presenter</span>', review && '<span class="badge">Under review</span>'].filter(Boolean).join("");
      return `<li class="pub" style="--d:${i * 40}ms"><span class="pub__yr mono">${p.year || "—"}</span>
        <div class="pub__main"><p class="pub__t">${title}</p>
        ${p.authors ? `<p class="pub__a">${me(p.authors)}</p>` : ""}${p.venue ? `<p class="pub__v">${esc(p.venue)}</p>` : `<p class="pub__v">Manuscript in preparation</p>`}</div>
        <div class="pub__b">${badges}</div></li>`;
    }).join("");
  }
  tabs.addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (b) show(b.dataset.k); });
  show("journal");
}

/* ---------- experience, education, extras ---------- */
function initXp() {
  $("#xpList").innerHTML = EXPERIENCE.map((x, i) => `<article class="job${i === 0 ? " is-open" : ""}${x.current ? " is-current" : ""}">
      <button class="job__head" aria-expanded="${i === 0}">
        <span class="job__dates mono">${esc(x.dates)}</span>
        <span class="job__what"><b>${esc(x.role)}</b><span>${esc(x.org)} · ${esc(x.place)}</span></span>
        <span class="job__chev" aria-hidden="true"></span>
      </button>
      <div class="job__body"><div>
        <p class="job__group">${esc(x.group)}</p>
        <ul class="job__pts">${x.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <p class="job__tags">${x.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</p>
      </div></div></article>`).join("");
  $("#xpList").addEventListener("click", (e) => {
    const h = e.target.closest(".job__head"); if (!h) return;
    const open = h.parentElement.classList.toggle("is-open"); h.setAttribute("aria-expanded", open);
  });

  $("#eduList").innerHTML = EDUCATION.map((e) => `<div class="deg rv"><p class="deg__top mono"><span>${esc(e.degree)}</span><span>${esc(e.years)}</span></p>
      <p class="deg__field">${esc(e.field)}</p><p class="deg__school">${esc(e.school)}</p><p class="deg__note">${esc(e.note)}</p></div>`).join("");
  $("#awardList").innerHTML = AWARDS.map((a) => `<li><span class="mono">${esc(a.year)}</span><div><b>${esc(a.title)}</b><em>${esc(a.org)}</em></div></li>`).join("");
  $("#trainList").innerHTML = TRAINING.map((a) => `<li><span class="mono">${esc(a.date)}</span><div><b>${esc(a.title)}</b><em>${esc(a.org)}</em></div></li>`).join("");
  $("#langList").innerHTML = LANGUAGES.map((l) => `<li><span>${esc(l.name)}</span><em class="mono">${esc(l.level)}</em><i style="--w:${l.pct}%"></i></li>`).join("");
}

/* ---------- counters, reveal, nav, progress ---------- */
function countUp(el) {
  const n = +el.dataset.n, s = el.dataset.s || "";
  if (RM) { el.textContent = n + s; return; }
  const t0 = performance.now();
  (function f(t) {
    const k = Math.min(1, (t - t0) / 1300);
    el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))) + s;
    if (k < 1) requestAnimationFrame(f);
  })(t0);
}
function initChrome() {
  $("#yr").textContent = new Date().getFullYear();
  const nav = $("#nav"), bar = $("#progress");
  const onScroll = () => {
    nav.classList.toggle("is-solid", scrollY > 30);
    bar.style.transform = `scaleX(${Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const links = new Map($$(".nav__links a[href^='#']").map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    links.forEach((a) => a.classList.remove("is-active"));
    links.get(en.target.id)?.classList.add("is-active");
  }), { rootMargin: "-50% 0px -49% 0px" });
  links.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    if (en.target.dataset.n) countUp(en.target);
    $$("[data-n]", en.target).forEach(countUp);
    io.unobserve(en.target);
  }), { rootMargin: "0px 0px -60px 0px" });
  $$(".rv").forEach((el) => io.observe(el));
}

function boot() {
  initDecor();
  initSkills();
  initPubs();
  initXp();
  initTilt();
  initChrome();
  initStory();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
