/* =====================================================================
   Dotted 3D globe (canvas, orthographic projection done by hand).
   d3-geo is only used once, to rasterise the world map into dots.
   ===================================================================== */

const PLACES = [
  { city: "Istanbul", country: "Türkiye", code: "TR", iso: "792", lat: 41.0082, lon: 28.9784, years: "2014–2019", tags: ["Studied", "Researched"] },
  { city: "Stockholm", country: "Sweden", code: "SE", iso: "752", lat: 59.3293, lon: 18.0686, years: "2019–2021", tags: ["Studied", "Researched"] },
  { city: "New Haven", country: "United States", code: "US", iso: "840", lat: 41.3083, lon: -72.9279, years: "2022–2025", tags: ["Worked"] },
  { city: "Birmingham", country: "United Kingdom", code: "GB", iso: "826", lat: 52.4862, lon: -1.8904, years: "2025–now", tags: ["PhD", "Fellowship"] },
];
const EXTRA = [{ city: "Houston", lat: 29.7604, lon: -95.3698, note: "Presented · SNO 2024" }];

function createGlobe(canvas, hud) {
  const ctx = canvas.getContext("2d");
  const RAD = Math.PI / 180;
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const S = { lon: 10, lat: 22, auto: true, active: -1, legs: 0, legT: [0, 0, 0], dragging: false, lastUser: 0 };
  let W = 0, H = 0, dpr = 1, R = 0, cx = 0, cy = 0, dots = null, raf, tween = null, visible = true;
  const col = { dot: "#1c1e24", hi: "#d62839", rim: "#e4e4e0", label: "#0e0f12", sub: "#8b8f98", bg: "#f6f6f4" };

  /* ---- build the dot field from world-atlas (land + lived-in countries) ---- */
  async function loadDots() {
    try {
      const topo = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json").then((r) => r.json());
      const countries = topojson.feature(topo, topo.objects.countries);
      const RW = 1440, RH = 720, off = document.createElement("canvas");
      off.width = RW; off.height = RH;
      const o = off.getContext("2d", { willReadFrequently: true });
      const proj = d3.geoEquirectangular().scale(RW / (2 * Math.PI)).translate([RW / 2, RH / 2]);
      const path = d3.geoPath(proj, o);
      const lived = new Set(PLACES.map((p) => p.iso));
      countries.features.forEach((f) => {
        o.beginPath(); path(f);
        o.fillStyle = lived.has(String(f.id)) ? "rgb(255,255,0)" : "rgb(255,0,0)";
        o.fill();
      });
      const px = o.getImageData(0, 0, RW, RH).data;
      const pts = [];
      const step = W < 500 ? 1.8 : 1.3;
      for (let lat = -84; lat <= 84; lat += step) {
        const n = Math.max(1, Math.round((360 * Math.cos(lat * RAD)) / step));
        for (let i = 0; i < n; i++) {
          const lon = -180 + (i + 0.5) * (360 / n);
          const x = Math.min(RW - 1, Math.floor(((lon + 180) / 360) * RW)), y = Math.min(RH - 1, Math.floor(((90 - lat) / 180) * RH));
          const k = (y * RW + x) * 4;
          if (px[k] > 128) pts.push(lat, lon, px[k + 1] > 128 ? 1 : 0);
        }
      }
      const n = pts.length / 3;
      dots = { n, sl: new Float32Array(n), cl: new Float32Array(n), so: new Float32Array(n), co: new Float32Array(n), hi: new Uint8Array(n) };
      for (let i = 0; i < n; i++) {
        const la = pts[i * 3] * RAD, lo = pts[i * 3 + 1] * RAD;
        dots.sl[i] = Math.sin(la); dots.cl[i] = Math.cos(la); dots.so[i] = Math.sin(lo); dots.co[i] = Math.cos(lo); dots.hi[i] = pts[i * 3 + 2];
      }
    } catch (e) {
      dots = null; // offline: globe still shows sphere, arcs and cities
    }
  }

  /* ---- projection helpers ---- */
  function view() {
    const l0 = S.lon * RAD, p0 = S.lat * RAD;
    return { sL: Math.sin(l0), cL: Math.cos(l0), sP: Math.sin(p0), cP: Math.cos(p0) };
  }
  function proj(lat, lon, v, lift = 0) {
    const la = lat * RAD, lo = lon * RAD, cl = Math.cos(la), sl = Math.sin(la);
    const cd = Math.cos(lo) * v.cL + Math.sin(lo) * v.sL, sd = Math.sin(lo) * v.cL - Math.cos(lo) * v.sL; // cos/sin(lon - lon0)
    const x = cl * sd, y = v.cP * sl - v.sP * cl * cd, z = v.sP * sl + v.cP * cl * cd;
    const k = R * (1 + lift);
    return { x: cx + x * k, y: cy - y * k, z, r2: (x * x + y * y) * (1 + lift) * (1 + lift) };
  }
  function interp(a, b, t) { // great-circle interpolation
    const la1 = a.lat * RAD, lo1 = a.lon * RAD, la2 = b.lat * RAD, lo2 = b.lon * RAD;
    const d = 2 * Math.asin(Math.sqrt(Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2));
    const A = Math.sin((1 - t) * d) / Math.sin(d), B = Math.sin(t * d) / Math.sin(d);
    const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
    const y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
    const z = A * Math.sin(la1) + B * Math.sin(la2);
    return { lat: Math.atan2(z, Math.sqrt(x * x + y * y)) / RAD, lon: Math.atan2(y, x) / RAD, d };
  }

  /* ---- drawing ---- */
  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const v = view();

    // sphere
    const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#ececea");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    ctx.strokeStyle = col.rim; ctx.lineWidth = 1; ctx.stroke();

    // dots
    if (dots) {
      const s = Math.max(1.1, R / 210);
      for (let i = 0; i < dots.n; i++) {
        const cd = dots.co[i] * v.cL + dots.so[i] * v.sL;
        const z = v.sP * dots.sl[i] + v.cP * dots.cl[i] * cd;
        if (z <= 0.02) continue;
        const sd = dots.so[i] * v.cL - dots.co[i] * v.sL;
        const x = cx + dots.cl[i] * sd * R, y = cy - (v.cP * dots.sl[i] - v.sP * dots.cl[i] * cd) * R;
        if (dots.hi[i]) { ctx.globalAlpha = 0.35 + 0.65 * z; ctx.fillStyle = col.hi; ctx.fillRect(x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2); }
        else { ctx.globalAlpha = 0.1 + 0.42 * z; ctx.fillStyle = col.dot; ctx.fillRect(x - s / 2, y - s / 2, s, s); }
      }
      ctx.globalAlpha = 1;
    }

    // arcs between consecutive places (raised great circles)
    for (let k = 0; k < 3; k++) {
      const t = S.legT[k];
      if (t <= 0) continue;
      const a = PLACES[k], b = PLACES[k + 1], steps = 80;
      const hmax = 0.08 + 0.22 * Math.min(1, interp(a, b, 0.5).d / 1.6);
      ctx.strokeStyle = col.hi; ctx.lineWidth = Math.max(1.4, R / 200); ctx.lineCap = "round";
      ctx.beginPath(); let pen = false;
      for (let i = 0; i <= steps * t; i++) {
        const s = i / steps, p = interp(a, b, s), q = proj(p.lat, p.lon, v, hmax * Math.sin(Math.PI * s));
        const vis = q.z > 0 || q.r2 > 1;
        if (vis) { pen ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); pen = true; } else pen = false;
      }
      ctx.globalAlpha = k + 1 === S.legs || S.active < 0 ? 1 : 0.55;
      ctx.stroke(); ctx.globalAlpha = 1;
      // travelling head
      if (t < 1) {
        const p = interp(a, b, t), q = proj(p.lat, p.lon, v, hmax * Math.sin(Math.PI * t));
        if (q.z > 0 || q.r2 > 1) { ctx.fillStyle = col.hi; ctx.beginPath(); ctx.arc(q.x, q.y, 3.4, 0, 7); ctx.fill(); }
      }
    }

    // secondary markers
    EXTRA.forEach((e) => {
      const q = proj(e.lat, e.lon, v);
      if (q.z <= 0.05) return;
      ctx.globalAlpha = 0.3 + 0.7 * q.z;
      ctx.strokeStyle = col.label; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(q.x, q.y - 4); ctx.lineTo(q.x + 4, q.y); ctx.lineTo(q.x, q.y + 4); ctx.lineTo(q.x - 4, q.y); ctx.closePath(); ctx.stroke();
      if (S.active < 0 || S.active === 2) { ctx.font = "500 11px Geist, Inter, sans-serif"; ctx.fillStyle = col.sub; ctx.fillText(e.city, q.x + 8, q.y + 4); }
      ctx.globalAlpha = 1;
    });

    // city markers + labels
    const pulse = (now / 1400) % 1;
    PLACES.forEach((p, i) => {
      const q = proj(p.lat, p.lon, v);
      if (q.z <= 0.04) return;
      const on = i === S.active, seen = S.active < 0 || i <= S.active;
      ctx.globalAlpha = (seen ? 1 : 0.35) * (0.35 + 0.65 * q.z);
      if (on && !RM) {
        ctx.strokeStyle = col.hi; ctx.lineWidth = 1.5; ctx.globalAlpha *= 1 - pulse;
        ctx.beginPath(); ctx.arc(q.x, q.y, 6 + pulse * 18, 0, 7); ctx.stroke();
        ctx.globalAlpha = 0.35 + 0.65 * q.z;
      }
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(q.x, q.y, on ? 6.5 : 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = col.hi; ctx.beginPath(); ctx.arc(q.x, q.y, on ? 4 : 2.8, 0, 7); ctx.fill();
      if (seen) {
        ctx.font = `${on ? 600 : 500} ${on ? 15 : 12.5}px Geist, Inter, sans-serif`;
        // labels sit to the right unless they would run off the globe
        const left = q.x + 12 + ctx.measureText(p.city).width > cx + R * 0.97;
        ctx.textAlign = left ? "right" : "left";
        const lx = q.x + (left ? -12 : 12);
        ctx.lineWidth = 4; ctx.strokeStyle = "rgba(246,246,244,.92)"; ctx.lineJoin = "round";
        ctx.strokeText(p.city, lx, q.y + 1); ctx.fillStyle = col.label; ctx.fillText(p.city, lx, q.y + 1);
        if (on) {
          ctx.font = "500 11px 'Geist Mono', ui-monospace, monospace";
          const sub = `${p.code} · ${p.years}`;
          ctx.strokeText(sub, lx, q.y + 17); ctx.fillStyle = col.sub; ctx.fillText(sub, lx, q.y + 17);
        }
        ctx.textAlign = "left";
      }
      ctx.globalAlpha = 1;
    });

    if (hud) {
      const ns = S.lat >= 0 ? "N" : "S", ew = S.lon >= 0 ? "E" : "W";
      hud.textContent = `${Math.abs(S.lat).toFixed(2)}° ${ns}  ${Math.abs(((S.lon + 540) % 360) - 180).toFixed(2)}° ${ew}`;
    }
  }

  function frame(now) {
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      S.lon = tween.lon0 + tween.dl * e; S.lat = tween.lat0 + (tween.lat1 - tween.lat0) * e;
      if (k >= 1) tween = null;
    } else if (S.auto && !S.dragging && now - S.lastUser > 2500 && !RM) {
      S.lon = ((S.lon + 0.06 + 180) % 360) - 180;
    }
    // grow arcs
    for (let k = 0; k < 3; k++) {
      const target = k < S.legs ? 1 : 0;
      if (S.legT[k] < target) S.legT[k] = Math.min(1, S.legT[k] + (RM ? 1 : 0.012));
      else if (S.legT[k] > target) S.legT[k] = Math.max(0, S.legT[k] - 0.05);
    }
    draw(now);
    if (visible) raf = requestAnimationFrame(frame);
  }

  function flyTo(lat, lon, dur = 1500) {
    const dl = ((lon - S.lon + 540) % 360) - 180; // shortest way round
    tween = { t0: performance.now(), dur: RM ? 1 : dur, lon0: S.lon, dl, lat0: S.lat, lat1: Math.max(-50, Math.min(55, lat * 0.8)) };
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(W, H) * 0.42; cx = W / 2; cy = H / 2;
  }

  // drag to rotate
  let px0 = 0, py0 = 0;
  canvas.addEventListener("pointerdown", (e) => { S.dragging = true; tween = null; px0 = e.clientX; py0 = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!S.dragging) return;
    const k = 180 / (Math.PI * R);
    S.lon = ((S.lon - (e.clientX - px0) * k + 540) % 360) - 180;
    S.lat = Math.max(-70, Math.min(70, S.lat + (e.clientY - py0) * k));
    px0 = e.clientX; py0 = e.clientY;
  });
  const up = () => { S.dragging = false; S.lastUser = performance.now(); };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);

  resize();
  addEventListener("resize", resize);
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
  }).observe(canvas);
  loadDots();

  return {
    overview() { S.active = -1; S.legs = 3; S.auto = true; flyTo(44, -26, 1600); },
    focus(i) { S.active = i; S.legs = i; S.auto = false; flyTo(PLACES[i].lat, PLACES[i].lon); },
  };
}
