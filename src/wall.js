/* =====================================================================
   ENJIN REKABENTUK TEMBOK PENAHAN
   Unit: m, kN, kPa, darjah (input), per meter panjang tembok.
   Koordinat: kaki (toe) tembok di (0,0); tanah ditahan di sebelah kanan (+x);
   y ke atas. Momen lawan jam (CCW) positif = momen menterbalikkan.
   ===================================================================== */
(function (root) {
  'use strict';
  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;

  /* ---------------- Geometri asas ---------------- */
  function rotCW(p, a) { // putar ikut jam sekitar asalan (tembok condong ke belakang)
    const c = Math.cos(a), s = Math.sin(a);
    return [p[0] * c + p[1] * s, -p[0] * s + p[1] * c];
  }
  function polyProps(pts) {
    let A = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      const cr = x1 * y2 - x2 * y1;
      A += cr; cx += (x1 + x2) * cr; cy += (y1 + y2) * cr;
    }
    A /= 2;
    if (Math.abs(A) < 1e-12) return { A: 0, cx: 0, cy: 0 };
    return { A: Math.abs(A), cx: cx / (6 * A), cy: cy / (6 * A) };
  }

  /* ---------------- Pekali tekanan tanah ---------------- */
  // Kaedah baji cuba-jaya Coulomb (aktif), muka belakang condong ω dari tegak
  // (+ = atas muka condong ke arah tanah), geseran dinding δ, cerun timbus β,
  // pekali seismik mendatar kh. Pulangkan K berdasarkan tinggi tegak muka.
  function wedgeK(phiDeg, deltaDeg, omegaDeg, betaDeg, kh) {
    const phi = phiDeg * D2R, d = deltaDeg * D2R, w = omegaDeg * D2R, b = betaDeg * D2R;
    kh = kh || 0;
    const A = [0, 0], B = [Math.tan(w), 1];
    const lo = Math.max(phiDeg, betaDeg) + 0.01, hi = Math.min(90 - omegaDeg, 179) - 0.01;
    if (hi <= lo) return NaN;
    const P = rhoDeg => {
      const r = rhoDeg * D2R;
      // persilangan satah gagal dari A dengan permukaan tanah dari B
      const a11 = Math.cos(r), a12 = -Math.cos(b), a21 = Math.sin(r), a22 = -Math.sin(b);
      const det = a11 * a22 - a12 * a21;
      if (Math.abs(det) < 1e-12) return -Infinity;
      const s = ((B[0] - A[0]) * a22 - a12 * (B[1] - A[1])) / det;
      if (s <= 0) return -Infinity;
      const C = [s * Math.cos(r), s * Math.sin(r)];
      const W = polyProps([A, B, C]).A; // γ = 1
      const x = r - phi;
      const den = Math.cos(x - (d - w));
      if (den <= 1e-9) return -Infinity;
      return W * (kh * Math.cos(x) + Math.sin(x)) / den;
    };
    let best = -Infinity, bestR = lo;
    for (let r = lo; r <= hi; r += 0.1) { const v = P(r); if (v > best) { best = v; bestR = r; } }
    let a = Math.max(lo, bestR - 0.1), c = Math.min(hi, bestR + 0.1);
    for (let k = 0; k < 60; k++) { // carian keratan emas
      const m1 = a + (c - a) * 0.382, m2 = a + (c - a) * 0.618;
      if (P(m1) > P(m2)) c = m2; else a = m1;
    }
    const v = P((a + c) / 2);
    if (!isFinite(v) || v <= 0) return NaN;
    return { K: 2 * Math.max(v, best), rho: (a + c) / 2 };
  }
  const rankineKa = phi => (1 - Math.sin(phi * D2R)) / (1 + Math.sin(phi * D2R));
  const rankineKp = phi => (1 + Math.sin(phi * D2R)) / (1 - Math.sin(phi * D2R));
  // Bentuk tertutup Coulomb (untuk semakan)
  function coulombKa(phi, delta, omega, beta) {
    const f = phi * D2R, d = delta * D2R, t = -omega * D2R, b = beta * D2R; // t: sudut muka dari tegak (Das)
    const num = Math.cos(f - t) ** 2;
    const s = Math.sqrt(Math.sin(f + d) * Math.sin(f - b) / (Math.cos(d + t) * Math.cos(t - b)));
    return num / (Math.cos(t) ** 2 * Math.cos(d + t) * (1 + s) ** 2);
  }

  /* Taburan tekanan pada muka (tinggi tegak dari yA ke yB) */
  function faceThrust(K, yA, yB, omega, soil, yW, q, gw) {
    const Hf = yB - yA, N = 200, dz = Hf / N;
    let Ps = 0, Ms = 0, Pq = 0, Mq = 0, Pw = 0, Mw = 0;
    const prof = [];
    for (let i = 0; i < N; i++) {
      const z = (i + 0.5) * dz, y = yB - z;
      const zw = Math.max(0, yB - yW); // kedalaman aras air dari atas muka
      const sv = soil.gamma * Math.min(z, zw) + (soil.gammaSat - gw) * Math.max(0, z - zw);
      const u = y < yW ? gw * (yW - y) : 0;
      const ss = K * sv, sq = K * q;
      Ps += ss * dz; Ms += ss * dz * y; Pq += sq * dz; Mq += sq * dz * y; Pw += u * dz; Mw += u * dz * y;
      if (i % 10 === 0 || i === N - 1) prof.push({ y, s: ss + sq, u });
    }
    return { Ps, ys: Ps ? Ms / Ps : yA + Hf / 3, Pq, yq: Pq ? Mq / Pq : yA + Hf / 2, Pw, yw: Pw ? Mw / Pw : yA, prof, Hf };
  }

  /* ---------------- Geometri setiap jenis tembok ---------------- */
  // Setiap pembina pulangkan:
  // polys: [{pts, gamma, kind:'wall'|'soil', name}], face:{A,B} (muka tekanan), omega (darjah),
  // delta (darjah), base:{heel:[x,y]} (kaki di 0,0), extra
  function geomTrap(t, H) { // graviti / batu-batan / crib
    const Bb = +t.Bbase, Bt = +t.Btop, nf = +t.nf;
    const pts = [[0, 0], [Bb, 0], [nf * H + Bt, H], [nf * H, H]];
    return { pts, Bb, Bt, nf, H, backTop: [nf * H + Bt, H] };
  }
  function buildWall(w) {
    const T = w.type, bf = w.backfill;
    const dRatio = +bf.deltaRatio;
    if (T === 'gravity' || T === 'rubble' || T === 'crib') {
      const t = w[T], H = +t.H;
      const g = geomTrap(t, H);
      const omega = Math.atan((g.backTop[0] - g.Bb) / H) * R2D;
      return { type: T, H, polys: [{ pts: g.pts, gamma: +t.gamma, kind: 'wall', name: 'Badan tembok' }],
        face: { A: [g.Bb, 0], B: g.backTop }, omega, delta: dRatio * bf.phi, heel: [g.Bb, 0], trap: g };
    }
    if (T === 'gabion') {
      const t = w.gabion, a = (+t.tilt || 0) * D2R;
      const L = t.layers.map(l => ({ w: +l.w, h: +l.h }));
      const w0 = L[0].w, gam = (+t.gammaRock) * (1 - (+t.porosity));
      let y = 0; const polys = [];
      L.forEach((l, i) => {
        const x0 = w0 - l.w;
        const pts = [[x0, y], [w0, y], [w0, y + l.h], [x0, y + l.h]].map(p => rotCW(p, a));
        polys.push({ pts, gamma: gam, kind: 'wall', name: `Lapis gabion ${i + 1}` , layer: i });
        y += l.h;
      });
      const H = y;
      const A = rotCW([w0, 0], a), B = rotCW([w0, H], a);
      return { type: T, H, polys, face: { A, B }, omega: (+t.tilt || 0), delta: dRatio * bf.phi, heel: A, tilt: a, gam, layers: L, w0 };
    }
    if (T === 'rc') {
      const t = w.rc, H = +t.H, tb = +t.tb, toe = +t.toe, heel = +t.heel, tt = +t.tTop, tbo = +t.tBot;
      const B = toe + tbo + heel, beta = bf.beta * D2R;
      const xsb = toe + tbo, xst = toe + tt; // belakang batang di bawah / atas
      const yTopSoil = H + (B - xst) * Math.tan(beta);
      const polys = [
        { pts: [[0, 0], [B, 0], [B, tb], [0, tb]], gamma: +t.gammaC, kind: 'wall', name: 'Tapak (base)' },
        { pts: [[toe, tb], [xsb, tb], [xst, H], [toe, H]], gamma: +t.gammaC, kind: 'wall', name: 'Batang (stem)' },
        { pts: [[xsb, tb], [B, tb], [B, yTopSoil], [xst, H]], gamma: +bf.gamma, kind: 'soil', name: 'Tanah atas tumit' },
      ];
      return { type: T, H, polys, face: { A: [B, 0], B: [B, yTopSoil] }, omega: 0, delta: bf.beta, heel: [B, 0], B, tb, toe, heelL: heel, tt, tbo, xsb, xst };
    }
    if (T === 'mse') {
      const t = w.mse, H = +t.H, L = +t.L, beta = bf.beta * D2R;
      const yTop = H + L * Math.tan(beta);
      const polys = [{ pts: [[0, 0], [L, 0], [L, yTop], [0, H]], gamma: +t.gammaR, kind: 'wall', name: 'Blok tanah bertetulang' }];
      return { type: T, H, polys, face: { A: [L, 0], B: [L, yTop] }, omega: 0, delta: bf.beta, heel: [L, 0], L };
    }
    return null;
  }

  /* ---------------- Kestabilan luaran ---------------- */
  function bearingEC7(phiDeg, c, gamma, q0, Bp, V, Hh) {
    const f = phiDeg * D2R;
    const Nq = f > 0 ? Math.exp(Math.PI * Math.tan(f)) * Math.tan(Math.PI / 4 + f / 2) ** 2 : 1;
    const Nc = f > 0 ? (Nq - 1) / Math.tan(f) : Math.PI + 2;
    const Ng = 2 * (Nq - 1) * Math.tan(f);
    const m = 2; // jalur
    const denom = V + Bp * c * (f > 0 ? 1 / Math.tan(f) : 0);
    const r = denom > 0 ? Math.max(0, 1 - Hh / denom) : 0;
    const iq = r ** m, ig = r ** (m + 1);
    const ic = f > 0 ? iq - (1 - iq) / (Nc * Math.tan(f)) : 1 - m * Hh / (Bp * c * Nc || 1);
    const qult = c * Nc * Math.max(ic, 0) + q0 * Nq * iq + 0.5 * gamma * Bp * Ng * ig;
    return { Nq, Nc, Ng, iq, ig, ic, qult };
  }

  function checkWall(g, w, opt) {
    opt = opt || {};
    const bf = w.backfill, fd = w.found, gw = 9.81;
    const kh = opt.kh != null ? opt.kh : (+w.loads.kh || 0);
    const q = opt.q != null ? opt.q : (+w.loads.q || 0);
    const heel = g.heel, Bx = heel[0], By = heel[1];
    const Bw = Math.hypot(Bx, By), alpha = Math.atan2(-By, Bx); // sudut tapak (tumit lebih rendah = +)
    const tx = Math.cos(alpha), ty = -Math.sin(alpha), nx = Math.sin(alpha), ny = Math.cos(alpha);
    const items = []; // {name, Fx, Fy, x, y, M}
    // momen dipecah kepada komponen mendatar (-y·Fx) dan tegak (x·Fy) supaya Ph·y dan Pv·x dikelaskan berasingan
    const add = (name, Fx, Fy, x, y, cat) => items.push({ name, Fx, Fy, x, y, M: x * Fy - y * Fx, Mh: -y * Fx, Mv: x * Fy, cat });
    let Wwall = 0;
    g.polys.forEach(p => {
      const pp = polyProps(p.pts), W = pp.A * p.gamma;
      add(p.name, 0, -W, pp.cx, pp.cy, p.kind);
      if (p.kind === 'wall') Wwall += W;
      if (kh > 0 && p.kind === 'wall') add('Inersia seismik: ' + p.name, -kh * W, 0, pp.cx, pp.cy, 'seismic');
    });
    // tekanan tanah
    const Kres = wedgeK(+bf.phi, +g.delta, +g.omega, +bf.beta, kh);
    const K = Kres && Kres.K;
    const yW = opt.noWater ? -1e9 : (+w.water.hw > 0 ? g.face.A[1] + (+w.water.hw) : -1e9);
    const T = faceThrust(K, g.face.A[1], g.face.B[1], g.omega * D2R, { gamma: +bf.gamma, gammaSat: +bf.gammaSat }, yW, q, gw);
    const ang = (g.delta - g.omega) * D2R; // sudut daya di bawah ufuk
    const om = g.omega * D2R;
    const xAt = y => g.face.A[0] + (y - g.face.A[1]) * Math.tan(om);
    add('Tekanan tanah aktif', -T.Ps * Math.cos(ang), -T.Ps * Math.sin(ang), xAt(T.ys), T.ys, 'earth');
    if (T.Pq > 0) add('Tekanan surcaj', -T.Pq * Math.cos(ang), -T.Pq * Math.sin(ang), xAt(T.yq), T.yq, 'surcharge');
    if (T.Pw > 0) add('Tekanan air (belakang)', -T.Pw, T.Pw * Math.tan(om), xAt(T.yw), T.yw, 'water');
    // daya angkat
    if (!opt.noWater) {
      const uh = Math.max(0, gw * (yW - By)), ut = Math.max(0, gw * (+w.water.hwf || 0));
      if (uh + ut > 0) {
        const U = (uh + ut) / 2 * Bw, s = Bw * (ut + 2 * uh) / (3 * (ut + uh));
        add('Daya angkat (uplift)', U * nx, U * ny, s * tx, s * ty, 'water');
      }
    }
    const Fx = items.reduce((a, i) => a + i.Fx, 0), Fy = items.reduce((a, i) => a + i.Fy, 0);
    const Mt = items.reduce((a, i) => a + i.M, 0);
    const comps = items.flatMap(i => [i.Mh, i.Mv]);
    const Mo = comps.filter(m => m > 0).reduce((a, m) => a + m, 0);
    const Mr = -comps.filter(m => m < 0).reduce((a, m) => a + m, 0);
    const N = -(Fx * nx + Fy * ny);          // daya normal ke tapak
    const Tsl = -Fx * tx - Fy * ty;           // daya gelongsor ke arah hadapan
    // rintangan gelongsor
    const mu = opt.mu != null ? opt.mu : Math.tan((+fd.deltaRatio) * (+fd.phi) * D2R);
    const cb = opt.mu != null ? 0 : (+fd.cBase || 0);
    let Pp = 0;
    if (!opt.noPassive && w.passive.on && +fd.D > 0) Pp = 0.5 * rankineKp(+fd.phi) * (+fd.gamma) * (+fd.D) ** 2 * (+w.passive.factor);
    const Rsl = Math.max(0, N) * mu + cb * Bw + Pp;
    const FSs = Tsl > 0 ? Rsl / Tsl : Infinity;
    const FSo = Mo > 0 ? Mr / Mo : Infinity;
    const s = N > 0 ? -Mt / N : NaN; // jarak paduan dari kaki di sepanjang tapak
    const e = Bw / 2 - s;
    let qmax, qmin, qToe, qHeel;
    if (Math.abs(e) <= Bw / 6) { qmax = N / Bw * (1 + 6 * Math.abs(e) / Bw); qmin = N / Bw * (1 - 6 * Math.abs(e) / Bw); }
    else { const sEff = e > 0 ? s : Bw - s; qmax = sEff > 0 ? 2 * N / (3 * sEff) : Infinity; qmin = 0; }
    qToe = e >= 0 ? qmax : qmin; qHeel = e >= 0 ? qmin : qmax;
    const res = { items, K, rho: Kres && Kres.rho, T, Fx, Fy, N, Tsl, Mo, Mr, Mt, FSs, FSo, s, e, Bw, alpha, qmax, qmin, qToe, qHeel, Pp, Rsl, mu, Wwall, kh };
    if (!opt.noBearing) {
      const Bp = Math.max(0.01, Bw - 2 * Math.abs(e));
      const bc = bearingEC7(+fd.phi, +fd.c, +fd.gamma, (+fd.gamma) * (+fd.D), Bp, Math.max(N, 1e-6), Math.max(Tsl, 0));
      res.bearing = { ...bc, Bp, qeff: N / Bp, FSb: bc.qult / (N / Bp), qa: +fd.qa };
    }
    return res;
  }

  /* ---------------- Semakan dalaman ---------------- */
  function gabionCourses(g, w) {
    const out = [], L = g.layers, a = g.tilt, phiG = +w.gabion.phiInt || 35;
    let yb = 0;
    for (let j = 1; j < L.length; j++) {
      yb += L[j - 1].h;
      const sub = L.slice(j), x0 = g.w0 - sub[0].w; // hadapan lapis j sebagai kaki baharu
      let y = 0; const polys = [];
      sub.forEach((l, i) => {
        const xa = g.w0 - l.w - x0, xb = g.w0 - x0;
        polys.push({ pts: [[xa, y], [xb, y], [xb, y + l.h], [xa, y + l.h]].map(p => rotCW(p, a)), gamma: g.gam, kind: 'wall', name: 'Lapis ' + (j + i + 1) });
        y += l.h;
      });
      const A = rotCW([g.w0 - x0, 0], a), B = rotCW([g.w0 - x0, y], a);
      const gs = { ...g, polys, face: { A, B }, heel: A };
      const ws = { ...w, water: { hw: Math.max(0, (+w.water.hw) - yb), hwf: 0 } };
      const r = checkWall(gs, ws, { noPassive: true, noBearing: true, mu: Math.tan(phiG * D2R) });
      out.push({ level: yb, above: sub.length, B: sub[0].w, FSs: r.FSs, FSo: r.FSo, e: r.e, B6: sub[0].w / 6, qmax: r.qmax });
    }
    return out;
  }
  function trapSections(g, w) {
    const t = w[g.type], H = g.H, out = [], gr = g.trap;
    [0.25, 0.5, 0.75].forEach(fr => {
      const y0 = H * fr;
      const xf = gr.nf * y0, xbk = gr.Bb + (gr.backTop[0] - gr.Bb) * fr;
      const pts = [[0, 0], [xbk - xf, 0], [gr.backTop[0] - xf, H - y0], [gr.nf * H - xf, H - y0]];
      const gs = { ...g, polys: [{ pts, gamma: +t.gamma, kind: 'wall', name: 'Atas keratan' }], face: { A: [xbk - xf, 0], B: [gr.backTop[0] - xf, H - y0] }, heel: [xbk - xf, 0] };
      const ws = { ...w, water: { hw: Math.max(0, (+w.water.hw) - y0), hwf: 0 } };
      const r = checkWall(gs, ws, { noPassive: true, noBearing: true, mu: Math.tan((+t.phiJoint || 35) * D2R) });
      out.push({ level: y0, b: xbk - xf, FSs: r.FSs, FSo: r.FSo, e: r.e, b6: (xbk - xf) / 6, qmax: r.qmax, qmin: r.qmin, sAllow: +t.sAllow });
    });
    return out;
  }
  function mseInternal(g, w) {
    const t = w.mse, H = +t.H, Sv = +t.Sv, phi = +t.phiR, Ka = rankineKa(phi) * (+t.krFactor || 1);
    const q = +w.loads.q || 0, gr = +t.gammaR, out = [];
    for (let z = Sv / 2; z < H; z += Sv) {
      const sv = gr * z + q;
      const Tmax = Ka * sv * Sv;
      const La = (H - z) * Math.tan((45 - phi / 2) * D2R);
      const Le = Math.max(0, +t.L - La);
      const Pr = 2 * Le * gr * z * (+t.Ci) * Math.tan(phi * D2R);
      out.push({ z, sv, Tmax, La, Le, Pr, FSpo: Pr / Tmax, FSt: (+t.Tallow) / Tmax });
    }
    return { layers: out, Ka };
  }

  /* ---------------- Rekabentuk struktur RC (EC2, per m) ---------------- */
  function rcSection(M, V, h, bar, cover, fck, fyk) {
    const b = 1000, d = h * 1000 - cover - bar / 2; // mm
    const Mn = M * 1e6;
    const K = Mn / (b * d * d * fck);
    const Kbal = 0.167;
    const z = Math.min(0.95 * d, d * (0.5 + Math.sqrt(Math.max(0, 0.25 - K / 1.134))));
    const AsReq = Mn / (0.87 * fyk * z);
    const fctm = 0.3 * Math.pow(fck, 2 / 3);
    const AsMin = Math.max(0.26 * fctm / fyk * b * d, 0.0013 * b * d);
    const As = Math.max(AsReq, AsMin);
    const Ab = Math.PI * bar * bar / 4;
    let s = Math.floor(1000 * Ab / As / 25) * 25; s = Math.min(s, 300);
    const AsProv = s > 0 ? 1000 * Ab / s : 0;
    const k = Math.min(2, 1 + Math.sqrt(200 / d));
    const rho = Math.min(0.02, AsProv / (b * d));
    const vmin = 0.035 * Math.pow(k, 1.5) * Math.sqrt(fck);
    const VRdc = Math.max(0.12 * k * Math.cbrt(100 * rho * fck), vmin) * b * d / 1000; // kN
    return { d, K, Kok: K <= Kbal, z, AsReq, AsMin, As, bar, s, AsProv, VRdc, V, Vok: V <= VRdc, M };
  }
  function rcDesign(g, w, ext) {
    const t = w.rc, bf = w.backfill, gF = +t.gF || 1.4, fck = +t.fck, fyk = +t.fyk, cv = +t.cover;
    const hs = g.H - g.tb, q = +w.loads.q || 0, gw = 9.81;
    // batang: tekanan pada muka tegak dari atas batang ke atas tapak
    const Ks = (ext.K || rankineKa(+bf.phi)) * Math.cos(bf.beta * D2R);
    const yW = +w.water.hw > 0 ? +w.water.hw : -1e9;
    let Vs = 0, Ms = 0; const N = 200, dz = hs / N;
    for (let i = 0; i < N; i++) {
      const z = (i + 0.5) * dz, y = g.H - z;
      const zw = Math.max(0, g.H - yW);
      const sv = (+bf.gamma) * Math.min(z, zw) + ((+bf.gammaSat) - gw) * Math.max(0, z - zw);
      const p = Ks * (sv + q) + (y < yW ? gw * (yW - y) : 0);
      Vs += p * dz; Ms += p * dz * (y - g.tb);
    }
    const stem = rcSection(gF * Ms, gF * Vs, g.tbo, +t.barStem, cv, fck, fyk);
    // tumit: beban turun (tanah + tapak + q) tolak tekanan galas
    const qAt = x => ext.qToe + (ext.qHeel - ext.qToe) * x / ext.Bw;
    const ySoilTop = x => g.H + (x - g.xst) * Math.tan(bf.beta * D2R);
    let Mh = 0, Vh = 0, Mt = 0, Vt = 0;
    const nh = 100, dxh = g.heelL / nh;
    for (let i = 0; i < nh; i++) {
      const x = g.xsb + (i + 0.5) * dxh, arm = x - g.xsb;
      const down = (+bf.gamma) * (ySoilTop(x) - g.tb) + (+t.gammaC) * g.tb + q;
      const net = down - qAt(x);
      Mh += net * dxh * arm; Vh += net * dxh;
    }
    const nt = 100, dxt = g.toe / nt;
    for (let i = 0; i < nt; i++) {
      const x = (i + 0.5) * dxt, arm = g.toe - x;
      const net = qAt(x) - (+t.gammaC) * g.tb;
      Mt += net * dxt * arm; Vt += net * dxt;
    }
    const heel = rcSection(gF * Math.max(Mh, 0), gF * Math.abs(Vh), g.tb, +t.barBase, cv, fck, fyk);
    const toe = rcSection(gF * Math.max(Mt, 0), gF * Math.abs(Vt), g.tb, +t.barBase, cv, fck, fyk);
    const kgm = (As, L) => As * 1e-6 * L * 7850; // kg per m panjang tembok
    const steel = kgm(stem.AsProv, hs + 0.6) + kgm(heel.AsProv, g.B) + kgm(toe.AsProv, g.B)
      + kgm(0.2 * stem.AsProv, hs) * 1 + kgm(0.2 * Math.max(heel.AsProv, toe.AsProv), g.B) * 2;
    return { gF, stem, heel, toe, Ms, Vs, Mh, Vh, Mt, Vt, steel, hs };
  }

  /* ---------------- Cerucuk keping julur (sheet pile) ---------------- */
  function sheetPile(w) {
    const t = w.sheet, bf = w.backfill, H = +t.H, q = +w.loads.q || 0, g = +bf.gamma;
    const Ka = rankineKa(+bf.phi), Kp = rankineKp(+bf.phi) / (+t.Fp);
    const sa = z => Ka * (g * z + q), sp = z => z > H ? Kp * g * (z - H) : 0;
    const momentAboutToe = D => { // aktif (+) tolak pasif
      const L = H + D, N = 400, dz = L / N; let M = 0;
      for (let i = 0; i < N; i++) { const z = (i + 0.5) * dz; M += (sa(z) - sp(z)) * dz * (L - z); }
      return M;
    };
    let lo = 0.01, hi = 5 * H;
    if (momentAboutToe(hi) > 0) return { ok: false, Ka, Kp };
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (momentAboutToe(m) > 0) lo = m; else hi = m; }
    const D0 = hi, Dd = D0 * (+t.extend || 1.2);
    // momen maksimum pada ricih sifar
    const N = 2000, L = H + D0, dz = L / N; let V = 0, M = 0, Mmax = 0, zM = 0;
    for (let i = 0; i < N; i++) {
      const z = (i + 0.5) * dz; const p = sa(z) - sp(z);
      M += V * dz + p * dz * dz / 2; V += p * dz;
      if (M > Mmax) { Mmax = M; zM = z; }
      if (V < 0) break;
    }
    const MEd = 1.35 * Mmax;
    const Zreq = MEd * 1e6 / (+t.fy) / 1e3; // cm3/m
    return { ok: true, Ka, Kp, D0, Dd, Ltot: H + Dd, Mmax, zM, MEd, Zreq, Zprov: +t.Zprov, Zok: +t.Zprov >= Zreq };
  }

  /* ---------------- Jalankan semua ---------------- */
  function runWall(w) {
    if (w.type === 'sheet') return { type: 'sheet', sheet: sheetPile(w) };
    const g = buildWall(w);
    const seismic = (+w.loads.kh || 0) > 0;
    const ext = checkWall(g, w);
    const F = w.fos;
    const need = { s: seismic ? +F.sSl : +F.sl, o: seismic ? +F.sOt : +F.ot, b: seismic ? +F.sBr : +F.br };
    const eLim = ext.Bw / (w.fos.eRock ? 4 : 6);
    const checks = [
      { name: 'Gelongsor', val: ext.FSs, req: need.s, ok: ext.FSs >= need.s, fmt: 'FOS' },
      { name: 'Terbalik', val: ext.FSo, req: need.o, ok: ext.FSo >= need.o, fmt: 'FOS' },
      { name: `Kesipian e ≤ B/${w.fos.eRock ? 4 : 6}`, val: Math.abs(ext.e), req: eLim, ok: Math.abs(ext.e) <= eLim, fmt: 'm', inv: true },
    ];
    if (w.found.method === 'qa') checks.push({ name: 'Tekanan galas maks ≤ qa', val: ext.qmax, req: +w.found.qa, ok: ext.qmax <= +w.found.qa, fmt: 'kPa', inv: true });
    else checks.push({ name: 'Keupayaan galas (EC7 Lamp. D)', val: ext.bearing.FSb, req: need.b, ok: ext.bearing.FSb >= need.b, fmt: 'FOS' });
    const out = { type: w.type, g, ext, checks, need, seismic };
    if (w.type === 'gabion') { out.courses = gabionCourses(g, w); out.volume = g.polys.reduce((a, p) => a + polyProps(p.pts).A, 0); }
    if (w.type === 'gravity' || w.type === 'rubble' || w.type === 'crib') { out.sections = trapSections(g, w); out.volume = polyProps(g.polys[0].pts).A; }
    if (w.type === 'rc') { out.rc = rcDesign(g, w, ext); out.volume = g.polys.filter(p => p.kind === 'wall').reduce((a, p) => a + polyProps(p.pts).A, 0); }
    if (w.type === 'mse') { out.mse = mseInternal(g, w); out.volume = polyProps(g.polys[0].pts).A; }
    return out;
  }

  const API = { wedgeK, rankineKa, rankineKp, coulombKa, buildWall, checkWall, bearingEC7, rcSection, rcDesign, sheetPile, runWall, polyProps, rotCW, faceThrust };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.WallEngine = API;
})(this);
