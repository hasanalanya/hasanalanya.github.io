/* =====================================================================
   Animated visuals: hero network, DNA helix, skills graph
   ===================================================================== */

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* Run a draw loop only while the element is on screen */
function whenVisible(el, onChange) {
  const io = new IntersectionObserver(([e]) => onChange(e.isIntersecting), { threshold: 0 });
  io.observe(el);
}

/* ---------------------------------------------------------------------
   1. Hero background: drifting molecular interaction network
   --------------------------------------------------------------------- */
function initNetwork() {
  const canvas = document.getElementById("networkCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, dpr, nodes = [], running = false, raf;
  const mouse = { x: -9999, y: -9999 };
  let colors;

  function readColors() {
    colors = [cssVar("--accent"), cssVar("--accent-2"), cssVar("--accent-3")].map(hexToRgb);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(110, Math.floor((w * h) / 13000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.8,
      c: Math.random() < 0.6 ? 0 : Math.random() < 0.6 ? 1 : 2,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const linkDist = Math.min(150, w / 7);
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      // gentle push away from the pointer
      const dx = n.x - mouse.x, dy = n.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 120 * 120 && d2 > 1) {
        const f = (1 - Math.sqrt(d2) / 120) * 0.6;
        n.x += (dx / Math.sqrt(d2)) * f;
        n.y += (dy / Math.sqrt(d2)) * f;
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < linkDist) {
          const [r, g, bl] = colors[a.c];
          ctx.strokeStyle = `rgba(${r},${g},${bl},${(1 - d / linkDist) * 0.28})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // links to the pointer
      const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (md < 190) {
        const [r, g, bl] = colors[0];
        ctx.strokeStyle = `rgba(${r},${g},${bl},${(1 - md / 190) * 0.55})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
    for (const n of nodes) {
      const [r, g, b] = colors[n.c];
      ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (running) raf = requestAnimationFrame(draw);
  }

  readColors();
  resize();
  window.addEventListener("resize", () => { resize(); if (!running) draw(); });
  document.addEventListener("themechange", () => { readColors(); if (!running) draw(); });
  const hero = canvas.parentElement;
  hero.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

  if (REDUCED_MOTION) { draw(); return; }
  whenVisible(hero, (vis) => {
    if (vis && !running) { running = true; draw(); }
    else if (!vis) { running = false; cancelAnimationFrame(raf); }
  });
}

/* ---------------------------------------------------------------------
   2. Hero visual: 3D DNA double helix you can spin
   --------------------------------------------------------------------- */
function initHelix() {
  const canvas = document.getElementById("helixCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const wrap = canvas.parentElement;
  let w, h, dpr, running = false, raf;
  let rot = 0, speed = 0.012, targetSpeed = 0.012, tilt = 0, targetTilt = 0;
  let dragging = false, lastX = 0;
  let pal;

  // base pairs: A–T and G–C, coloured in two pairs
  const BASES = Array.from({ length: 30 }, () => (Math.random() < 0.5 ? 0 : 1));

  function readColors() {
    pal = {
      a: cssVar("--accent"),
      b: cssVar("--accent-2"),
      c: cssVar("--accent-3"),
      d: "#ffb84d",
      text: cssVar("--muted"),
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    speed += (targetSpeed - speed) * 0.05;
    tilt += (targetTilt - tilt) * 0.06;
    rot += speed;

    const N = BASES.length;
    const R = Math.min(w * 0.26, 110);
    const span = h * 0.86;
    const step = span / (N - 1);
    const cx = w / 2, cy = h / 2, f = 420;
    const items = [];

    for (let i = 0; i < N; i++) {
      const a = i * 0.42 + rot;
      const y0 = -span / 2 + i * step;
      const pts = [a, a + Math.PI].map((ang) => {
        const x = R * Math.cos(ang);
        const z = R * Math.sin(ang);
        // tilt the whole helix around the x axis a little
        const y = y0 * Math.cos(tilt) - z * Math.sin(tilt);
        const zz = y0 * Math.sin(tilt) + z * Math.cos(tilt);
        const s = f / (f + zz);
        return { x: cx + x * s, y: cy + y * s, z: zz, s };
      });
      items.push({ i, p: pts[0], q: pts[1], z: (pts[0].z + pts[1].z) / 2 });
    }

    // backbones (draw back-to-front in segments)
    const segs = [];
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < N - 1; i++) {
        const p1 = k ? items[i].q : items[i].p;
        const p2 = k ? items[i + 1].q : items[i + 1].p;
        segs.push({ p1, p2, z: (p1.z + p2.z) / 2, k });
      }
    }

    const all = [
      ...segs.map((s) => ({ kind: "seg", ...s })),
      ...items.map((it) => ({ kind: "rung", ...it })),
    ].sort((m, n) => n.z - m.z);

    for (const o of all) {
      const depth = Math.max(0.15, Math.min(1, 0.6 - o.z / (R * 2.2)));
      if (o.kind === "seg") {
        ctx.strokeStyle = o.k ? pal.b : pal.a;
        ctx.globalAlpha = depth;
        ctx.lineWidth = 3.2 * ((o.p1.s + o.p2.s) / 2);
        ctx.beginPath();
        ctx.moveTo(o.p1.x, o.p1.y);
        ctx.lineTo(o.p2.x, o.p2.y);
        ctx.stroke();
      } else {
        const pair = BASES[o.i];
        const c1 = pair ? pal.c : pal.a;
        const c2 = pair ? pal.d : pal.b;
        const mx = (o.p.x + o.q.x) / 2, my = (o.p.y + o.q.y) / 2;
        ctx.globalAlpha = depth * 0.9;
        ctx.lineWidth = 2.4 * ((o.p.s + o.q.s) / 2);
        ctx.strokeStyle = c1;
        ctx.beginPath(); ctx.moveTo(o.p.x, o.p.y); ctx.lineTo(mx, my); ctx.stroke();
        ctx.strokeStyle = c2;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(o.q.x, o.q.y); ctx.stroke();
        for (const [pt, col] of [[o.p, pal.a], [o.q, pal.b]]) {
          ctx.globalAlpha = Math.max(0.2, Math.min(1, 0.65 - pt.z / (R * 2)));
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4.6 * pt.s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
    if (running) raf = requestAnimationFrame(draw);
  }

  readColors();
  resize();
  window.addEventListener("resize", () => { resize(); if (!running) draw(); });
  document.addEventListener("themechange", () => { readColors(); if (!running) draw(); });

  wrap.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener("pointermove", (e) => {
    const r = wrap.getBoundingClientRect();
    targetTilt = ((e.clientY - r.top) / r.height - 0.5) * 0.5;
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    rot += dx * 0.012;
    speed = dx * 0.004;
  });
  const end = () => { dragging = false; targetTilt = 0; };
  wrap.addEventListener("pointerup", end);
  wrap.addEventListener("pointercancel", end);
  wrap.addEventListener("pointerleave", () => { if (!dragging) targetTilt = 0; });

  if (REDUCED_MOTION) { targetSpeed = speed = 0; draw(); return; }
  whenVisible(wrap, (vis) => {
    if (vis && !running) { running = true; draw(); }
    else if (!vis) { running = false; cancelAnimationFrame(raf); }
  });
}

/* ---------------------------------------------------------------------
   3. Skills: force-directed graph in SVG (no libraries)
   --------------------------------------------------------------------- */

/* Extra edges between tools that are used together */
const SKILL_LINKS = [
  ["Python", "Scanpy"], ["Python", "scikit-learn"], ["Python", "TensorFlow"], ["Python", "PRISM"],
  ["R", "Seurat"], ["R", "DESeq2"], ["R", "edgeR"], ["R", "limma"], ["Bioconductor", "DESeq2"],
  ["Bioconductor", "limma"], ["Nextflow", "Docker"], ["Snakemake", "Singularity"], ["Nextflow", "GATK"],
  ["GNNs", "STRING"], ["Causal ML", "Reactome"], ["Seurat", "UMAP"], ["Cytoscape", "STRING"],
];

function initSkillsGraph(onSelect) {
  const svg = document.getElementById("skillsSvg");
  const tip = document.getElementById("graphTip");
  if (!svg) return { select() {} };
  const NS = "http://www.w3.org/2000/svg";

  const nodes = [];
  const links = [];
  const byName = {};
  const root = { id: "root", label: "Hasan", type: "root", color: cssVar("--accent"), r: 17 };
  nodes.push(root);

  SKILLS.forEach((g) => {
    const hub = { id: "hub:" + g.group, label: g.group, type: "hub", group: g.group, color: g.color, r: 10 };
    nodes.push(hub);
    links.push({ s: root, t: hub, len: 150, k: 0.04 });
    g.items.forEach((item) => {
      const leaf = { id: item, label: item, type: "leaf", group: g.group, color: g.color, r: 5 };
      nodes.push(leaf);
      byName[item] = leaf;
      links.push({ s: hub, t: leaf, len: 62, k: 0.08 });
    });
  });
  SKILL_LINKS.forEach(([a, b]) => {
    if (byName[a] && byName[b]) links.push({ s: byName[a], t: byName[b], len: 160, k: 0.004, cross: true });
  });

  const neighbours = new Map(nodes.map((n) => [n, new Set([n])]));
  links.forEach((l) => { neighbours.get(l.s).add(l.t); neighbours.get(l.t).add(l.s); });

  // DOM
  const gLinks = document.createElementNS(NS, "g");
  const gNodes = document.createElementNS(NS, "g");
  svg.append(gLinks, gNodes);
  links.forEach((l) => {
    l.el = document.createElementNS(NS, "line");
    l.el.setAttribute("class", "link");
    if (l.cross) l.el.setAttribute("stroke-dasharray", "3 4");
    gLinks.appendChild(l.el);
  });
  nodes.forEach((n) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "node " + n.type);
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("r", n.r);
    c.setAttribute("fill", n.color);
    const t = document.createElementNS(NS, "text");
    t.textContent = n.label;
    t.setAttribute("text-anchor", n.type === "leaf" ? "start" : "middle");
    t.setAttribute("dx", n.type === "leaf" ? 8 : 0);
    t.setAttribute("dy", n.type === "leaf" ? 4 : -(n.r + 7));
    g.append(c, t);
    gNodes.appendChild(g);
    n.el = g;
    n.circle = c;
  });

  const hubs = nodes.filter((n) => n.type === "hub");
  let W = 0, H = 0, alpha = 1, raf = null, visible = false;
  let selectedGroup = null, hoverNode = null, dragNode = null;

  function layoutInitial() {
    const hubs = nodes.filter((n) => n.type === "hub");
    const rad = Math.min(W, H) * 0.3;
    root.x = W / 2; root.y = H / 2;
    hubs.forEach((hub, i) => {
      const a = (i / hubs.length) * Math.PI * 2 - Math.PI / 2;
      hub.x = W / 2 + Math.cos(a) * rad * 1.3;
      hub.y = H / 2 + Math.sin(a) * rad;
    });
    nodes.filter((n) => n.type === "leaf").forEach((n) => {
      const hub = nodes.find((h) => h.type === "hub" && h.group === n.group);
      const a = Math.random() * Math.PI * 2;
      n.x = hub.x + Math.cos(a) * 40;
      n.y = hub.y + Math.sin(a) * 40;
    });
    nodes.forEach((n) => { n.vx = 0; n.vy = 0; });
  }

  function resize() {
    const r = svg.getBoundingClientRect();
    const firstTime = W === 0;
    W = r.width; H = r.height;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.classList.toggle("compact", W < 640);
    hubs.forEach((h) => { h.lw = h.el.querySelector("text").getComputedTextLength() || h.label.length * 7.5; });
    const hubLen = W < 640 ? Math.min(W * 0.36, H * 0.36) : Math.min(W * 0.34, H * 0.4);
    const leafLen = W < 640 ? 34 : Math.max(42, Math.min(72, W / 15));
    links.forEach((l) => {
      l.cur = l.s.type === "root" ? hubLen : l.cross ? l.len : leafLen;
    });
    root.x = W / 2; root.y = H / 2;
    if (firstTime) layoutInitial();
    kick();
  }

  function tick() {
    // repulsion scales with the drawing area so small screens don't explode
    const repel = Math.max(450, Math.min(2400, (2400 * W * H) / (1000 * 640)));
    // repulsion
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d2 = dx * dx + dy * dy || 0.01;
        if (d2 > 90000) continue;
        const f = repel / d2;
        const d = Math.sqrt(d2);
        dx /= d; dy /= d;
        a.vx -= dx * f; a.vy -= dy * f;
        b.vx += dx * f; b.vy += dy * f;
      }
    }
    // keep hub labels from overlapping each other
    for (let i = 0; i < hubs.length; i++) {
      for (let j = i + 1; j < hubs.length; j++) {
        const a = hubs[i], b = hubs[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const minX = (a.lw + b.lw) / 2 + 6, minY = 30;
        if (Math.abs(dx) < minX && Math.abs(dy) < minY) {
          const push = (minY - Math.abs(dy)) * 0.08;
          const s = dy >= 0 ? 1 : -1;
          a.vy -= s * push; b.vy += s * push;
        }
      }
    }
    // springs
    links.forEach((l) => {
      const dx = l.t.x - l.s.x, dy = l.t.y - l.s.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const f = (d - l.cur) * l.k;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      l.s.vx += fx; l.s.vy += fy;
      l.t.vx -= fx; l.t.vy -= fy;
    });
    // gravity, integrate, keep inside the box
    nodes.forEach((n) => {
      n.vx += (W / 2 - n.x) * 0.001;
      n.vy += (H / 2 - n.y) * 0.002;
      if (n === dragNode) { n.vx = n.vy = 0; return; }
      if (n === root) { n.x += (W / 2 - n.x) * 0.1; n.y += (H / 2 - n.y) * 0.1; n.vx = n.vy = 0; return; }
      n.vx *= 0.82; n.vy *= 0.82;
      n.x += n.vx * alpha;
      n.y += n.vy * alpha;
      const padL = n.type === "hub" ? n.lw / 2 + 6 : 12;
      const padR = n.type === "hub" ? n.lw / 2 + 6 : W < 640 ? 12 : 60;
      n.x = Math.max(padL, Math.min(W - padR, n.x));
      const pad = n.type === "leaf" ? 12 : 24;
      n.y = Math.max(pad + 10, Math.min(H - pad, n.y));
    });
  }

  function render() {
    links.forEach((l) => {
      l.el.setAttribute("x1", l.s.x.toFixed(1));
      l.el.setAttribute("y1", l.s.y.toFixed(1));
      l.el.setAttribute("x2", l.t.x.toFixed(1));
      l.el.setAttribute("y2", l.t.y.toFixed(1));
    });
    nodes.forEach((n) => n.el.setAttribute("transform", `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`));
  }

  function loop() {
    tick();
    render();
    alpha *= 0.992;
    if ((alpha > 0.02 || dragNode) && visible) raf = requestAnimationFrame(loop);
    else raf = null;
  }

  function kick(a = 1) {
    alpha = Math.max(alpha, a);
    if (!raf && visible) raf = requestAnimationFrame(loop);
  }

  function highlight() {
    const set = new Set();
    if (hoverNode) {
      neighbours.get(hoverNode).forEach((n) => set.add(n));
    } else if (selectedGroup) {
      nodes.forEach((n) => { if (n.group === selectedGroup) set.add(n); });
      set.add(root);
    }
    svg.classList.toggle("dim", set.size > 0);
    nodes.forEach((n) => {
      n.el.classList.toggle("hl", set.has(n));
      n.circle.setAttribute("r", set.has(n) && n === hoverNode ? n.r * 1.5 : n.r);
    });
    links.forEach((l) => l.el.classList.toggle("hl", set.has(l.s) && set.has(l.t) && (!hoverNode || l.s === hoverNode || l.t === hoverNode || !selectedGroup)));
  }

  // pointer interaction
  function svgPoint(e) {
    const r = svg.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function nodeFromEvent(e) {
    const g = e.target.closest && e.target.closest(".node");
    return g ? nodes.find((n) => n.el === g) : null;
  }
  function showTip(n, e) {
    if (!n || n.type === "root") { tip.style.opacity = 0; return; }
    const p = svgPoint(e);
    tip.textContent = n.type === "hub" ? `${n.label} · ${SKILLS.find((s) => s.group === n.group).items.length} tools` : `${n.label} · ${n.group}`;
    tip.style.left = Math.min(p.x + 14, W - tip.offsetWidth - 8) + "px";
    tip.style.top = p.y + 14 + "px";
    tip.style.opacity = 1;
  }

  svg.addEventListener("pointerdown", (e) => {
    const n = nodeFromEvent(e);
    if (!n) {
      if (e.pointerType !== "mouse") { hoverNode = null; highlight(); tip.style.opacity = 0; }
      return;
    }
    dragNode = n;
    hoverNode = n;
    highlight();
    showTip(n, e);
    svg.setPointerCapture(e.pointerId);
    kick(0.5);
    if (n.type === "hub" && onSelect) onSelect(n.group, true);
  });
  svg.addEventListener("pointermove", (e) => {
    if (dragNode) {
      const p = svgPoint(e);
      dragNode.x = p.x; dragNode.y = p.y;
      showTip(dragNode, e);
      kick(0.3);
      return;
    }
    const n = nodeFromEvent(e);
    if (n !== hoverNode && e.pointerType === "mouse") {
      hoverNode = n;
      highlight();
    }
    showTip(n, e);
  });
  const release = (e) => {
    dragNode = null;
    if (e.pointerType === "mouse" && !nodeFromEvent(e)) { hoverNode = null; highlight(); tip.style.opacity = 0; }
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);
  svg.addEventListener("pointerleave", () => { if (!dragNode) { hoverNode = null; highlight(); tip.style.opacity = 0; } });

  resize();
  window.addEventListener("resize", resize);
  whenVisible(svg, (vis) => { visible = vis; if (vis) kick(alpha); });

  return {
    select(group) {
      selectedGroup = group;
      hoverNode = null;
      highlight();
    },
  };
}
