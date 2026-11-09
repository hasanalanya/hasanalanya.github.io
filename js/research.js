/* =====================================================================
   Research page · live figures, publications, toolkit
   Content comes from js/data.js.
   Figures are hand-built: canvas (Fig 1) and SVG (Fig 2, Fig 3).
   ===================================================================== */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const NS = "http://www.w3.org/2000/svg";
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const isNight = () => document.documentElement.dataset.theme === "night";
const NOW = (() => { const d = new Date(); return d.getFullYear() + d.getMonth() / 12; })();

function svgEl(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function hex(h) { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
}
function rng(seed) { // mulberry32
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function placeTip(tip, wrap, x, y) {
  const w = wrap.clientWidth;
  tip.style.left = Math.max(6, Math.min(x + 14, w - tip.offsetWidth - 6)) + "px";
  tip.style.top = Math.max(6, y - tip.offsetHeight - 12) + "px";
}

/* ---------------------------------------------------------------------
   Research areas (Nature Publishing Group palette)
   --------------------------------------------------------------------- */
const AREAS = {
  ageing: { name: "Ageing & drug repurposing", c: "#E64B35", cn: "#ff6a52", at: [0.12, 0.08] },
  cancer: { name: "Cancer genomics", c: "#3C5488", cn: "#7b93d6", at: [-0.62, -0.08] },
  ml: { name: "Machine learning", c: "#00A087", cn: "#2fc4a8", at: [0.58, 0.46] },
  tx: { name: "Transcriptomics & single-cell", c: "#4DBBD5", cn: "#5fcbe3", at: [-0.34, 0.5] },
  sys: { name: "Systems & network biology", c: "#F39B7F", cn: "#f5a78e", at: [-0.24, -0.56] },
  struct: { name: "Structural bioinformatics", c: "#7E6148", cn: "#b8916f", at: [0.5, -0.66] },
  eng: { name: "Engineering & pipelines", c: "#8491B4", cn: "#a0acd0", at: [0.8, -0.12] },
};
const areaColor = (k) => (isNight() ? AREAS[k].cn : AREAS[k].c);

/* ---------------------------------------------------------------------
   FIGURE 1 · embedding of a career
   --------------------------------------------------------------------- */
function buildPoints() {
  const groupArea = {
    "Programming": "eng", "Machine Learning": "ml", "Workflows & Infra": "eng", "Bulk RNA-seq": "tx",
    "Single-cell": "tx", "Genomics / WES": "cancer", "Microarray & miRNA": "tx",
    "Proteomics & Networks": "sys", "Structural Biology": "struct",
  };
  // tools that sit between two areas
  const pulls = {
    Python: "ml", R: "tx", GNNs: "ageing", "Causal ML": "ageing", STRING: "ageing", Reactome: "ageing",
    Nextflow: "cancer", limma: "ml", "scikit-learn": "tx", GSEA: "ageing", Cytoscape: "ageing", PRISM: "sys", UMAP: "ml",
  };
  const pts = [];
  SKILLS.forEach((g) => g.items.forEach((it) => pts.push({ label: it, kind: "tool", area: groupArea[g.group], pull: pulls[it], sub: g.group })));

  const topics = {
    ageing: ["Senescence", "Frailty", "Drug–gene–pathway maps", "Ageing signatures", "Candidate geroprotectors", "Sarcopenia"],
    cancer: ["Meningioma", "Pituitary adenoma", "Tumour heterogeneity", "Tumour evolution", "Tumour–immune interactions", "Rare tumour subtypes"],
    sys: ["Co-expression networks", "Metabolomics", "Metagenomics", "Multi-omics statistics"],
    ml: ["Interpretable ML", "Gastric cancer subtyping"],
    struct: ["Protein interfaces", "Docking (CAPRI)"],
    tx: ["Single-cell-informed bulk"],
  };
  for (const a in topics) topics[a].forEach((t) => pts.push({ label: t, kind: "topic", area: a, sub: "research topic" }));

  const paperArea = (p) => (/Sarcopenia/.test(p.title) ? "ageing" : /Dickkopf/.test(p.title) ? "tx" : "cancer");
  PUBLICATIONS.filter((p) => p.type === "journal").forEach((p) =>
    pts.push({ label: p.title, kind: "paper", area: paperArea(p), sub: `${p.venue.split(",")[0]} · ${p.year}`, link: p.link, tight: true }));

  [
    ["University of Birmingham", "ageing", "PhD · MSCA Fellow · 2025–"],
    ["Yale School of Medicine", "cancer", "Research Associate → Affiliate · 2022–"],
    ["SciLifeLab · KTH", "sys", "Research & thesis · 2020–21"],
    ["Istanbul Bilgi University", "ml", "Bachelor's thesis · 2017–19"],
    ["Koç University", "struct", "Research student · 2016–18"],
  ].forEach(([label, area, sub]) => pts.push({ label, kind: "role", area, sub, tight: true }));
  return pts;
}

function initUmap() {
  const canvas = $("#umap"), wrap = $("#umapWrap"), tip = $("#umapTip"), epochEl = $("#epoch"), legend = $("#umapLegend");
  const ctx = canvas.getContext("2d");
  const pts = buildPoints();
  let W, H, dpr, t = 1, raf, sel = null, hover = null, seed = 7;

  legend.innerHTML = Object.entries(AREAS).map(([k, a]) => `<button data-a="${k}" style="--c:${a.c}"><i></i>${a.name}</button>`).join("");
  const paintLegend = () => $$("button", legend).forEach((b) => b.style.setProperty("--c", areaColor(b.dataset.a)));

  function targets() {
    const r = rng(seed);
    pts.forEach((p) => {
      const A = AREAS[p.area].at, P = p.pull ? AREAS[p.pull].at : null;
      const cx = P ? A[0] + (P[0] - A[0]) * 0.38 : A[0], cy = P ? A[1] + (P[1] - A[1]) * 0.38 : A[1];
      const s = p.tight ? 0.06 : 0.11;
      p.tx = cx + gauss(r) * s * 1.15; p.ty = cy + gauss(r) * s;
      p.sx = (r() * 2 - 1) * 1.05; p.sy = (r() * 2 - 1) * 1.05;
      p.jx = gauss(r); p.jy = gauss(r);
    });
  }
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  function pos(p) {
    const e = ease(t), wob = Math.pow(1 - t, 2) * 0.08;
    const x = p.sx + (p.tx - p.sx) * e + p.jx * wob, y = p.sy + (p.ty - p.sy) * e + p.jy * wob;
    // UMAP axes are arbitrary, so fill the frame in both directions
    const padX = W < 640 ? 26 : 46, padY = 34;
    const scx = (W - padX * 2) / 2.1, scy = Math.min((H - padY * 2) / 1.75, scx * 1.6);
    return [W / 2 + x * scx, H / 2 - y * scy + 6];
  }

  function draw() {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    const ink = css("--ink"), ink3 = css("--ink-3"), fig = css("--fig");
    // scanpy-style axis arrows
    ctx.strokeStyle = ink3; ctx.fillStyle = ink3; ctx.lineWidth = 1.2;
    const ox = 18, oy = H - 18;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 42, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - 42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + 46, oy); ctx.lineTo(ox + 40, oy - 3); ctx.lineTo(ox + 40, oy + 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ox, oy - 46); ctx.lineTo(ox - 3, oy - 40); ctx.lineTo(ox + 3, oy - 40); ctx.fill();
    ctx.font = "10.5px 'Geist Mono', monospace";
    ctx.fillText("UMAP1", ox + 52, oy + 4);
    ctx.save(); ctx.translate(ox - 5, oy - 52); ctx.rotate(-Math.PI / 2); ctx.fillText("UMAP2", 0, 0); ctx.restore();

    const order = [...pts].sort((a, b) => ({ tool: 0, topic: 1, paper: 2, role: 3 }[a.kind] - { tool: 0, topic: 1, paper: 2, role: 3 }[b.kind]));
    for (const p of order) {
      const [x, y] = pos(p); p.x = x; p.y = y;
      const dim = sel && p.area !== sel;
      ctx.globalAlpha = dim ? 0.12 : 1;
      const c = areaColor(p.area);
      if (p.kind === "role") {
        ctx.strokeStyle = c; ctx.lineWidth = 2.4; ctx.fillStyle = fig;
        ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
      } else if (p.kind === "paper") {
        ctx.fillStyle = c; ctx.strokeStyle = fig; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.rect(x - 5.5, y - 5.5, 11, 11); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = p.kind === "topic" ? fig : c; ctx.strokeStyle = c; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(x, y, p.kind === "topic" ? 4.6 : 4.4, 0, 7); ctx.fill();
        if (p.kind === "topic") ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    // labels: roles always (once settled), plus everything in a selected area, plus hover
    if (t > 0.9) {
      ctx.font = "500 12px Geist, Inter, sans-serif";
      for (const p of pts) {
        const show = (p.kind === "role" && (!sel || p.area === sel)) || (sel && p.area === sel && p.kind !== "paper");
        if (!show) continue;
        const text = p.kind === "role" && W < 640 ? TINY(p.label) : p.label;
        label(text, p.x + (p.kind === "role" ? 13 : 8), p.y + 4, p.kind === "role" ? ink : css("--ink-2"));
      }
    }
    if (hover) {
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(hover.x, hover.y, hover.kind === "role" ? 13 : 9, 0, 7); ctx.stroke();
    }
    function label(text, x, y, color) {
      ctx.lineWidth = 4; ctx.strokeStyle = fig; ctx.lineJoin = "round";
      const tx = x + ctx.measureText(text).width > W - 6 ? x - ctx.measureText(text).width - 26 : x;
      ctx.strokeText(text, tx, y); ctx.fillStyle = color; ctx.fillText(text, tx, y);
    }
  }

  function run() {
    cancelAnimationFrame(raf);
    targets();
    if (RM) { t = 1; epochEl.textContent = "epoch 200/200"; draw(); return; }
    t = 0;
    const t0 = performance.now(), dur = 2600;
    (function step(now) {
      t = Math.min(1, (now - t0) / dur);
      epochEl.textContent = `epoch ${String(Math.round(t * 200)).padStart(3, " ")}/200`;
      draw();
      if (t < 1) raf = requestAnimationFrame(step);
    })(t0);
  }

  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    let best = null, bd = 14 * 14;
    for (const p of pts) {
      if (sel && p.area !== sel) continue;
      const d = (p.x - mx) ** 2 + (p.y - my) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    if (best !== hover) { hover = best; draw(); }
    canvas.style.cursor = best && best.link ? "pointer" : "crosshair";
    if (best) {
      const kind = { tool: "Tool", topic: "Research topic", paper: "Paper", role: "Position" }[best.kind];
      tip.innerHTML = `<b>${esc(best.label)}</b><br>${kind} · ${esc(best.kind === "tool" ? best.sub : best.sub)}<br><span style="opacity:.7">${esc(AREAS[best.area].name)}${best.link ? " · click to open" : ""}</span>`;
      tip.style.opacity = 1;
      placeTip(tip, wrap, mx, my);
    } else tip.style.opacity = 0;
  });
  canvas.addEventListener("pointerleave", () => { hover = null; tip.style.opacity = 0; draw(); });
  canvas.addEventListener("click", () => { if (hover && hover.link) window.open(hover.link, "_blank", "noopener"); });
  legend.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    sel = sel === b.dataset.a ? null : b.dataset.a;
    $$("button", legend).forEach((x) => x.classList.toggle("is-on", x.dataset.a === sel));
    legend.classList.toggle("has-on", !!sel);
    draw();
  });
  $("#rerun").addEventListener("click", () => { seed = (Math.random() * 1e9) | 0; run(); });
  addEventListener("resize", resize);
  document.addEventListener("themechange", () => { paintLegend(); draw(); });

  paintLegend();
  resize();
  t = 0; draw();
  // start the "optimisation" when the figure scrolls into view
  new IntersectionObserver(([en], o) => { if (en.isIntersecting) { run(); o.disconnect(); } }, { threshold: 0.35 }).observe(wrap);
}

/* ---------------------------------------------------------------------
   FIGURE 2 · genome-browser view of the career
   --------------------------------------------------------------------- */
const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
function parseRange(s) {
  const [a, b] = s.split(/\s*–\s*/);
  const one = (x) => { if (/Present/i.test(x)) return NOW; const [m, y] = x.trim().split(/\s+/); return +y + (MON[m.slice(0, 3)] || 0) / 12; };
  return [one(a), one(b)];
}
const SHORT = (org) => org.replace("Yale School of Medicine", "Yale").replace("Istanbul Bilgi University", "Bilgi University").replace("University of Birmingham", "U. Birmingham");
const TINY = (org) => ({ "University of Birmingham": "UoB", "Yale School of Medicine": "Yale", "SciLifeLab · KTH": "SciLifeLab", "Istanbul Bilgi University": "Bilgi", "Koç University": "Koç" }[org] || org);

function initBrowser() {
  const svg = $("#browser"), wrap = $("#browserWrap"), tip = $("#browserTip"), detail = $("#detail"), locusEl = $("#locus");
  const FULL = [2014, 2027.2];
  let dom = FULL.slice(), selected = null, anim;

  const positions = EXPERIENCE.map((j, i) => { const [s, e] = parseRange(j.dates); return { kind: "job", i, s, e, org: j.org, role: j.role, dates: j.dates, current: j.current }; });
  const edu = EDUCATION.map((e, i) => { const [a, b] = e.years.split(/\s*–\s*/).map(Number); return { kind: "edu", i, s: a + 0.7, e: b + (b > NOW ? 0.7 : 0.45), org: e.degree, role: e.school, dates: e.years }; });
  // stack overlapping genes into rows (leave room for labels)
  function stack(list) {
    const rows = [];
    list.sort((a, b) => a.s - b.s).forEach((g) => {
      let r = rows.findIndex((end) => g.s > end + 1.1);
      if (r < 0) { r = rows.length; rows.push(0); }
      rows[r] = g.e; g.row = r;
    });
    return rows.length;
  }
  const posRows = stack(positions);
  const eduRows = stack(edu);

  const outs = [];
  const byYear = {};
  PUBLICATIONS.filter((p) => p.year && p.type !== "preparation").forEach((p) => (byYear[p.year] = byYear[p.year] || []).push(p));
  Object.entries(byYear).forEach(([y, list]) => list.forEach((p, k) => outs.push({ p, x: +y + 0.18 + (k + 0.5) * (0.64 / list.length) })));

  const PLACES = [["Istanbul", 2014.7, 2019.6], ["Stockholm", 2019.6, 2021.6], ["New Haven", 2022.0, 2025.7], ["Birmingham", 2025.7, NOW]];
  const TYPEC = { journal: "#E64B35", abstract: "#3C5488", presentation: "#00A087" };
  const TYPEN = { journal: "Paper", abstract: "Abstract", presentation: "Talk / poster" };

  function render() {
    const Wd = wrap.clientWidth, L = 14, R = Wd - 14, compact = Wd < 640;
    const X = (yr) => L + ((yr - dom[0]) / (dom[1] - dom[0])) * (R - L);
    const ink = css("--ink"), ink3 = css("--ink-3"), rule = css("--rule"), rule2 = css("--rule-2"), fig = css("--fig"), acc = css("--accent");
    svg.innerHTML = "";
    let y = 0;

    // --- ideogram (always shows the whole locus) with a red box for the current view
    const I = (yr) => L + ((yr - FULL[0]) / (FULL[1] - FULL[0])) * (R - L);
    const ideo = svgEl("g", {}, svg);
    const cen = 2021.8;
    for (let yr = Math.floor(FULL[0]); yr < FULL[1]; yr++) {
      const a = Math.max(yr, FULL[0]), b = Math.min(yr + 1, FULL[1]);
      svgEl("rect", { x: I(a), y: 12, width: Math.max(0, I(b) - I(a)), height: 12, fill: mix(fig, ink, yr % 2 ? 0.3 : 0.08) }, ideo);
    }
    svgEl("path", { d: `M${I(cen) - 6},12 L${I(cen)},18 L${I(cen) - 6},24 Z M${I(cen) + 6},12 L${I(cen)},18 L${I(cen) + 6},24 Z`, fill: fig }, ideo);
    svgEl("rect", { x: L, y: 12, width: R - L, height: 12, rx: 6, fill: "none", stroke: ink3, "stroke-width": 1 }, ideo);
    svgEl("rect", { x: I(dom[0]), y: 9, width: Math.max(2, I(dom[1]) - I(dom[0])), height: 18, fill: "none", stroke: acc, "stroke-width": 2 }, ideo);
    y = 46;

    // --- ruler
    const span = dom[1] - dom[0];
    const pxPerYr = (R - L) / span;
    const step = span > 8 ? 1 : span > 3 ? 0.5 : 0.25;
    const every = pxPerYr < 46 ? 2 : 1; // thin out year labels on narrow screens
    const axis = svgEl("g", { class: "axis" }, svg);
    svgEl("line", { x1: L, x2: R, y1: y, y2: y, stroke: ink3 }, axis);
    for (let v = Math.ceil(dom[0] / step) * step; v <= dom[1]; v += step) {
      const major = Math.abs(v - Math.round(v)) < 1e-6;
      svgEl("line", { x1: X(v), x2: X(v), y1: y, y2: y + (major ? 7 : 4), stroke: ink3 }, axis);
      const showMinor = step < 1 && pxPerYr * step > 34;
      if ((major && Math.round(v) % every === 0) || (!major && showMinor)) {
        const t = svgEl("text", { x: X(v), y: y + 19, "text-anchor": "middle" }, axis);
        t.textContent = major ? Math.round(v) : step === 0.5 ? "Jul" : ["Jan", "Apr", "Jul", "Oct"][Math.round((v % 1) * 4)];
      }
    }
    // brush hit-area over ideogram + ruler
    const hit = svgEl("rect", { class: "ruler-hit", x: L, y: 4, width: R - L, height: y + 22, fill: "transparent" }, svg);
    y += 44;

    // clip everything below to the plot
    const defs = svgEl("defs", {}, svg);
    const cp = svgEl("clipPath", { id: "plotclip" }, defs);
    svgEl("rect", { x: L, y: 0, width: R - L, height: 2000 }, cp);

    function trackName(text, yy) { const t = svgEl("text", { class: "track-name", x: L, y: yy }, svg); t.textContent = text; }
    function genes(list, nRows, top) {
      const g = svgEl("g", { "clip-path": "url(#plotclip)" }, svg);
      list.forEach((d) => {
        const gy = top + d.row * 46;
        const x0 = X(d.s), x1 = X(Math.min(d.e, NOW)), xf = X(d.e);
        const gg = svgEl("g", { class: "gene" + (selected === d ? " is-sel" : "") }, g);
        // intron line + chevrons
        svgEl("line", { x1: x0, x2: xf, y1: gy + 26, y2: gy + 26, stroke: ink3, "stroke-width": 1 }, gg);
        for (let cx = x0 + 10; cx < xf - 6; cx += 16) svgEl("path", { d: `M${cx - 2},${gy + 23} L${cx + 1},${gy + 26} L${cx - 2},${gy + 29}`, stroke: ink3, fill: "none", "stroke-width": 1 }, gg);
        // exons = calendar years
        for (let yr = Math.floor(d.s); yr < d.e; yr++) {
          const a = Math.max(d.s, yr + 0.06), b = Math.min(Math.min(d.e, NOW), yr + 0.94);
          if (b > a) svgEl("rect", { class: "exon", x: X(a), y: gy + 20, width: Math.max(1.5, X(b) - X(a)), height: 12, fill: d.kind === "edu" ? ink3 : ink }, gg);
        }
        if (d.e > NOW) svgEl("rect", { x: X(NOW), y: gy + 20, width: Math.max(0, xf - X(NOW)), height: 12, fill: "none", stroke: ink3, "stroke-dasharray": "3 2" }, gg);
        // label if there is room
        const w = xf - x0;
        const name = svgEl("text", { x: x0, y: gy + 13 }, gg);
        name.textContent = d.kind === "edu" ? (compact ? d.org : `${d.org} · ${d.role.split(" · ")[0]}`) : compact ? TINY(d.org) : SHORT(d.org);
        if (w < (compact ? 16 : 34)) name.style.display = "none";
        // keep labels inside the plot: right-align when they would run off the edge
        const tw = name.getComputedTextLength ? name.getComputedTextLength() : 0;
        if (x0 + tw > R) { name.setAttribute("x", Math.min(xf, R)); name.setAttribute("text-anchor", "end"); }
        // invisible hit box
        svgEl("rect", { x: x0 - 4, y: gy, width: Math.max(14, xf - x0 + 8), height: 38, fill: "transparent" }, gg);
        gg.addEventListener("mouseenter", (e) => showTip(e, `<b>${esc(d.kind === "edu" ? d.org + ", " + EDUCATION[d.i].field : d.org)}</b><br>${esc(d.kind === "edu" ? d.role : d.role)}<br>${esc(d.dates)}`));
        gg.addEventListener("mousemove", moveTip);
        gg.addEventListener("mouseleave", hideTip);
        gg.addEventListener("click", () => { selected = d; showDetail(d); render(); });
      });
      return top + nRows * 46;
    }

    trackName("Education", y); y = genes(edu, eduRows, y + 4) + 6;
    trackName("Positions", y); y = genes(positions, posRows, y + 4) + 8;

    // --- outputs lollipop
    trackName("Outputs", y);
    const legendG = svgEl("g", {}, svg);
    let lx = L + 78;
    Object.entries(TYPEN).forEach(([k, n]) => {
      svgEl("circle", { cx: lx, cy: y - 4, r: 4, fill: TYPEC[k] }, legendG);
      const t = svgEl("text", { class: "lbl", x: lx + 8, y: y - 0.5 }, legendG); t.textContent = n; lx += n.length * 6.6 + 26;
    });
    const base = y + 92;
    const lg = svgEl("g", { "clip-path": "url(#plotclip)" }, svg);
    svgEl("line", { x1: L, x2: R, y1: base, y2: base, stroke: rule2 }, lg);
    outs.forEach((o) => {
      const p = o.p, first = /^Alanya H/.test(p.authors || "");
      const h = { journal: 62, abstract: 44, presentation: 30 }[p.type];
      const g = svgEl("g", { class: "lolli" }, lg);
      svgEl("line", { x1: X(o.x), x2: X(o.x), y1: base, y2: base - h, stroke: ink3, "stroke-width": 1.2 }, g);
      svgEl("circle", { cx: X(o.x), cy: base - h, r: first ? 7.5 : 5, fill: TYPEC[p.type], stroke: fig, "stroke-width": 1.5 }, g);
      g.addEventListener("mouseenter", (e) => showTip(e, `<b>${esc(p.title)}</b><br>${esc(TYPEN[p.type])} · ${esc(p.venue)} · ${p.year}${first ? "<br>First author" : ""}${p.link ? "<br>click to open" : ""}`));
      g.addEventListener("mousemove", moveTip);
      g.addEventListener("mouseleave", hideTip);
      g.addEventListener("click", () => { if (p.link) window.open(p.link, "_blank", "noopener"); });
      if (p.link) g.style.cursor = "pointer";
    });
    y = base + 22;

    // --- location track
    trackName("Location", y); y += 8;
    const loc = svgEl("g", { "clip-path": "url(#plotclip)" }, svg);
    PLACES.forEach(([name, a, b], k) => {
      const x0 = X(a), x1 = X(b);
      svgEl("rect", { x: x0, y, width: Math.max(0, x1 - x0 - 2), height: 18, fill: mix(isNight() ? "#13100d" : "#fbf8f2", ["#E64B35", "#4DBBD5", "#3C5488", "#00A087"][k], isNight() ? 0.45 : 0.22) }, loc);
      const t = svgEl("text", { class: "lbl", x: x0 + 6, y: y + 12.5 }, loc);
      t.textContent = name; t.style.fill = ink;
      if (x1 - x0 < name.length * 6.6 + 10) t.style.display = "none";
    });
    y += 30;

    // "today" marker
    if (NOW > dom[0] && NOW < dom[1]) {
      svgEl("line", { x1: X(NOW), x2: X(NOW), y1: 40, y2: y - 6, stroke: acc, "stroke-width": 1, "stroke-dasharray": "2 3" }, svg);
      const t = svgEl("text", { class: "lbl", x: X(NOW) - 4, y: 40, "text-anchor": "end" }, svg); t.textContent = "today"; t.style.fill = acc;
    }

    svg.setAttribute("viewBox", `0 0 ${Wd} ${y}`);
    svg.setAttribute("height", y);
    locusEl.textContent = `chrHA:${Math.round(dom[0] * 1000).toLocaleString("en")}–${Math.round(dom[1] * 1000).toLocaleString("en")}  (${(dom[1] - dom[0]).toFixed(1)} yr)`;

    // brushing
    // dragging on the ideogram picks a range of the whole locus; on the ruler, a range of the current view
    let b0 = null, brush = null, onIdeo = false;
    const pt = (e) => { const r = svg.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    hit.addEventListener("pointerdown", (e) => {
      const [px, py] = pt(e);
      b0 = Math.max(L, Math.min(R, px)); onIdeo = py < 32; hit.setPointerCapture(e.pointerId);
      brush = svgEl("rect", { class: "brush", x: b0, y: onIdeo ? 6 : 40, width: 0, height: onIdeo ? 24 : 30 }, svg);
    });
    hit.addEventListener("pointermove", (e) => {
      if (b0 == null) return;
      const x = Math.max(L, Math.min(R, pt(e)[0]));
      brush.setAttribute("x", Math.min(b0, x)); brush.setAttribute("width", Math.abs(x - b0));
    });
    hit.addEventListener("pointerup", (e) => {
      if (b0 == null) return;
      const x1 = Math.max(L, Math.min(R, pt(e)[0]));
      const base = onIdeo ? FULL : dom;
      const inv = (px) => base[0] + ((px - L) / (R - L)) * (base[1] - base[0]);
      if (Math.abs(x1 - b0) > 8) {
        let a = inv(Math.min(b0, x1)), b = inv(Math.max(b0, x1));
        if (b - a < 0.75) { const m = (a + b) / 2; a = m - 0.375; b = m + 0.375; }
        zoomTo([a, b]);
      } else brush.remove();
      b0 = null;
    });
    hit.addEventListener("dblclick", () => zoomTo(FULL));
  }

  function zoomTo(target) {
    cancelAnimationFrame(anim);
    const from = dom.slice(), t0 = performance.now(), dur = RM ? 0 : 450;
    (function step(now) {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      dom = [from[0] + (target[0] - from[0]) * e, from[1] + (target[1] - from[1]) * e];
      render();
      if (k < 1) anim = requestAnimationFrame(step);
    })(t0);
  }

  function showTip(e, html) { tip.innerHTML = html; tip.style.opacity = 1; moveTip(e); }
  function moveTip(e) { const r = wrap.getBoundingClientRect(); placeTip(tip, wrap, e.clientX - r.left, e.clientY - r.top); }
  function hideTip() { tip.style.opacity = 0; }

  function showDetail(d) {
    if (d.kind === "edu") {
      const e = EDUCATION[d.i];
      detail.innerHTML = `<div class="detail__head"><span class="detail__org">${esc(e.degree)} · ${esc(e.field)}</span><span class="detail__role">${esc(e.school)}, ${esc(e.place)}</span><span class="detail__dates">${esc(e.years)}</span></div><p class="detail__group">${esc(e.note)}</p>`;
      return;
    }
    const j = EXPERIENCE[d.i];
    detail.innerHTML = `<div class="detail__head"><span class="detail__org">${esc(j.org)}</span><span class="detail__role">${esc(j.role)}</span><span class="detail__dates">${esc(j.dates)}</span></div>
      <p class="detail__group">${esc(j.group || "")}${j.link ? ` · <a class="ilink" href="${j.link}" target="_blank" rel="noopener">${esc(j.linkLabel || "Lab website")}</a>` : ""}</p>
      <ul>${j.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`;
  }

  selected = positions.find((p) => /Birmingham/.test(p.org));
  showDetail(selected);
  render();
  $("#resetZoom").addEventListener("click", () => zoomTo(FULL));
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(render, 80); });
  document.addEventListener("themechange", render);
}

/* ---------------------------------------------------------------------
   FIGURE 3 · clustered heatmap (competency × research group)
   --------------------------------------------------------------------- */
const HEAT_COLS = [
  { k: "Koç", s: "Koç", y: "2016–18" }, { k: "Bilgi", s: "Bilgi", y: "2017–19" }, { k: "SciLifeLab", s: "SLL", y: "2020–21" }, { k: "Yale", s: "Yale", y: "2022–25" }, { k: "Birmingham", s: "UoB", y: "2025–" },
];
const HEAT_ROWS = [
  ["Python programming", [3, 2, 2, 3, 3]],
  ["R / Bioconductor", [0, 2, 3, 3, 3]],
  ["Protein–protein interactions", [3, 0, 1, 0, 1]],
  ["Structural modelling & docking", [3, 0, 0, 0, 0]],
  ["Classical machine learning", [0, 3, 1, 1, 3]],
  ["Graph & causal ML", [0, 0, 0, 0, 3]],
  ["Microarray analysis", [0, 3, 1, 0, 1]],
  ["Bulk RNA-seq", [0, 0, 2, 3, 3]],
  ["Single-cell analysis", [0, 0, 0, 3, 1]],
  ["WES & variant calling", [0, 0, 0, 3, 1]],
  ["Epigenomics", [0, 0, 0, 2, 3]],
  ["Proteomics & metabolomics", [0, 0, 3, 0, 2]],
  ["Network biology", [1, 0, 3, 1, 3]],
  ["Reproducible pipelines", [0, 0, 1, 3, 3]],
  ["Clinical translation", [0, 0, 0, 3, 1]],
  ["Drug repurposing", [0, 0, 2, 0, 3]],
];
const LEVELS = ["not used", "exposure", "regular use", "core to the work"];

function hclust(rows) {
  // average-linkage agglomerative clustering, Euclidean distance
  const d = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
  let clusters = rows.map((r, i) => ({ leaves: [i], h: 0, id: i }));
  const D = rows.map((a) => rows.map((b) => d(a, b)));
  const cd = (A, B) => { let s = 0; A.leaves.forEach((i) => B.leaves.forEach((j) => (s += D[i][j]))); return s / (A.leaves.length * B.leaves.length); };
  while (clusters.length > 1) {
    let bi = 0, bj = 1, bd = Infinity;
    for (let i = 0; i < clusters.length; i++) for (let j = i + 1; j < clusters.length; j++) {
      const v = cd(clusters[i], clusters[j]); if (v < bd) { bd = v; bi = i; bj = j; }
    }
    const node = { left: clusters[bi], right: clusters[bj], h: bd, leaves: [...clusters[bi].leaves, ...clusters[bj].leaves] };
    clusters = clusters.filter((_, k) => k !== bi && k !== bj).concat(node);
  }
  return clusters[0];
}

function initHeat() {
  const svg = $("#heat"), wrap = $("#heatWrap"), tip = $("#heatTip");
  const tree = hclust(HEAT_ROWS.map((r) => r[1]));
  const order = tree.leaves;

  function scaleSwatches() {
    $("#heatScale").innerHTML = LEVELS.map((l, i) => `<i style="background:${color(i)}" title="${l}"></i>`).join("") + "<span>none → core</span>";
  }
  function color(v) { return v === 0 ? mix(css("--fig"), css("--ink"), 0.045) : mix(css("--fig"), css("--accent"), [0, 0.22, 0.55, 1][v]); }

  function render() {
    svg.innerHTML = "";
    const Wd = wrap.clientWidth, small = Wd < 560;
    // pheatmap layout: dendrogram | cells | row labels
    const dendW = small ? 30 : 90, labW = small ? 158 : 240, top = small ? 26 : 40, ch = small ? 24 : 27;
    const cw = Math.min(118, (Wd - dendW - labW - 24) / HEAT_COLS.length);
    const x0 = dendW + 6;
    const labX = x0 + cw * HEAT_COLS.length + 12;
    const H = top + order.length * ch + 8;
    svg.setAttribute("viewBox", `0 0 ${Wd} ${H}`); svg.setAttribute("height", H);
    const rowY = {}; order.forEach((r, k) => (rowY[r] = top + k * ch + ch / 2));

    // dendrogram
    const maxH = tree.h, dx = (h) => 6 + (1 - h / maxH) * (dendW - 10);
    (function draw(n) {
      if (n.leaves.length === 1) return { y: rowY[n.leaves[0]], x: dendW + 2 };
      const a = draw(n.left), b = draw(n.right), x = dx(n.h);
      svgEl("path", { class: "dendro", d: `M${a.x},${a.y} H${x} V${b.y} H${b.x}` }, svg);
      return { y: (a.y + b.y) / 2, x };
    })(tree);

    // column labels
    HEAT_COLS.forEach((c, j) => {
      const g = svgEl("g", { class: "col" }, svg);
      const t = svgEl("text", { x: x0 + j * cw + cw / 2, y: 16, "text-anchor": "middle", "data-col": j }, g);
      t.textContent = small ? c.s : c.k; t.style.fill = css("--ink"); t.style.fontFamily = "Geist, Inter, sans-serif"; t.style.fontSize = small ? "10px" : "12px";
      if (!small) { const s = svgEl("text", { class: "collbl", x: x0 + j * cw + cw / 2, y: 30, "text-anchor": "middle" }, g); s.textContent = c.y; }
    });
    // rows
    order.forEach((r) => {
      const [name, vals] = HEAT_ROWS[r], y = rowY[r];
      const t = svgEl("text", { x: labX, y: y + 4, "data-row": r }, svg);
      t.textContent = name; if (small) t.style.fontSize = "10px";
      vals.forEach((v, j) => {
        const c = svgEl("rect", { class: "cell", x: x0 + j * cw + 1, y: y - ch / 2 + 1, width: cw - 2, height: ch - 2, fill: color(v), "data-r": r, "data-c": j }, svg);
        if (v === 3) svgEl("circle", { cx: x0 + j * cw + cw / 2, cy: y, r: 2.2, fill: css("--fig"), "pointer-events": "none" }, svg);
        c.addEventListener("mouseenter", (e) => {
          svg.classList.add("hovering");
          $$(".cell", svg).forEach((el) => el.classList.toggle("on", +el.dataset.r === r || +el.dataset.c === j));
          $$("text[data-row]", svg).forEach((el) => el.classList.toggle("on", +el.dataset.row === r));
          $$("text[data-col]", svg).forEach((el) => el.classList.toggle("on", +el.dataset.col === j));
          tip.innerHTML = `<b>${esc(name)}</b><br>${esc(HEAT_COLS[j].k)} (${esc(HEAT_COLS[j].y)}): ${LEVELS[v]}`;
          tip.style.opacity = 1;
          const rr = wrap.getBoundingClientRect(); placeTip(tip, wrap, e.clientX - rr.left, e.clientY - rr.top);
        });
      });
    });
  }
  svg.addEventListener("mouseleave", () => {
    svg.classList.remove("hovering"); tip.style.opacity = 0;
    $$(".on", svg).forEach((el) => el.classList.remove("on"));
  });
  scaleSwatches();
  render();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(render, 80); });
  document.addEventListener("themechange", () => { scaleSwatches(); render(); });
}

/* ---------------------------------------------------------------------
   Outputs, methods, education, supplementary
   --------------------------------------------------------------------- */
function initOutputs() {
  const TABS = [["all", "All"], ["journal", "Articles"], ["abstract", "Abstracts"], ["presentation", "Talks"], ["preparation", "In preparation"]];
  const TY = { journal: "Article", abstract: "Abstract", presentation: "Talk", preparation: "In prep." };
  const st = { tab: "all", first: false };
  $("#refTabs").innerHTML = TABS.map(([k, n]) => {
    const c = k === "all" ? PUBLICATIONS.length : PUBLICATIONS.filter((p) => p.type === k).length;
    return `<button data-k="${k}" class="${k === "all" ? "is-on" : ""}">${n}<span class="ct">${c}</span></button>`;
  }).join("");

  function authors(p, idx) {
    if (!p.authors) return "";
    const list = p.authors.split(/,\s*/), me = list.findIndex((a) => /^Alanya H/.test(a)), cut = Math.max(6, me + 2);
    const fmt = (a) => (/^Alanya H/.test(a) ? `<b>${esc(a)}</b>` : esc(a));
    if (list.length <= cut + 1 || p._x) return list.map(fmt).join(", ") + ". ";
    return list.slice(0, cut).map(fmt).join(", ") + `, <button class="more" data-x="${idx}">et al. (+${list.length - cut})</button>. `;
  }
  function render() {
    const items = PUBLICATIONS.filter((p) => (st.tab === "all" || p.type === st.tab) && (!st.first || /^Alanya H/.test(p.authors || "")));
    $("#refs").innerHTML = items.map((p) => {
      const idx = PUBLICATIONS.indexOf(p);
      return `<li><div><span class="ty">${TY[p.type]}${p.presenter ? " · presenter" : ""}</span><span class="au">${authors(p, idx)}</span><span class="ti">${esc(p.title)}.</span> ${p.venue ? `<span class="ve">${esc(p.venue)}.</span>` : ""}${p.link ? `<a class="go" href="${p.link}" target="_blank" rel="noopener">read ↗</a>` : ""}</div><span class="yr">${p.year || "in prep."}</span></li>`;
    }).join("");
  }
  $("#refTabs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    st.tab = b.dataset.k; $$("#refTabs button").forEach((x) => x.classList.toggle("is-on", x === b)); render();
  });
  $("#firstOnly").addEventListener("change", (e) => { st.first = e.target.checked; render(); });
  $("#refs").addEventListener("click", (e) => { const b = e.target.closest("[data-x]"); if (b) { PUBLICATIONS[+b.dataset.x]._x = true; render(); } });
  render();
}

function initMethods() {
  $("#methodsBody").innerHTML =
    SKILLS.map((g) => `<p><span class="runin">${esc(g.group)}.</span> <span class="tools">${esc(g.items.join(", "))}.</span></p>`).join("") +
    `<p><span class="runin">Wet-lab training.</span> <span class="tools">DNA and RNA isolation, PCR, RT-PCR and qPCR, cloning (plasmid preparation, restriction digest, ligation), SDS-PAGE, chromatography and aseptic microbiology.</span></p>`;
  $("#eduRows").innerHTML = EDUCATION.map((e) => `<tr><td>${esc(e.degree)}</td><td>${esc(e.field)}</td><td>${esc(e.school)}<span class="note2">${esc(e.note)}</span></td><td class="r">${esc(e.years)}</td></tr>`).join("");
  $("#supp").innerHTML =
    AWARDS.map((a) => `<li><span class="y">${esc(a.year)}</span>${esc(a.title)}, ${esc(a.org)}</li>`).join("") +
    `<li><span class="y">2023–24</span>Mentored three summer research students</li>`;
}

/* ---------------------------------------------------------------------
   Page chrome: solid nav on scroll, section index, reveal
   --------------------------------------------------------------------- */
function initChrome() {
  $("#yr").textContent = new Date().getFullYear();
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-solid", scrollY > 30);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const links = new Map($$("#rIndex a").map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver((es) => es.forEach((en) => {
    if (en.isIntersecting) { links.forEach((a) => a.classList.remove("is-active")); links.get(en.target.id)?.classList.add("is-active"); }
  }), { rootMargin: "-35% 0px -60% 0px" });
  $$(".rsec[id]").forEach((s) => spy.observe(s));

  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -60px 0px" });
  $$(".rv").forEach((el) => io.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  initChrome();
  initOutputs();
  initMethods();
  initUmap();
  initBrowser();
  initHeat();
  // links from the homepage (research.html#career-locus etc.) land on the right figure once it is drawn
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) setTimeout(() => target.scrollIntoView({ behavior: "instant" }), 80);
});
