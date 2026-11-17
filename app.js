(() => {
"use strict";
gsap.config({ nullTargetWarn: false });
const W = 1920, H = 1080, N = 900, TAU = Math.PI * 2;
const stage = document.getElementById("stage");
const slides = [...document.querySelectorAll(".slide")];
const COUNT = slides.length;
const NOTES = window.NOTES || [];

/* ------------------------------------------------------------------ *
 *  Path builder                                                       *
 * ------------------------------------------------------------------ */
function B() {
  const v = []; let acc = false;
  const last = () => v[v.length - 1];
  const api = {
    v,
    a(on) { acc = on; return api; },
    p(x, y) { v.push([x, y, acc]); return api; },
    q(cx, cy, x, y, steps = 40) {
      const [x0, y0] = last();
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, u = 1 - t;
        v.push([u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y, acc]);
      }
      return api;
    },
    ell(cx, cy, rx, ry, a0, a1, steps, rf, rot = 0) {
      const cr = Math.cos(rot), sr = Math.sin(rot);
      for (let i = 0; i <= steps; i++) {
        const a = a0 + (a1 - a0) * i / steps;
        const r = rf ? rf(a, i / steps) : 1;
        const x = rx * r * Math.cos(a), y = ry * r * Math.sin(a);
        v.push([cx + x * cr - y * sr, cy + x * sr + y * cr, acc]);
      }
      return api;
    },
    rrect(x0, y0, x1, y1, rad, laps = 1.08) {
      // clockwise rounded rectangle starting top-left (after the corner)
      const pts = [];
      const arc = (cx, cy, a0) => { for (let i = 0; i <= 10; i++) { const a = a0 + (Math.PI / 2) * i / 10; pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]); } };
      pts.push([x0 + rad, y0]); pts.push([x1 - rad, y0]); arc(x1 - rad, y0 + rad, -Math.PI / 2);
      pts.push([x1, y1 - rad]); arc(x1 - rad, y1 - rad, 0);
      pts.push([x0 + rad, y1]); arc(x0 + rad, y1 - rad, Math.PI / 2);
      pts.push([x0, y0 + rad]); arc(x0 + rad, y0 + rad, Math.PI);
      const full = pts.length, total = Math.round(full * laps);
      for (let i = 0; i < total; i++) { const [x, y] = pts[i % full]; const d = 1 + (i / full) * 0.012; v.push([x0 + (x - x0) * d - (i / full) * 4, y0 + (y - y0) * d - (i / full) * 3, acc]); }
      return api;
    }
  };
  return api;
}

function resample(v, n) {
  const m = v.length, L = new Float64Array(m);
  for (let i = 1; i < m; i++) L[i] = L[i - 1] + Math.hypot(v[i][0] - v[i - 1][0], v[i][1] - v[i - 1][1]);
  const tot = L[m - 1] || 1;
  const X = new Float32Array(n), Y = new Float32Array(n), A = new Uint8Array(n);
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = tot * k / (n - 1);
    while (j < m - 2 && L[j + 1] < s) j++;
    const seg = L[j + 1] - L[j], t = seg > 0 ? (s - L[j]) / seg : 0;
    X[k] = v[j][0] + (v[j + 1][0] - v[j][0]) * t;
    Y[k] = v[j][1] + (v[j + 1][1] - v[j][1]) * t;
    A[k] = v[j + 1][2] ? 1 : 0;
  }
  return { X, Y, A };
}

/* ------------------------------------------------------------------ *
 *  One thread, sixteen shapes                                         *
 * ------------------------------------------------------------------ */
const bars = (b, base, list, x0 = -60, xEnd = 1800) => {
  b.p(x0, base);
  list.forEach(([l, r, top, acc]) => {
    b.p(l, base); if (acc) b.a(true);
    b.p(l, top).p(r, top).p(r, base); if (acc) b.a(false);
  });
  return b.p(xEnd, base);
};

const SHAPES = [
  /* 01 knot — the compulsion loop, slowly turning */
  { live: true, fn: (t) => {
      const b = B(); const cx = 1545, cy = 445, s = 88, rot = t * 0.16, br = 1 + 0.025 * Math.sin(t * 0.9);
      const pts = [];
      for (let i = 0; i <= 720; i++) {
        const u = i / 720 * TAU;
        const r = 2 + Math.cos(5 * u);
        let x = r * Math.cos(2 * u), y = r * Math.sin(2 * u), z = -Math.sin(5 * u) * 1.1;
        const X = x * Math.cos(rot) + z * Math.sin(rot);
        const Y = y * (0.92 + 0.08 * Math.cos(rot * 0.7)) + z * 0.18 * Math.sin(t * 0.4);
        pts.push([cx + X * s * br, cy + Y * s * br]);
      }
      b.p(2010, -80).q(1900, 120, pts[0][0], pts[0][1], 50);
      pts.forEach(p => b.p(p[0], p[1]));
      return b.v;
  }},
  /* 02 a pen circling the reference figure */
  { fn: () => B().p(2000, 120).q(1880, 300, 1440 + 372 * Math.cos(3.55), 492 + 128 * Math.sin(3.55), 40)
      .ell(1440, 492, 372, 128, 3.55, 3.55 + TAU * 1.86, 420, (a, f) => 1 + 0.03 * Math.sin(a * 2.3) + f * 0.04, -0.03).v },
  /* 03 two circles: a real market vs a theoretical ceiling */
  { fn: () => B().p(-60, 600).p(320, 600)
      .ell(560, 600, 240, 240, Math.PI, Math.PI + TAU * 1.5, 360, (a, f) => 1 + f * 0.035)
      .q(890, 640, 980, 660, 20)
      .ell(1135, 660, 155, 155, Math.PI, Math.PI + TAU * 1.5, 300, (a, f) => 1 + f * 0.045).v },
  /* 04 SAM bars, central scenario in red */
  { fn: () => bars(B(), 900, [[1000, 1200, 660], [1270, 1470, 564, 1], [1540, 1740, 420]]).v },
  /* 05 funnel */
  { fn: () => {
      const L = (y) => 1020 + (y - 360) / 580 * 200, R = (y) => 1780 - (y - 360) / 580 * 200;
      const b = B().p(2010, 230).q(1900, 300, R(360), 360, 20)
        .p(R(940), 940).a(true).p(L(940), 940).a(false).p(L(360), 360).p(R(360), 360)
        .p(R(505), 505).p(L(505), 505).p(L(650), 650).p(R(650), 650).p(R(795), 795).p(L(795), 795);
      return b.v;
  }},
  /* 06 three beads on one string */
  { fn: () => {
      const b = B().p(-60, 382).q(120, 360, 250, 410, 30);
      [250, 790, 1330].forEach((cx, k) => {
        b.ell(cx, 450, 40, 40, -Math.PI / 2, -Math.PI / 2 + TAU * 1.04, 120, (a, f) => 1 + f * 0.08);
        const nx = k < 2 ? [790, 1330][k] : 1800;
        b.q((cx + nx) / 2, 368, nx, k < 2 ? 410 : 395, 50);
      });
      return b.v;
  }},
  /* 07 break-even: two bars short of the red threshold */
  { fn: () => bars(B(), 900, [[1000, 1200, 607], [1270, 1470, 460], [1560, 1760, 409, 1]]).v },
  /* 08 a string of unchecked boxes */
  { fn: () => {
      const b = B().p(-60, 410).q(150, 410, 222, 428, 16);
      for (let i = 0; i < 6; i++) {
        const t = 428 + 92 * i;
        b.p(222, t).p(222, t + 36).p(258, t + 36).p(258, t).p(222, t).p(222, t + 36);
      }
      return b.p(222, 1000).v;
  }},
  /* 09 PESTEL: the table drawn in one stroke */
  { fn: () => B().p(-60, 330).p(1800, 330).p(1800, 960).p(1270, 960).p(1270, 330).p(740, 330).p(740, 960).p(210, 960).p(210, 645).p(1800, 645).v },
  /* 10 ruled rows, underline on our angle */
  { fn: () => {
      const b = B().p(-60, 360);
      const ys = [360, 460, 560, 660, 760, 860];
      ys.forEach((y, i) => { const goR = i % 2 === 0; b.p(goR ? 210 : 1800, y); b.p(goR ? 1800 : 210, y); });
      return b.p(210, 935).a(true).p(1040, 935).v;
  }},
  /* 11 the priority segment, boxed by hand */
  { fn: () => B().p(-60, 395).p(205, 395).rrect(205, 395, 595, 862, 22, 1.06).p(1800, 391).v },
  /* 12 a live voice waveform */
  { live: true, fn: (t) => {
      const b = B().p(-60, 905).p(210, 905);
      for (let i = 0; i <= 520; i++) {
        const x = 210 + i * (620 / 520);
        const f = i / 520;
        const env = Math.pow(Math.abs(Math.sin(x * 0.012 - t * 1.6) * Math.sin(x * 0.0047 + t * 0.9)), 0.8);
        const taper = Math.sin(Math.PI * f);
        const y = 905 + 48 * env * taper * Math.sin(x * 0.42 + t * 11) * (0.6 + 0.4 * Math.sin(x * 0.07 - t * 3));
        b.p(x, y);
      }
      return b.p(870, 905).v;
  }},
  /* 13 column rules of the empty grid */
  { fn: () => B().p(-60, 340).p(540, 340).p(540, 885).p(1020, 885).p(1020, 385).p(1420, 385).a(true).p(1420, 885).a(false).v },
  /* 14 what lifts, what holds back */
  { fn: () => B().p(-60, 445).p(960, 445).q(1005, 445, 1005, 490, 14).p(1005, 870).p(1005, 490).q(1005, 445, 1050, 445, 14).a(true).p(1800, 445).v },
  /* 15 SWOT frame and cross */
  { fn: () => B().p(-60, 290).p(1800, 290).p(1800, 930).p(210, 930).p(210, 290).p(1005, 290).p(1005, 930).p(1005, 610).p(210, 610).p(1800, 610).v },
  /* 16 the knot, undone: a straight line with three small loops */
  { fn: () => {
      const b = B().p(-60, 620);
      [345, 825, 1305].forEach((x0) => {
        b.p(x0 - 20, 620);
        for (let i = 0; i <= 90; i++) {
          const th = i / 90 * TAU;
          b.p(x0 - 20 + th / TAU * 40 - 36 * Math.sin(th), 620 - 34 * (1 - Math.cos(th)));
        }
      });
      return b.p(1800, 620).v;
  }}
];

const cache = SHAPES.map(s => s.live ? null : resample(s.fn(0), N));
const target = (i, t) => SHAPES[i].live ? resample(SHAPES[i].fn(t), N) : cache[i];

/* thread state */
const base = { X: new Float32Array(N), Y: new Float32Array(N), A: new Uint8Array(N) };
for (let i = 0; i < N; i++) { base.X[i] = -120; base.Y[i] = 1180; }
let from = { X: base.X.slice(), Y: base.Y.slice() };
let morphT0 = 0, morphDur = 1.75, shape = 0, morphing = true;
const mouse = { x: -9999, y: -9999 };
const disp = { X: new Float32Array(N), Y: new Float32Array(N) };

const elMain = document.getElementById("t-main"), elAcc = document.getElementById("t-acc"), elSh = document.getElementById("t-shadow");
const elNeedle = document.getElementById("needle"), elRing = document.getElementById("needle-ring");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

function frame(now) {
  const t = now / 1000;
  const tg = target(shape, t);
  let done = true;
  const S = 0.55;
  const p = morphing ? Math.min(1, (t - morphT0) / morphDur) : 1;
  for (let i = 0; i < N; i++) {
    let x = tg.X[i], y = tg.Y[i];
    if (morphing) {
      const d = i / (N - 1);
      let lp = (p * (1 + S) - d * S); lp = lp < 0 ? 0 : lp > 1 ? 1 : lp;
      if (lp < 1) done = false;
      const e = ease(lp);
      const lift = Math.sin(Math.PI * e) * 46 * Math.sin(i * 0.019 + 1.3);
      x = from.X[i] + (x - from.X[i]) * e + lift * 0.35;
      y = from.Y[i] + (y - from.Y[i]) * e + lift;
    }
    base.X[i] = x; base.Y[i] = y; base.A[i] = tg.A[i];
  }
  if (morphing && done) morphing = false;

  // breathe + pluck
  let d = "", da = "", inAcc = false;
  for (let i = 0; i < N; i++) {
    let x = base.X[i], y = base.Y[i];
    if (!reduce) {
      x += Math.sin(t * 1.1 + i * 0.043) * 0.9;
      y += Math.cos(t * 0.9 + i * 0.037) * 1.1;
      const dx = x - mouse.x, dy = y - mouse.y, dist = Math.hypot(dx, dy), R = 130;
      let tx = 0, ty = 0;
      if (dist < R && dist > 0.01) { const f = Math.pow(1 - dist / R, 2) * 26; tx = dx / dist * f; ty = dy / dist * f; }
      disp.X[i] += (tx - disp.X[i]) * 0.12; disp.Y[i] += (ty - disp.Y[i]) * 0.12;
      x += disp.X[i]; y += disp.Y[i];
    }
    const s = x.toFixed(1) + " " + y.toFixed(1);
    d += (i ? "L" : "M") + s;
    if (base.A[i]) { da += (inAcc ? "L" : "M") + s; inAcc = true; } else inAcc = false;
    if (i === N - 1) { elNeedle.setAttribute("cx", x); elNeedle.setAttribute("cy", y); elRing.setAttribute("cx", x); elRing.setAttribute("cy", y); }
  }
  elMain.setAttribute("d", d); elSh.setAttribute("d", d); elAcc.setAttribute("d", da);
  const ph = (t * 0.7) % 1;
  elRing.setAttribute("r", 6 + ph * 16); elRing.style.opacity = (1 - ph) * 0.6;
  requestAnimationFrame(frame);
}

function morphTo(i) {
  from = { X: base.X.slice(), Y: base.Y.slice() };
  shape = i; morphT0 = performance.now() / 1000; morphing = true;
}

/* ------------------------------------------------------------------ *
 *  Static decorations                                                 *
 * ------------------------------------------------------------------ */
const dots = document.getElementById("dots40");
for (let i = 0; i < 40; i++) { const e = document.createElement("i"); if (i === 26) e.className = "hit"; dots.appendChild(e); }
const sq = (id, filled, part) => { const g = document.getElementById(id); for (let i = 0; i < 100; i++) { const e = document.createElement("i"); if (i < filled) e.className = "f"; if (part && i === 0) e.className = "part"; g.appendChild(e); } };
sq("sq11", 11); sq("sq02", 0, true);

/* tally */
const tally = document.getElementById("tally");
function drawTally(n) {
  let s = "", x = 4;
  for (let i = 0; i < n; i++) {
    const inGroup = i % 5;
    if (inGroup === 4) { s += `<path d="M${x - 33} 22 L${x - 1} 7"/>`; x += 12; }
    else { s += `<path d="M${x} 5 L${x + (i % 2 ? 0.6 : -0.4)} 25"/>`; x += 7; }
  }
  tally.innerHTML = s;
}

/* ------------------------------------------------------------------ *
 *  Slide animations                                                   *
 * ------------------------------------------------------------------ */
const fmt = (v, dec) => {
  const s = v.toFixed(dec).split(".");
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return s.join(",");
};
let recTimer = null;

function animIn(sec, idx) {
  const tl = gsap.timeline();
  const lines = sec.querySelectorAll(".ln>span");
  tl.fromTo(lines, { yPercent: 108 }, { yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.09 }, 0.2);
  tl.fromTo(sec.querySelectorAll("[data-f]"), { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.04 }, 0.42);
  sec.querySelectorAll("[data-n]").forEach((el, k) => {
    const to = parseFloat(el.dataset.n), dec = +el.dataset.dec || 0, o = { v: 0 };
    el.textContent = fmt(0, dec);
    const host = el.closest(".num");
    tl.fromTo(host, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.5 + k * 0.12);
    tl.to(o, { v: to, duration: 1.7, ease: "power3.out", onUpdate: () => el.textContent = fmt(o.v, dec) }, 0.55 + k * 0.12);
  });
  tl.fromTo(sec.querySelectorAll(".track>i"), { scaleX: 0 }, { scaleX: (i, el) => +el.dataset.w, duration: 1.3, ease: "expo.out", stagger: 0.12 }, 1.0);
  tl.fromTo(sec.querySelectorAll(".dots i, .sq i"), { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(2)", stagger: { each: 0.008, from: "start" } }, 0.9);
  const thr = sec.querySelector("#thr");
  if (thr) tl.fromTo(thr, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "expo.inOut" }, 1.6);
  const st = sec.querySelector("#strike");
  if (st) { st.classList.remove("go"); tl.call(() => st.classList.add("go"), null, 1.7); }
  if (recTimer) { clearInterval(recTimer); recTimer = null; }
  const rt = sec.querySelector("#rect");
  if (rt) { const t0 = Date.now(); recTimer = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); rt.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }, 250); }
  return tl;
}

let cur = -1, busy = 0;
function go(i) {
  i = Math.max(0, Math.min(COUNT - 1, i));
  if (i === cur) return;
  const prev = slides[cur];
  if (prev) {
    gsap.killTweensOf(prev);
    gsap.to(prev, { autoAlpha: 0, y: -18, duration: 0.42, ease: "power2.in", onComplete: () => { prev.classList.remove("on"); gsap.set(prev, { clearProps: "opacity,visibility,transform" }); } });
  }
  cur = i;
  const sec = slides[i];
  gsap.set(sec, { autoAlpha: 1, y: 0 });
  sec.classList.add("on");
  animIn(sec, i).delay(prev ? 0.22 : 0.1);
  morphTo(i);
  hud();
  history.replaceState(null, "", "#" + (i + 1));
}

const pad = (n) => String(n).padStart(2, "0");
function hud() {
  document.getElementById("count").textContent = pad(cur + 1) + " / " + pad(COUNT);
  const n = NOTES[cur] || {};
  document.getElementById("entry").innerHTML = "Entrée <b>" + pad(cur + 1) + "</b>&nbsp;&nbsp;·&nbsp;&nbsp;" + (n.d || "");
  document.getElementById("src").textContent = slides[cur].dataset.src || "";
  drawTally(cur + 1);
  document.getElementById("nt").textContent = pad(cur + 1) + " — " + (slides[cur].dataset.title || "");
  document.getElementById("nd").textContent = n.d ? "Durée conseillée · " + n.d : "";
  document.getElementById("nb").innerHTML = (n.t || []).map(p => "<p>" + p + "</p>").join("") + (n.todo ? `<p class="todo">[${n.todo}]</p>` : "");
}

/* ------------------------------------------------------------------ *
 *  Layout, input, notes                                               *
 * ------------------------------------------------------------------ */
const notes = document.getElementById("notes");
let scale = 1, offX = 0, offY = 0;
function fit() {
  const nw = notes.classList.contains("open") && innerWidth > 900 ? 440 : 0;
  const aw = innerWidth - nw, ah = innerHeight;
  scale = Math.min(aw / W, ah / H);
  offX = (aw - W * scale) / 2; offY = (ah - H * scale) / 2;
  stage.style.transform = `translate(${offX}px,${offY}px) scale(${scale})`;
}
addEventListener("resize", fit);

addEventListener("pointermove", (e) => { mouse.x = (e.clientX - offX) / scale; mouse.y = (e.clientY - offY) / scale; });
addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

let hintGone = false;
const hint = document.getElementById("hint");
const killHint = () => { if (!hintGone) { hintGone = true; hint.style.opacity = 0; } };
setTimeout(killHint, 7000);

let t0 = null;
const timerEl = document.getElementById("timer");
setInterval(() => { if (t0 == null) return; const s = Math.floor((Date.now() - t0) / 1000); timerEl.textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60); }, 500);
const startTimer = () => { if (t0 == null) t0 = Date.now(); };

function next() { startTimer(); killHint(); go(cur + 1); }
function prev() { killHint(); go(cur - 1); }
document.getElementById("next").addEventListener("click", (e) => { e.stopPropagation(); next(); });
document.getElementById("prev").addEventListener("click", (e) => { e.stopPropagation(); prev(); });

addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (["ArrowRight", "PageDown", " ", "Enter"].includes(k)) { e.preventDefault(); next(); }
  else if (["ArrowLeft", "PageUp", "Backspace"].includes(k)) { e.preventDefault(); prev(); }
  else if (k === "Home") go(0);
  else if (k === "End") go(COUNT - 1);
  else if (k === "n" || k === "N") { notes.classList.toggle("open"); fit(); setTimeout(fit, 520); }
  else if (k === "f" || k === "F") { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); }
  else if (k === "t" || k === "T") { t0 = Date.now(); }
});

let tx = null, ty = null;
addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
addEventListener("touchend", (e) => {
  if (tx == null) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
  tx = null;
}, { passive: true });

/* source checklist */
const ckc = document.getElementById("ckc");
document.querySelectorAll(".crow").forEach((r) => r.addEventListener("click", () => {
  r.classList.toggle("done");
  ckc.textContent = document.querySelectorAll(".crow.done").length;
}));

/* ------------------------------------------------------------------ *
 *  Boot                                                               *
 * ------------------------------------------------------------------ */
fit();
const fontsReady = Promise.all([
  document.fonts.load('300 80px "Newsreader"'), document.fonts.load('italic 300 80px "Newsreader"'),
  document.fonts.load('700 80px "Archivo"'), document.fonts.load('400 14px "Plex"'), document.fonts.load('500 14px "Plex"')
]).catch(() => {});
Promise.race([fontsReady, new Promise(r => setTimeout(r, 2500))]).then(() => {
  const veil = document.getElementById("veil");
  gsap.to(veil, { autoAlpha: 0, duration: 0.6, onComplete: () => veil.remove() });
  const start = parseInt((location.hash || "#1").slice(1), 10);
  go(isNaN(start) ? 0 : start - 1);
  requestAnimationFrame(frame);
});
window.__go = go;
})();
