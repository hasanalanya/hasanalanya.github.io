/* =====================================================================
   3D globe (three.js / WebGL)
   Dotted continents, atmosphere, light beacons on each city and
   animated flight arcs between them. The page drives it with
   overview() and focus(i).
   ===================================================================== */
import * as THREE from "three";

export const PLACES = [
  { city: "Istanbul", country: "Türkiye", code: "TR", iso: "792", lat: 41.0082, lon: 28.9784, years: "2014–2019" },
  { city: "Stockholm", country: "Sweden", code: "SE", iso: "752", lat: 59.3293, lon: 18.0686, years: "2019–2021" },
  { city: "New Haven", country: "United States", code: "US", iso: "840", lat: 41.3083, lon: -72.9279, years: "2022–2025" },
  { city: "Birmingham", country: "United Kingdom", code: "GB", iso: "826", lat: 52.4862, lon: -1.8904, years: "2025–now" },
];
const EXTRA = [{ city: "Houston", note: "Presented · SNO 2024", lat: 29.7604, lon: -95.3698 }];

const RAD = Math.PI / 180;
const ACCENT = new THREE.Color("#ff4d3d");
const WARM = new THREE.Color("#ffb38a");

/* lat / lon (degrees) → point on a sphere. lon 0 faces +z, east is +x. */
function ll(lat, lon, r = 1) {
  const a = lat * RAD, o = lon * RAD;
  return new THREE.Vector3(r * Math.cos(a) * Math.sin(o), r * Math.sin(a), r * Math.cos(a) * Math.cos(o));
}
function slerp(a, b, t) {
  const ang = a.angleTo(b), s = Math.sin(ang);
  if (s < 1e-6) return a.clone();
  return a.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(b.clone().multiplyScalar(Math.sin(t * ang) / s));
}
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export function createGlobe({ view, canvas, labels, hud }) {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  const world = new THREE.Group(); // everything that turns with the Earth
  scene.add(world);

  let W = 1, H = 1, visible = true, raf = 0;
  const S = { lon: -18, lat: 24, dist: 4.2, offX: 0, offY: 0, active: -1, legs: 3, dragging: false, lastUser: -1e9, px: 0, py: 0, sx: 0, sy: 0 };
  let tween = null;
  const legT = [0, 0, 0];

  /* ---------- stars ---------- */
  {
    const n = 1400, pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 40);
      pos.set([v.x, v.y, v.z], i * 3); seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uPR: { value: 1 } },
      vertexShader: `attribute float aSeed; uniform float uTime; uniform float uPR; varying float vA;
        void main(){ vA = 0.25 + 0.55 * (0.5 + 0.5 * sin(uTime * (0.4 + aSeed) + aSeed * 40.0)) * aSeed;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = (0.8 + aSeed * 1.6) * uPR; }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
          gl_FragColor = vec4(0.86, 0.88, 1.0, vA * smoothstep(0.5, 0.1, d)); }`,
    });
    const stars = new THREE.Points(g, m); stars.name = "stars"; scene.add(stars);
  }

  /* ---------- solid sphere + atmosphere ---------- */
  const NV = `varying vec3 vN; varying vec3 vV;
    void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv; }`;
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), new THREE.ShaderMaterial({
    vertexShader: NV,
    fragmentShader: `varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.6);
        float l = max(dot(vN, normalize(vec3(-0.55, 0.65, 0.55))), 0.0);
        vec3 c = vec3(0.030, 0.034, 0.048) + l * vec3(0.030, 0.032, 0.045) + vec3(0.85, 0.26, 0.17) * f * 0.42;
        gl_FragColor = vec4(c, 1.0); }`,
  })));
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: NV,
    fragmentShader: `varying vec3 vN; varying vec3 vV;
      void main(){ float g = clamp(-dot(vN, vec3(0.0, 0.0, 1.0)) / 0.57, 0.0, 1.0);
        float i = pow(g, 2.4) * 0.42;
        gl_FragColor = vec4(mix(vec3(1.0, 0.30, 0.20), vec3(1.0, 0.62, 0.42), g) * i, i); }`,
  }));
  atmo.scale.setScalar(1.22); scene.add(atmo);

  /* ---------- graticule ---------- */
  {
    const p = [];
    for (let lat = -60; lat <= 60; lat += 30) for (let lon = -180; lon < 180; lon += 4) { p.push(ll(lat, lon, 1.001), ll(lat, lon + 4, 1.001)); }
    for (let lon = -180; lon < 180; lon += 30) for (let lat = -84; lat < 84; lat += 4) { p.push(ll(lat, lon, 1.001), ll(lat + 4, lon, 1.001)); }
    const g = new THREE.BufferGeometry().setFromPoints(p);
    world.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.045 })));
  }

  /* ---------- land dots (rasterise world-atlas once) ---------- */
  const dotMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uSize: { value: 1 }, uAccent: { value: ACCENT } },
    vertexShader: `attribute float aHi; attribute float aSeed; uniform float uSize; uniform float uTime;
      varying float vHi; varying float vF; varying float vTw;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normalize(position));
        vF = dot(n, normalize(-mv.xyz)); vHi = aHi;
        vTw = 0.75 + 0.25 * sin(uTime * (0.8 + aSeed * 1.4) + aSeed * 60.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (1.0 + aHi * 0.5) / -mv.z; }`,
    fragmentShader: `uniform vec3 uAccent; varying float vHi; varying float vF; varying float vTw;
      void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5 || vF < 0.0) discard;
        float edge = smoothstep(0.5, 0.32, d);
        float fade = smoothstep(0.0, 0.45, vF);
        vec3 c = mix(vec3(0.56, 0.60, 0.70), uAccent * 1.15, vHi);
        float a = mix(0.42, 0.95 * vTw, vHi) * (0.25 + 0.75 * fade);
        gl_FragColor = vec4(c, a * edge); }`,
  });
  async function loadDots() {
    try {
      const topo = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json").then((r) => r.json());
      const feats = window.topojson.feature(topo, topo.objects.countries).features;
      const RW = 2048, RH = 1024, off = document.createElement("canvas");
      off.width = RW; off.height = RH;
      const o = off.getContext("2d", { willReadFrequently: true });
      const lived = new Set(PLACES.map((p) => p.iso));
      const X = (lon) => ((lon + 180) / 360) * RW, Y = (lat) => ((90 - lat) / 180) * RH;
      feats.forEach((f) => {
        const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
        o.beginPath();
        polys.forEach((poly) => poly.forEach((ring) => {
          ring.forEach(([lon, lat], i) => (i ? o.lineTo(X(lon), Y(lat)) : o.moveTo(X(lon), Y(lat))));
          o.closePath();
        }));
        o.fillStyle = lived.has(String(f.id)) ? "rgb(255,255,0)" : "rgb(255,0,0)";
        o.fill("evenodd");
      });
      const px = o.getImageData(0, 0, RW, RH).data;
      const step = Math.min(innerWidth, innerHeight) < 600 ? 1.15 : 0.82;
      const pos = [], hi = [], seed = [];
      for (let lat = -86; lat <= 86; lat += step) {
        const n = Math.max(1, Math.round((360 * Math.cos(lat * RAD)) / step));
        for (let i = 0; i < n; i++) {
          const lon = -180 + (i + 0.5) * (360 / n);
          const k = (Math.min(RH - 1, Math.floor(Y(lat))) * RW + Math.min(RW - 1, Math.floor(X(lon)))) * 4;
          if (px[k] < 128) continue;
          const h = px[k + 1] > 128 ? 1 : 0, v = ll(lat, lon, h ? 1.008 : 1.003);
          pos.push(v.x, v.y, v.z); hi.push(h); seed.push(Math.random());
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("aHi", new THREE.Float32BufferAttribute(hi, 1));
      g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
      world.add(new THREE.Points(g, dotMat));
    } catch (e) { /* offline: the globe still shows cities, beacons and arcs */ }
  }

  /* ---------- flight arcs ---------- */
  const arcs = [];
  for (let k = 0; k < PLACES.length - 1; k++) {
    const a = ll(PLACES[k].lat, PLACES[k].lon), b = ll(PLACES[k + 1].lat, PLACES[k + 1].lon);
    const hmax = 0.07 + 0.26 * Math.min(1, a.angleTo(b) / 1.6), pts = [];
    for (let i = 0; i <= 64; i++) { const t = i / 64; pts.push(slerp(a, b, t).multiplyScalar(1.004 + hmax * Math.sin(Math.PI * t))); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const uni = { uProgress: { value: 0 }, uTime: { value: 0 }, uDim: { value: 1 }, uColor: { value: ACCENT }, uHot: { value: WARM }, uGlow: { value: 0 } };
    const mk = (radius, glow) => new THREE.Mesh(new THREE.TubeGeometry(curve, 160, radius, 8, false), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { ...uni, uGlow: { value: glow } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uProgress; uniform float uTime; uniform float uDim; uniform float uGlow; uniform vec3 uColor; uniform vec3 uHot; varying vec2 vUv;
        void main(){ if (vUv.x > uProgress) discard;
          float head = smoothstep(uProgress - 0.10, uProgress, vUv.x) * (1.0 - step(0.999, uProgress));
          float p = fract(uTime * 0.16); float pulse = smoothstep(0.09, 0.0, abs(vUv.x - p)) * step(0.999, uProgress);
          vec3 c = mix(uColor, uHot, clamp(head + pulse, 0.0, 1.0));
          float a = mix(0.9, 0.16, uGlow) * uDim * (1.0 + (head + pulse) * mix(0.6, 2.2, uGlow));
          gl_FragColor = vec4(c * a, a); }`,
    }));
    const core = mk(0.0042, 0), glow = mk(0.016, 1);
    core.material.uniforms.uProgress = glow.material.uniforms.uProgress = uni.uProgress;
    core.material.uniforms.uTime = glow.material.uniforms.uTime = uni.uTime;
    core.material.uniforms.uDim = glow.material.uniforms.uDim = uni.uDim;
    world.add(core, glow); arcs.push(uni);
  }

  /* ---------- city beacons ---------- */
  const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1);
  const beacons = PLACES.map((p, i) => {
    const n = ll(p.lat, p.lon), u = { uTime: { value: 0 }, uOn: { value: 0.5 }, uColor: { value: ACCENT }, uHot: { value: WARM }, uPhase: { value: i * 0.27 } };
    const beamG = new THREE.CylinderGeometry(0.0015, 0.011, 1, 16, 1, true); beamG.translate(0, 0.5, 0);
    const beam = new THREE.Mesh(beamG, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: u,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uOn; uniform vec3 uColor; uniform vec3 uHot; varying vec2 vUv;
        void main(){ float a = pow(1.0 - vUv.y, 1.8) * (0.25 + 0.75 * uOn); gl_FragColor = vec4(mix(uColor, uHot, 1.0 - vUv.y) * a, a); }`,
    }));
    beam.quaternion.setFromUnitVectors(UP, n); beam.position.copy(n).multiplyScalar(1.004);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: u,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uTime; uniform float uOn; uniform float uPhase; uniform vec3 uColor; uniform vec3 uHot; varying vec2 vUv;
        void main(){ float r = length(vUv - 0.5) * 2.0;
          float t = fract(uTime * 0.45 + uPhase);
          float wave = smoothstep(0.05, 0.0, abs(r - t)) * (1.0 - t) * uOn;
          float core = smoothstep(0.10, 0.05, r);
          float halo = smoothstep(0.30, 0.0, r) * 0.35 * (0.4 + 0.6 * uOn);
          float a = clamp(wave * 0.9 + core + halo, 0.0, 1.0);
          gl_FragColor = vec4(mix(uColor, uHot, core) * a, a); }`,
    }));
    ring.quaternion.setFromUnitVectors(FWD, n); ring.position.copy(n).multiplyScalar(1.006);
    world.add(beam, ring);
    return { n, u, beam, h: 0.1 };
  });
  const extras = EXTRA.map((e) => {
    const n = ll(e.lat, e.lon);
    const m = new THREE.Mesh(new THREE.RingGeometry(0.012, 0.017, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    m.quaternion.setFromUnitVectors(FWD, n); m.position.copy(n).multiplyScalar(1.006); world.add(m);
    return { n, e };
  });

  /* ---------- HTML labels ---------- */
  const mkLabel = (cls, html) => { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; labels.appendChild(d); return d; };
  const cityEls = PLACES.map((p) => mkLabel("glabel", `<b>${p.city}</b><span>${p.code} · ${p.years}</span>`));
  const extraEls = EXTRA.map((e) => mkLabel("glabel glabel--minor", `<b>${e.city}</b><span>${e.note}</span>`));
  const tmp = new THREE.Vector3(), tmpN = new THREE.Vector3();
  function place(el, n, lift, show) {
    tmp.copy(n).multiplyScalar(lift).applyMatrix4(world.matrixWorld);
    tmpN.copy(n).applyQuaternion(world.quaternion);
    const facing = tmpN.dot(tmp.clone().sub(camera.position).normalize().negate());
    tmp.project(camera);
    const x = (tmp.x * 0.5 + 0.5) * W, y = (-tmp.y * 0.5 + 0.5) * H;
    const on = show && facing > 0.18 && x > (W >= 900 && S.active >= 0 ? W * 0.44 : -40) && x < W + 40;
    el.style.opacity = on ? Math.min(1, (facing - 0.18) * 4) : 0;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    el.classList.toggle("is-left", x > (W >= 900 ? W - 170 : W * 0.62));
  }

  /* ---------- layout: how far away the camera sits, where the globe sits ---------- */
  function layout(focus) {
    const aspect = W / H, wide = W >= 900;
    const d = (kH, kW) => Math.max(2 / (kH * 0.6306), 1 / (kW * 0.3153 * aspect));
    if (wide) return focus ? { dist: d(1.16, 0.62), offX: 0.215, offY: 0.0 } : { dist: d(0.84, 0.47), offX: 0.21, offY: -0.015 };
    return focus ? { dist: d(0.9, 1.5), offX: 0, offY: 0.2 } : { dist: d(0.5, 1.02), offX: 0, offY: 0.2 };
  }
  function flyTo(lat, lon, focus, dur = 1700) {
    const L = layout(focus), dl = ((lon - S.lon + 540) % 360) - 180;
    tween = { t0: performance.now(), dur: RM ? 1 : dur, lon0: S.lon, dl, lat0: S.lat, lat1: lat, d0: S.dist, d1: L.dist, x0: S.offX, x1: L.offX, y0: S.offY, y1: L.offY };
  }

  /* ---------- frame ---------- */
  function frame(now) {
    const t = now / 1000;
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.dur), e = ease(k);
      S.lon = tween.lon0 + tween.dl * e; S.lat = tween.lat0 + (tween.lat1 - tween.lat0) * e;
      // pull back a little mid-flight so long hops read as travel
      const hop = Math.min(1, Math.abs(tween.dl) / 70) * 0.55 * Math.sin(Math.PI * k);
      S.dist = tween.d0 + (tween.d1 - tween.d0) * e + hop;
      S.offX = tween.x0 + (tween.x1 - tween.x0) * e; S.offY = tween.y0 + (tween.y1 - tween.y0) * e;
      if (k >= 1) tween = null;
    } else if (S.active < 0 && !S.dragging && now - S.lastUser > 2500 && !RM) {
      S.lon = ((S.lon + 0.045 + 540) % 360) - 180;
    }
    S.sx += (S.px - S.sx) * 0.05; S.sy += (S.py - S.sy) * 0.05;
    world.rotation.set((S.lat + S.sy * 3) * RAD, -(S.lon - S.sx * 4) * RAD, 0);
    camera.position.set(0, 0, S.dist); camera.lookAt(0, 0, 0);
    camera.setViewOffset(W, H, -S.offX * W, S.offY * H, W, H);
    scene.getObjectByName("stars").rotation.y = -S.lon * RAD * 0.25 + t * 0.004;

    for (let k = 0; k < arcs.length; k++) {
      const target = k < S.legs ? 1 : 0;
      if (legT[k] < target) legT[k] = Math.min(1, legT[k] + (RM ? 1 : 0.011));
      else if (legT[k] > target) legT[k] = Math.max(0, legT[k] - 0.06);
      arcs[k].uProgress.value = legT[k]; arcs[k].uTime.value = t + k * 1.7;
      const dim = S.active < 0 || k + 1 === S.active ? 1 : 0.4;
      arcs[k].uDim.value += (dim - arcs[k].uDim.value) * 0.08;
    }
    beacons.forEach((b, i) => {
      const on = S.active < 0 ? 0.55 : i === S.active ? 1 : i < S.active ? 0.3 : 0.08;
      b.u.uOn.value += (on - b.u.uOn.value) * 0.07; b.u.uTime.value = t;
      const h = S.active < 0 ? 0.13 : i === S.active ? 0.2 : 0.07;
      b.h += (h - b.h) * 0.07; b.beam.scale.set(1, b.h, 1);
    });
    dotMat.uniforms.uTime.value = t;
    scene.getObjectByName("stars").material.uniforms.uTime.value = t;

    world.updateMatrixWorld(); camera.updateMatrixWorld();
    PLACES.forEach((p, i) => {
      cityEls[i].classList.toggle("is-on", i === S.active);
      place(cityEls[i], beacons[i].n, 1.02, S.active < 0 || i <= S.active);
    });
    extras.forEach((x, i) => place(extraEls[i], x.n, 1.02, S.active === 2));

    if (hud) {
      const lon = ((S.lon + 540) % 360) - 180;
      hud.textContent = `${Math.abs(S.lat).toFixed(2)}° ${S.lat >= 0 ? "N" : "S"}   ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "E" : "W"}`;
    }
    renderer.render(scene, camera);
    if (visible) raf = requestAnimationFrame(frame);
  }

  function resize() {
    W = view.clientWidth; H = view.clientHeight;
    const pr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    dotMat.uniforms.uSize.value = H * pr * 0.0125;
    scene.getObjectByName("stars").material.uniforms.uPR.value = pr;
    const L = layout(S.active >= 0);
    if (!tween) { S.dist = L.dist; S.offX = L.offX; S.offY = L.offY; }
  }

  /* ---------- pointer: drag to rotate, gentle parallax ---------- */
  let x0 = 0, y0 = 0;
  canvas.addEventListener("pointerdown", (e) => { S.dragging = true; tween = null; x0 = e.clientX; y0 = e.clientY; canvas.setPointerCapture(e.pointerId); canvas.classList.add("is-grabbing"); });
  canvas.addEventListener("pointermove", (e) => {
    if (!S.dragging) return;
    const k = (S.dist - 1) * 22 / H * 3.2;
    S.lon = ((S.lon - (e.clientX - x0) * k + 540) % 360) - 180;
    S.lat = Math.max(-60, Math.min(75, S.lat + (e.clientY - y0) * k));
    x0 = e.clientX; y0 = e.clientY;
  });
  const up = () => { S.dragging = false; S.lastUser = performance.now(); canvas.classList.remove("is-grabbing"); };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  if (!RM && matchMedia("(hover: hover)").matches) {
    addEventListener("pointermove", (e) => { S.px = e.clientX / innerWidth - 0.5; S.py = e.clientY / innerHeight - 0.5; }, { passive: true });
  }

  resize();
  addEventListener("resize", resize);
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(frame);
  }).observe(view);
  raf = requestAnimationFrame(frame);
  loadDots();

  return {
    overview() { S.active = -1; S.legs = 3; flyTo(33, -22, false, 1800); },
    focus(i) { S.active = i; S.legs = i; flyTo(PLACES[i].lat - 13, PLACES[i].lon, true); },
  };
}
