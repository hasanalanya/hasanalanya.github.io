/* =====================================================================
   Skill space: a 3D network of every tool, grouped by area.
   Drag to orbit, hover a node to name it, click to focus its area.
   ===================================================================== */
import * as THREE from "three";

function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function fib(i, n) { // evenly spread directions on a sphere
  const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
  return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
}

export function createSkillSpace({ wrap, canvas, labels, tip, groups, onSelect }) {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100), world = new THREE.Group();
  scene.add(world);
  const rnd = mulberry32(7);

  /* ---------- layout ---------- */
  const nodes = [{ kind: "core", g: -1, name: "Hasan", pos: new THREE.Vector3(), color: new THREE.Color("#ffffff"), size: 44 }];
  const segs = [];
  groups.forEach((grp, gi) => {
    const dir = fib(gi, groups.length), hub = dir.clone().multiplyScalar(1.62), col = new THREE.Color(grp.color);
    const hubNode = { kind: "hub", g: gi, name: grp.group, pos: hub, color: col, size: 31 };
    nodes.push(hubNode); segs.push([nodes[0], hubNode, gi]);
    const spin = new THREE.Quaternion().setFromAxisAngle(dir, rnd() * 6.28), tilt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    grp.items.forEach((name, k) => {
      // items sit on the outer half of a small shell around the hub
      const f = fib(k, grp.items.length * 2);
      const local = new THREE.Vector3(f.x, Math.abs(f.y) * 0.9 + 0.1, f.z).normalize().applyQuaternion(tilt).applyQuaternion(spin);
      const node = { kind: "item", g: gi, name, pos: hub.clone().add(local.multiplyScalar(0.56 + rnd() * 0.2)), color: col, size: 15.5 };
      nodes.push(node); segs.push([hubNode, node, gi]);
    });
  });

  /* ---------- nodes ---------- */
  const N = nodes.length, pos = new Float32Array(N * 3), colr = new Float32Array(N * 3), size = new Float32Array(N), grpA = new Float32Array(N), seed = new Float32Array(N);
  nodes.forEach((n, i) => { pos.set([n.pos.x, n.pos.y, n.pos.z], i * 3); colr.set([n.color.r, n.color.g, n.color.b], i * 3); size[i] = n.size; grpA[i] = n.g; seed[i] = rnd(); });
  const ng = new THREE.BufferGeometry();
  ng.setAttribute("position", new THREE.BufferAttribute(pos, 3)); ng.setAttribute("aColor", new THREE.BufferAttribute(colr, 3));
  ng.setAttribute("aSize", new THREE.BufferAttribute(size, 1)); ng.setAttribute("aGroup", new THREE.BufferAttribute(grpA, 1)); ng.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const U = { uActive: { value: -1 }, uTime: { value: 0 }, uScale: { value: 1 }, uDist: { value: 7 } };
  const nodeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: U,
    vertexShader: `attribute vec3 aColor; attribute float aSize; attribute float aGroup; attribute float aSeed;
      uniform float uActive; uniform float uTime; uniform float uScale; uniform float uDist; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float on = (uActive < -0.5 || abs(aGroup - uActive) < 0.5) ? 1.0 : (aGroup < -0.5 ? 0.3 : 0.0);
        vC = aColor; vA = mix(0.16, 1.0, on) * (0.3 + 0.7 * smoothstep(-(uDist + 2.4), -(uDist - 0.8), mv.z));
        float breathe = 1.0 + 0.08 * sin(uTime * (0.9 + aSeed) + aSeed * 30.0);
        gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uScale * breathe * mix(0.8, 1.15, on) * 6.0 / -mv.z; }`,
    fragmentShader: `varying vec3 vC; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard;
        float core = smoothstep(0.52, 0.40, d), halo = pow(1.0 - d, 2.2) * 0.55;
        gl_FragColor = vec4(mix(vC, vec3(1.0), core * 0.35), (core + halo) * vA); }`,
  });
  world.add(new THREE.Points(ng, nodeMat));

  /* ---------- edges ---------- */
  const lp = new Float32Array(segs.length * 6), lc = new Float32Array(segs.length * 6), lg = new Float32Array(segs.length * 2);
  segs.forEach(([a, b, g], i) => {
    lp.set([a.pos.x, a.pos.y, a.pos.z, b.pos.x, b.pos.y, b.pos.z], i * 6);
    lc.set([b.color.r, b.color.g, b.color.b, b.color.r, b.color.g, b.color.b], i * 6); lg.set([g, g], i * 2);
  });
  const eg = new THREE.BufferGeometry();
  eg.setAttribute("position", new THREE.BufferAttribute(lp, 3)); eg.setAttribute("aColor", new THREE.BufferAttribute(lc, 3)); eg.setAttribute("aGroup", new THREE.BufferAttribute(lg, 1));
  world.add(new THREE.LineSegments(eg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: U,
    vertexShader: `attribute vec3 aColor; attribute float aGroup; uniform float uActive; uniform float uDist; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vC = aColor;
        vA = ((uActive < -0.5) ? 0.42 : (abs(aGroup - uActive) < 0.5 ? 0.62 : 0.05)) * (0.3 + 0.7 * smoothstep(-(uDist + 2.4), -(uDist - 0.8), mv.z));
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ gl_FragColor = vec4(vC, vA); }`,
  })));

  /* ---------- dust for depth ---------- */
  {
    const n = 260, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(1 + rnd() * 3.4); p.set([v.x, v.y, v.z], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    world.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.012, transparent: true, opacity: 0.35, depthWrite: false })));
  }

  /* ---------- labels ---------- */
  const els = nodes.map((n) => {
    const d = document.createElement("div");
    d.className = `slabel slabel--${n.kind}`; d.textContent = n.kind === "core" ? "" : n.name;
    if (n.kind === "hub") d.style.setProperty("--c", "#" + n.color.getHexString());
    labels.appendChild(d); return d;
  });

  /* ---------- state ---------- */
  let W = 1, H = 1, visible = false, raf = 0, active = -1, hover = -1, dist = 6.4, distT = 6.4, dragging = false, moved = 0, lastUser = -1e9;
  const qT = new THREE.Quaternion(), vel = { x: 0, y: 0 };
  let seeking = false;
  world.quaternion.setFromEuler(new THREE.Euler(0.35, -0.5, 0)); qT.copy(world.quaternion);
  const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), q1 = new THREE.Quaternion(), v = new THREE.Vector3();
  const screen = nodes.map(() => ({ x: 0, y: 0, z: 0 }));
  const baseDist = () => 2.36 / (Math.tan((20 * Math.PI) / 180) * Math.min(1, W / H));

  function rotate(dx, dy) {
    q1.setFromAxisAngle(AY, dx); world.quaternion.premultiply(q1);
    q1.setFromAxisAngle(AX, dy); world.quaternion.premultiply(q1);
  }
  function select(g, fromUser = true) {
    active = g === active ? -1 : g; U.uActive.value = active;
    if (active >= 0) {
      // turn the chosen hub to face the viewer, slightly right of centre
      const hub = nodes.find((n) => n.kind === "hub" && n.g === active).pos.clone().normalize();
      qT.setFromUnitVectors(hub, (W >= 700 ? new THREE.Vector3(0.34, 0.16, 1) : new THREE.Vector3(-0.08, 0.14, 1)).normalize()); seeking = true; distT = baseDist() * 0.74;
    } else { distT = baseDist(); seeking = false; }
    if (fromUser) lastUser = performance.now();
    onSelect(active);
  }

  function frame(now) {
    const t = now / 1000;
    if (seeking) { world.quaternion.slerp(qT, RM ? 1 : 0.07); if (world.quaternion.angleTo(qT) < 0.002) seeking = false; }
    else if (!dragging) {
      if (Math.abs(vel.x) + Math.abs(vel.y) > 0.0002) { rotate(vel.x, vel.y); vel.x *= 0.94; vel.y *= 0.94; }
      else if (!RM && active < 0 && now - lastUser > 1800) rotate(0.0016, 0);
      else if (!RM && active >= 0 && now - lastUser > 1800) rotate(Math.sin(t * 0.5) * 0.0006, 0);
    }
    dist += (distT - dist) * (RM ? 1 : 0.07);
    camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
    U.uTime.value = t; U.uDist.value = dist;
    world.updateMatrixWorld(); camera.updateMatrixWorld();

    nodes.forEach((n, i) => {
      v.copy(n.pos).applyMatrix4(world.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
      const z = v.z; v.applyMatrix4(camera.projectionMatrix);
      const s = screen[i]; s.x = (v.x * 0.5 + 0.5) * W; s.y = (-v.y * 0.5 + 0.5) * H; s.z = z;
      const el = els[i]; if (n.kind === "core") return;
      const depth = Math.max(0, Math.min(1, (z + dist + 2.2) / 3.4)); // 0 far … 1 near
      let o = 0;
      if (n.kind === "hub") o = active < 0 ? 0.35 + 0.65 * depth : n.g === active ? 1 : 0.16;
      else o = n.g === active ? 0.55 + 0.45 * depth : i === hover ? 1 : active < 0 && W >= 700 ? Math.max(0, (depth - 0.78) / 0.22) * 0.7 : 0;
      el.style.opacity = o.toFixed(2);
      if (o > 0.01) { el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`; el.classList.toggle("is-left", s.x > W - (n.kind === "hub" ? 190 : 120)); }
      el.classList.toggle("is-on", n.kind === "hub" && n.g === active);
    });
    renderer.render(scene, camera);
    if (visible) raf = requestAnimationFrame(frame);
  }

  function resize() {
    W = wrap.clientWidth; H = wrap.clientHeight;
    const pr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    U.uScale.value = (H / 560) * pr;
    distT = baseDist() * (active >= 0 ? 0.74 : 1); dist = distT;
  }

  /* ---------- pointer ---------- */
  function pick(e) {
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = -1, bd = 22 * 22;
    screen.forEach((s, i) => {
      if (nodes[i].kind === "core") return;
      const d = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    return { best, x, y };
  }
  let x0 = 0, y0 = 0;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; moved = 0; seeking = false; x0 = e.clientX; y0 = e.clientY; vel.x = vel.y = 0; canvas.setPointerCapture(e.pointerId); canvas.classList.add("is-grabbing"); });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) {
      const dx = (e.clientX - x0) * 0.006, dy = (e.clientY - y0) * 0.006;
      moved += Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0);
      rotate(dx, dy); vel.x = dx; vel.y = dy; x0 = e.clientX; y0 = e.clientY; lastUser = performance.now();
      tip.classList.remove("is-on"); return;
    }
    const { best, x, y } = pick(e);
    hover = best; canvas.style.cursor = best >= 0 ? "pointer" : "";
    if (best >= 0) {
      const n = nodes[best];
      tip.innerHTML = n.kind === "hub" ? `<b>${n.name}</b><span>${groups[n.g].items.length} tools · click to focus</span>` : `<b>${n.name}</b><span>${groups[n.g].group}</span>`;
      tip.style.transform = `translate3d(${Math.min(W - 190, x + 14)}px, ${y + 14}px, 0)`; tip.classList.add("is-on");
    } else tip.classList.remove("is-on");
  });
  const up = (e) => {
    if (!dragging) return;
    dragging = false; canvas.classList.remove("is-grabbing"); lastUser = performance.now();
    if (moved < 6) { const { best } = pick(e); if (best >= 0) { if (nodes[best].g !== active) select(nodes[best].g); } else if (active >= 0) select(active); }
  };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", () => { dragging = false; });
  canvas.addEventListener("pointerleave", () => { hover = -1; tip.classList.remove("is-on"); });

  resize();
  addEventListener("resize", resize);
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting; cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(frame);
  }).observe(wrap);

  return { select: (g) => select(g), total: N - 1 - groups.length };
}
