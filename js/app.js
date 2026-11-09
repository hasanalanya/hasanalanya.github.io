/* =====================================================================
   Homepage · scroll story drives the globe, selected work, counters
   ===================================================================== */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- scroll story drives the globe ---------- */
function initStory() {
  const globe = createGlobe($("#globe"), $("#hudCoords"));
  const label = $("#hudChapter");
  let current = null;

  function setStep(step) {
    if (step === current) return;
    current = step;
    $$(".chapter").forEach((c) => c.classList.toggle("is-active", +c.dataset.step === step));
    if (step < 0) { globe.overview(); label.textContent = "Overview · 4 countries"; }
    else { const p = PLACES[step]; globe.focus(step); label.textContent = `${String(step + 1).padStart(2, "0")} / 04 · ${p.city}, ${p.country}`; }
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setStep(+en.target.dataset.step); });
  }, { rootMargin: "-48% 0px -48% 0px" });
  $$("[data-step]").forEach((el) => io.observe(el));
  setStep(-1);
}

/* ---------- selected work + full list ---------- */
function initWork() {
  const ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  $("#works").innerHTML = PUBLICATIONS.filter((p) => p.featured).map((p) => {
    const first = /^Alanya H/.test(p.authors);
    return `<a class="work rv" href="${p.link}" target="_blank" rel="noopener">
      <div class="work__venue"><em>${esc(p.journal)}</em><span class="work__year">${p.year}</span></div>
      <div><h3 class="work__title">${esc(p.title)}</h3><p class="work__sum">${esc(p.summary)}</p></div>
      <span class="work__role${first ? " is-first" : ""}">${first ? "First author" : "Co-author"}</span>
      <span class="work__go">${ARROW}</span></a>`;
  }).join("");

}

/* ---------- counters, reveal, nav ---------- */
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
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-solid", scrollY > 30);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const links = new Map($$(".nav__links a").map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    links.forEach((a) => a.classList.remove("is-active"));
    links.get(en.target.id)?.classList.add("is-active");
  }), { rootMargin: "-50% 0px -49% 0px" });
  ["journey", "capabilities", "work", "approach"].forEach((id) => spy.observe(document.getElementById(id)));

  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    if (en.target.querySelector) $$("[data-n]", en.target).forEach(countUp);
    if (en.target.dataset && en.target.dataset.n) countUp(en.target);
    io.unobserve(en.target);
  }), { rootMargin: "0px 0px -60px 0px" });
  $$(".rv").forEach((el) => io.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  initWork();
  initChrome();
  initStory();
});
