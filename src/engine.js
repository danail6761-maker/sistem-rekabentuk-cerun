/* =====================================================================
   ENJIN KIRAAN REKABENTUK CERUN
   Unit: m, kN, kPa, darjah. Sistem koordinat: x mendatar (kanan +),
   y ketinggian (atas +). Cerun naik ke kanan; jisim gelincir bergerak
   ke kiri (ke arah kaki cerun).
   ===================================================================== */
(function (root) {
  'use strict';
  const D2R = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- Geometri ---------------- */
  function buildProfile(g) {
    const pts = [];
    let x = 0, y = +g.toeElev || 0;
    pts.push([-(+g.toeExt || 0), y]);
    pts.push([0, y]);
    const faces = [], berms = [];
    const n = g.benches.length;
    g.benches.forEach((b, i) => {
      const h = +b.h, run = h * (+b.n);
      faces.push({ x1: x, y1: y, x2: x + run, y2: y + h, bench: i + 1 });
      x += run; y += h;
      pts.push([x, y]);
      if (i < n - 1 && +b.berm > 0) {
        berms.push({ x1: x, x2: x + (+b.berm), y, bench: i + 1 });
        x += +b.berm;
        pts.push([x, y]);
      }
    });
    const xCrest = x, yCrest = y;
    pts.push([x + (+g.crestExt || 0), y]);
    return { pts, faces, berms, xToe: 0, yToe: +g.toeElev || 0, xCrest, yCrest,
      H: yCrest - (+g.toeElev || 0), xMin: pts[0][0], xMax: pts[pts.length - 1][0] };
  }

  function interp(pts, x) {
    if (!pts || !pts.length) return NaN;
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) {
        const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
        if (x2 === x1) return y2;
        return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
      }
    }
    return pts[pts.length - 1][1];
  }

  /* ---------------- Model ---------------- */
  function buildModel(p) {
    const prof = buildProfile(p.geom);
    const soils = p.soils.map(s => ({ ...s, gamma: +s.gamma, gammaSat: +s.gammaSat,
      c: +s.c, phi: +s.phi, bottom: s.bottom === '' || s.bottom == null ? -1e9 : +s.bottom }));
    // susun dari atas ke bawah
    soils.sort((a, b) => b.bottom - a.bottom);
    soils[soils.length - 1].bottom = -1e9;
    const w = p.water || { mode: 'none' };
    const water = { mode: w.mode, ru: +w.ru || 0, gw: +w.gammaW || 9.81,
      pts: (w.points || []).map(q => [+q[0], +q[1]]).sort((a, b) => a[0] - b[0]) };
    const L = p.loads || {};
    const qx1 = prof.xCrest + (+L.qOffset || 0);
    const load = { q: +L.q || 0, x1: qx1, x2: qx1 + (+L.qWidth || 0), kh: +L.kh || 0 };
    return { p, prof, soils, water, load };
  }

  const ySurf = (m, x) => interp(m.prof.pts, x);
  function yWater(m, x) {
    if (m.water.mode !== 'line' || m.water.pts.length < 2) return -1e9;
    return Math.min(interp(m.water.pts, x), ySurf(m, x));
  }
  function soilAt(m, y) {
    for (const s of m.soils) if (y > s.bottom) return s;
    return m.soils[m.soils.length - 1];
  }

  /* berat lajur (per m lebar) antara yb dan yt, beserta pusat graviti */
  function columnWeight(m, x, yb, yt) {
    const yw = yWater(m, x);
    const brk = [yb, yt];
    m.soils.forEach(s => { if (s.bottom > yb && s.bottom < yt) brk.push(s.bottom); });
    if (yw > yb && yw < yt) brk.push(yw);
    brk.sort((a, b) => a - b);
    let w = 0, my = 0;
    for (let i = 1; i < brk.length; i++) {
      const a = brk[i - 1], b = brk[i];
      if (b - a < 1e-9) continue;
      const mid = (a + b) / 2;
      const s = soilAt(m, mid);
      const g = mid < yw ? s.gammaSat : s.gamma;
      const dw = g * (b - a);
      w += dw; my += dw * mid;
    }
    return { w, yg: w > 0 ? my / w : (yb + yt) / 2 };
  }

  /* ---------------- Bulatan gelincir ---------------- */
  function circleY(xc, yc, R, x) {
    const d = R * R - (x - xc) * (x - xc);
    return d < 0 ? NaN : yc - Math.sqrt(d);
  }

  function findArc(m, xc, yc, R) {
    const a = Math.max(m.prof.xMin, xc - R), b = Math.min(m.prof.xMax, xc + R);
    if (b - a < 0.5) return null;
    const N = 240, dx = (b - a) / N;
    const inside = x => { const yy = circleY(xc, yc, R, x); return !isNaN(yy) && yy < ySurf(m, x) - 1e-6; };
    let best = null, start = null;
    for (let i = 0; i <= N; i++) {
      const x = a + i * dx, ins = inside(x);
      if (ins && start === null) start = i;
      if ((!ins || i === N) && start !== null) {
        const end = ins ? i : i - 1;
        if (!best || end - start > best[1] - best[0]) best = [start, end];
        start = null;
      }
    }
    if (!best) return null;
    // tolak jika jisim keluar dari sempadan model
    if ((best[0] === 0 && xc - R < m.prof.xMin) || (best[1] === N && xc + R > m.prof.xMax)) return null;
    const refine = (xin, xout) => { for (let k = 0; k < 30; k++) { const mid = (xin + xout) / 2; if (inside(mid)) xin = mid; else xout = mid; } return (xin + xout) / 2; };
    const xL = best[0] === 0 ? a : refine(a + best[0] * dx, a + (best[0] - 1) * dx);
    const xR = best[1] === N ? b : refine(a + best[1] * dx, a + (best[1] + 1) * dx);
    return { xL, xR };
  }

  function makeSlices(m, xc, yc, R, xL, xR, n) {
    const b = (xR - xL) / n, sl = [];
    let maxDepth = 0;
    for (let i = 0; i < n; i++) {
      const xm = xL + (i + 0.5) * b;
      const yt = ySurf(m, xm), yb = circleY(xc, yc, R, xm);
      const h = yt - yb;
      if (h > maxDepth) maxDepth = h;
      const col = columnWeight(m, xm, yb, Math.max(yt, yb));
      const w = col.w * b, yg = col.yg; // berat hirisan (kN/m)
      // beban surcaj
      let Q = 0;
      if (m.load.q > 0) {
        const ov = Math.max(0, Math.min(xL + (i + 1) * b, m.load.x2) - Math.max(xL + i * b, m.load.x1));
        Q = m.load.q * ov;
      }
      const alpha = Math.asin(clamp((xm - xc) / R, -1, 1));
      const s = soilAt(m, yb + 1e-6);
      let u = 0;
      if (m.water.mode === 'line') u = m.water.gw * Math.max(0, yWater(m, xm) - yb);
      else if (m.water.mode === 'ru') u = m.water.ru * col.w;
      sl.push({ xm, b, yt, yb, h, W: w + Q, Ws: w, Q, yg, alpha, c: s.c, phi: s.phi, soil: s.name, u, rock: !!s.rock });
    }
    return { slices: sl, maxDepth };
  }

  /* sumbangan paku tanah: pulangkan senarai {T (kN/m), alpha, theta, phi} */
  function nailForces(m, xc, yc, R, xL, xR, nails) {
    if (!nails || !nails.rows) return [];
    const out = [];
    nails.rows.forEach(r => {
      if (r.xh < xL || r.xh > xR) return;
      const th = r.theta * D2R, dx = Math.cos(th), dy = -Math.sin(th);
      const fx = r.xh - xc, fy = r.yh - yc;
      const B = 2 * (fx * dx + fy * dy), C = fx * fx + fy * fy - R * R;
      const disc = B * B - 4 * C;
      if (disc < 0 || C > 0) return; // kepala di luar bulatan
      const t = (-B + Math.sqrt(disc)) / 2;
      if (t <= 0 || t >= r.L) return;
      const Le = r.L - t;
      const xi = r.xh + t * dx, yi = r.yh + t * dy;
      const Tp = Math.PI * nails.Dh * nails.qs * Le / nails.FSp;
      const T = Math.min(nails.Tt, Tp) / nails.Sh;
      const alpha = Math.asin(clamp((xi - xc) / R, -1, 1));
      const s = soilAt(m, yi);
      out.push({ T, alpha, theta: th, phi: s.phi, Le, Tp, xi, yi, row: r.row });
    });
    return out;
  }

  function analyseCircle(m, xc, yc, R, opt) {
    const arc = findArc(m, xc, yc, R);
    if (!arc) return null;
    const { slices, maxDepth } = makeSlices(m, xc, yc, R, arc.xL, arc.xR, opt.nSlices || 30);
    if (maxDepth < (opt.minDepth || 0.3)) return null;
    if (slices.some(s => s.rock)) return null;
    const kh = m.load.kh;
    const nf = opt.nails ? nailForces(m, xc, yc, R, arc.xL, arc.xR, opt.nails) : [];
    const nailTerm = F => nf.reduce((acc, n) => acc + n.T * (Math.cos(n.alpha + n.theta) + Math.sin(n.alpha + n.theta) * Math.tan(n.phi * D2R)), 0);

    // momen penggerak (dibahagi R)
    let Dm = 0;
    slices.forEach(s => { Dm += s.W * Math.sin(s.alpha) + kh * s.Ws * (yc - s.yg) / R; });
    if (Dm <= 1e-6) return null;
    const res = { xc, yc, R, xL: arc.xL, xR: arc.xR, maxDepth, slices, nails: nf, FS: {} };

    // Fellenius (Ordinary Method of Slices)
    let Rf = 0;
    slices.forEach(s => {
      const ca = Math.cos(s.alpha), tp = Math.tan(s.phi * D2R);
      const N = Math.max(0, s.W * ca - kh * s.Ws * Math.sin(s.alpha) - s.u * s.b / ca);
      Rf += s.c * s.b / ca + N * tp;
    });
    res.FS.fellenius = (Rf + nailTerm()) / Dm;

    // Bishop Dipermudah
    let F = Math.max(res.FS.fellenius, 0.3);
    for (let it = 0; it < 100; it++) {
      let num = 0;
      slices.forEach(s => {
        const tp = Math.tan(s.phi * D2R);
        const ma = Math.cos(s.alpha) + Math.sin(s.alpha) * tp / F;
        num += (s.c * s.b + Math.max(0, s.W - s.u * s.b) * tp) / Math.max(ma, 0.2);
      });
      const Fn = (num + nailTerm()) / Dm;
      if (Math.abs(Fn - F) < 1e-5) { F = Fn; break; }
      F = Fn;
    }
    res.FS.bishop = F;

    // Janbu Dipermudah (dengan faktor pembetulan f0)
    let Dh = 0;
    slices.forEach(s => { Dh += s.W * Math.tan(s.alpha) + kh * s.Ws; });
    const chord = Math.hypot(arc.xR - arc.xL, ySurf(m, arc.xR) - ySurf(m, arc.xL));
    const yLc = ySurf(m, arc.xL), yRc = ySurf(m, arc.xR);
    let d = 0;
    slices.forEach(s => {
      const yChord = yLc + (yRc - yLc) * (s.xm - arc.xL) / (arc.xR - arc.xL);
      const dist = (yChord - s.yb) * (arc.xR - arc.xL) / chord;
      if (dist > d) d = dist;
    });
    const anyC = slices.some(s => s.c > 0), anyP = slices.some(s => s.phi > 0);
    const b1 = anyC && anyP ? 0.69 : anyP ? 0.50 : 0.31;
    const f0 = 1 + b1 * (d / chord - 1.4 * Math.pow(d / chord, 2));
    if (Dh > 1e-6) {
      let Fj = Math.max(res.FS.bishop, 0.3);
      for (let it = 0; it < 100; it++) {
        let num = 0;
        slices.forEach(s => {
          const tp = Math.tan(s.phi * D2R), ca = Math.cos(s.alpha);
          const ma = ca + Math.sin(s.alpha) * tp / Fj;
          num += (s.c * s.b + Math.max(0, s.W - s.u * s.b) * tp) / Math.max(ca * ma, 0.15);
        });
        num += nf.reduce((acc, n) => acc + n.T * (Math.cos(n.alpha + n.theta) + Math.sin(n.alpha + n.theta) * Math.tan(n.phi * D2R)) / Math.cos(n.alpha), 0);
        const Fn = f0 * num / Dh;
        if (Math.abs(Fn - Fj) < 1e-5) { Fj = Fn; break; }
        Fj = Fn;
      }
      res.FS.janbu = Fj;
      res.f0 = f0;
    } else res.FS.janbu = NaN;
    return res;
  }

  /* ---------------- Carian bulatan kritikal ---------------- */
  function searchGrid(m, s) {
    const P = m.prof, H = Math.max(P.H, 1);
    const W = Math.max(P.xCrest - P.xToe, 1);
    return {
      x1: s.auto ? P.xToe - 0.3 * W : +s.x1, x2: s.auto ? P.xCrest + 0.15 * W : +s.x2,
      y1: s.auto ? P.yCrest + 0.15 * H : +s.y1, y2: s.auto ? P.yCrest + 1.6 * H : +s.y2,
    };
  }

  function search(m, s, nails, primary) {
    primary = primary || 'bishop';
    const g = searchGrid(m, s);
    const nx = Math.max(3, +s.nx || 12), ny = Math.max(3, +s.ny || 12), nr = Math.max(3, +s.nr || 10);
    const P = m.prof, H = Math.max(P.H, 1);
    const yLow = P.yToe - (+s.depthBelow >= 0 ? +s.depthBelow : 0.5 * H);
    const opt = { nSlices: +s.nSlices || 30, minDepth: +s.minDepth || 0.5, nails };
    const best = {}, trials = [];
    let count = 0;
    const consider = r => {
      count++;
      ['fellenius', 'bishop', 'janbu'].forEach(k => {
        const v = r.FS[k];
        if (isFinite(v) && v > 0 && (!best[k] || v < best[k].FS[k])) best[k] = r;
      });
    };
    const centreMin = [];
    const tryCentre = (xc, yc, nR, record) => {
      let cmin = Infinity;
      const yTopTan = P.yCrest - opt.minDepth * 0.5;
      for (let k = 0; k < nR; k++) {
        const yt = yLow + (yTopTan - yLow) * k / (nR - 1);
        const R = yc - yt;
        if (R <= 0.5) continue;
        const r = analyseCircle(m, xc, yc, R, opt);
        if (!r) continue;
        consider(r);
        if (record) trials.push({ xc, yc, R, F: r.FS[primary] });
        if (r.FS[primary] < cmin) cmin = r.FS[primary];
      }
      return cmin;
    };
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const xc = g.x1 + (g.x2 - g.x1) * i / (nx - 1);
      const yc = g.y1 + (g.y2 - g.y1) * j / (ny - 1);
      const f = tryCentre(xc, yc, nr, true);
      centreMin.push({ xc, yc, F: f });
    }
    // perhalusan di sekitar pusat terbaik
    let dx = (g.x2 - g.x1) / (nx - 1), dy = (g.y2 - g.y1) / (ny - 1);
    for (let pass = 0; pass < 2 && best[primary]; pass++) {
      const c = best[primary];
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        tryCentre(c.xc + i * dx / 3, c.yc + j * dy / 3, nr * 2, false);
      }
      dx /= 3; dy /= 3;
    }
    trials.sort((a, b) => a.F - b.F);
    return { best, grid: g, centreMin, top: trials.slice(0, 12), count };
  }

  /* ---------------- Paku tanah ---------------- */
  function nailLayout(m, nl) {
    if (!nl || !nl.enabled) return null;
    const P = m.prof;
    const rows = [];
    const Sv = Math.max(0.5, +nl.Sv), y0 = P.yCrest - (+nl.firstDepth || Sv / 2);
    let row = 0;
    for (let y = y0; y > P.yToe + 0.3; y -= Sv) {
      const f = P.faces.find(f => y >= f.y1 - 1e-6 && y <= f.y2 + 1e-6);
      if (!f) continue;
      const xh = f.x1 + (f.x2 - f.x1) * (y - f.y1) / (f.y2 - f.y1);
      rows.push({ row: ++row, xh, yh: y, L: +nl.L, theta: +nl.theta, bench: f.bench });
    }
    const dEff = Math.max(0, +nl.barDia - 2 * (+nl.corrosion || 0));
    const As = Math.PI * dEff * dEff / 4; // mm2
    const Tult = (+nl.fy) * As / 1000; // kN
    return { rows, As, Tult, Tt: Tult / (+nl.FSt), Dh: (+nl.holeDia) / 1000, qs: +nl.qs,
      FSp: +nl.FSp, Sh: +nl.Sh, dEff };
  }

  /* ---------------- Cerun tak terhingga ---------------- */
  function infiniteFS(o, z) {
    const b = o.beta * D2R, gw = o.gammaW || 9.81;
    const m = clamp(+o.m, 0, 1);
    const g = (1 - m) * o.gamma + m * o.gammaSat;
    const W = g * z;
    const u = m * z * gw * Math.cos(b) ** 2;
    const N = W * Math.cos(b) ** 2 - u - (o.kh || 0) * W * Math.sin(b) * Math.cos(b);
    const Tq = W * Math.sin(b) * Math.cos(b) + (o.kh || 0) * W * Math.cos(b) ** 2;
    return (o.c + Math.max(0, N) * Math.tan(o.phi * D2R)) / Tq;
  }
  function infiniteAnalysis(o) {
    o = { ...o, beta: +o.beta, z: +o.z, c: +o.c, phi: +o.phi, gamma: +o.gamma, gammaSat: +o.gammaSat, m: +o.m, kh: +o.kh || 0 };
    const FS = infiniteFS(o, o.z);
    const curve = [];
    const zMax = Math.max(o.z * 2, 3);
    for (let i = 1; i <= 40; i++) { const z = zMax * i / 40; curve.push([z, infiniteFS(o, z)]); }
    // sudut cerun maksimum bagi FOS sasaran (pembahagian dua)
    let lo = 1, hi = 89, betaMax = null;
    const target = +o.target || 1.4;
    if (infiniteFS({ ...o, beta: lo }, o.z) >= target) {
      for (let k = 0; k < 50; k++) { const mid = (lo + hi) / 2; if (infiniteFS({ ...o, beta: mid }, o.z) >= target) lo = mid; else hi = mid; }
      betaMax = lo;
    }
    return { FS, curve, betaMax, target };
  }

  /* ---------------- Kerja tanah ---------------- */
  function earthworks(m, e, nl) {
    const P = m.prof;
    const ex = (e.existing || []).map(q => [+q[0], +q[1]]).sort((a, b) => a[0] - b[0]);
    let cut = 0, fill = 0;
    if (ex.length >= 2) {
      const a = Math.max(ex[0][0], P.xMin), b = Math.min(ex[ex.length - 1][0], P.xMax);
      const N = 2000, dx = (b - a) / N;
      for (let i = 0; i < N; i++) {
        const x = a + (i + 0.5) * dx, d = interp(ex, x) - ySurf(m, x);
        if (d > 0) cut += d * dx; else fill -= d * dx;
      }
    }
    const Lr = +e.length || 0;
    let faceLen = 0;
    P.faces.forEach(f => { faceLen += Math.hypot(f.x2 - f.x1, f.y2 - f.y1); });
    const bermW = P.berms.reduce((a, b) => a + (b.x2 - b.x1), 0);
    const q = {
      cutArea: cut, fillArea: fill, cutVol: cut * Lr, fillVol: fill * Lr,
      fillVolLoose: fill * Lr * (+e.fillFactor || 1),
      faceLen, faceArea: faceLen * Lr, bermArea: bermW * Lr,
      bermDrain: P.berms.length * Lr, crestDrain: Lr, toeDrain: Lr,
    };
    if (nl && nl.rows) {
      const perRow = Math.floor(Lr / nl.Sh) + 1;
      q.nailCount = perRow * nl.rows.length;
      q.nailLength = q.nailCount * (nl.rows[0] ? nl.rows[0].L : 0);
    }
    return q;
  }

  /* ---------------- Semakan geometri (amalan lazim) ---------------- */
  function geometryChecks(m, rules) {
    const out = [];
    m.p.geom.benches.forEach((b, i) => {
      const ang = Math.atan(1 / (+b.n)) / D2R;
      out.push({ item: `Tingkat ${i + 1}: tinggi ${(+b.h).toFixed(1)} m`, ok: +b.h <= +rules.maxBench, rule: `≤ ${rules.maxBench} m` });
      out.push({ item: `Tingkat ${i + 1}: kecerunan 1V:${(+b.n).toFixed(2)}H (${ang.toFixed(1)}°)`, ok: +b.n >= +rules.minN - 1e-9, rule: `≥ 1V:${rules.minN}H` });
      if (i < m.p.geom.benches.length - 1) out.push({ item: `Berm ${i + 1}: lebar ${(+b.berm).toFixed(1)} m`, ok: +b.berm >= +rules.minBerm, rule: `≥ ${rules.minBerm} m` });
    });
    return out;
  }

  function requiredFS(c) {
    const t = c.table;
    return Math.max(+t.life[c.life], +t.econ[c.econ]);
  }

  function runAll(p) {
    const m = buildModel(p);
    const nl = nailLayout(m, p.nails);
    const primary = p.methods.primary || 'bishop';
    const unrein = search(m, p.search, null, primary);
    let rein = null;
    if (nl && nl.rows.length) rein = search(m, p.search, nl, primary);
    // semakan paku di permukaan kritikal (tanpa paku)
    let nailCheck = null;
    if (nl && unrein.best[primary]) {
      const c = unrein.best[primary];
      const hit = nailForces(m, c.xc, c.yc, c.R, c.xL, c.xR, nl);
      nailCheck = nl.rows.map(r => {
        const h = hit.find(z => z.row === r.row);
        return { ...r, Le: h ? h.Le : null, Tp: h ? h.Tp : null, Tt: nl.Tt,
          Td: h ? Math.min(nl.Tt, h.Tp) : null };
      });
    }
    const inf = infiniteAnalysis(p.infinite);
    const ew = earthworks(m, p.earth, nl);
    const geo = geometryChecks(m, p.rules);
    const req = requiredFS(p.criteria);
    return { m, nl, unrein, rein, nailCheck, inf, ew, geo, req, primary };
  }

  const API = { buildProfile, buildModel, interp, ySurf, yWater, soilAt, analyseCircle, search,
    nailLayout, nailForces, infiniteAnalysis, infiniteFS, earthworks, geometryChecks, requiredFS, runAll, findArc };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.SlopeEngine = API;
})(this);
