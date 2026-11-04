/* ---------- Modul tembok penahan ---------- */
const WTYPES = {
  gravity:{ name:'Konkrit graviti (mass concrete)', desc:'Tembok konkrit tanpa tetulang yang bergantung pada beratnya sendiri. Sesuai sehingga kira-kira 3 m. Keratan dalaman disemak supaya tiada tegangan (e ≤ b/6).' },
  rubble:{ name:'Batu-batan (rubble masonry)', desc:'Batu sungai/kuari diikat dengan mortar. Lazim untuk tembok rendah (≤ 3 m) di tepi jalan dan longkang. Tegasan mampatan dan tegangan pada sambungan mortar disemak.' },
  gabion:{ name:'Gabion', desc:'Bakul dawai bersalut berisi batu, disusun berlapis dengan muka hadapan bertingkat dan belakang sejajar. Fleksibel dan bersalir. Lapisan disusun dari bawah ke atas; setiap aras antara lapis disemak.' },
  rc:{ name:'Konkrit bertetulang julur (RC cantilever)', desc:'Batang (stem) dan tapak bertetulang; berat tanah di atas tumit menambah kestabilan. Lazim untuk 3–7 m. Termasuk rekabentuk tetulang batang, tumit dan kaki (EC2).' },
  mse:{ name:'Tanah bertetulang (MSE / geogrid)', desc:'Blok tanah dipadatkan berlapis dengan tetulang geosintetik atau jalur keluli. Kestabilan luaran sebagai blok graviti, dan semakan dalaman tegangan serta cabut keluar setiap lapisan.' },
  crib:{ name:'Tembok crib', desc:'Rangka kotak konkrit pratuang atau kayu yang diisi tanah berbutir atau batu, biasanya dicondongkan ke belakang. Dianalisis sebagai blok graviti dengan unit berat berkesan.' },
  sheet:{ name:'Cerucuk keping julur (sheet pile)', desc:'Cerucuk keluli julur (tanpa sauh) dalam tanah berbutir, kaedah ringkas: kedalaman benaman daripada keseimbangan momen di hujung, ditambah 20%, dan modulus keratan yang diperlukan.' },
};
function wallGeomFields(T){
  const w = P.wall;
  if (T === 'gravity' || T === 'rubble' || T === 'crib') return `<div class="fields">
    ${fld(`wall.${T}.H`,'Tinggi H','m')}${fld(`wall.${T}.Bbase`,'Lebar tapak B','m')}${fld(`wall.${T}.Btop`,'Lebar atas','m')}
    ${fld(`wall.${T}.nf`,'Kecondongan muka hadapan','H:1V')}${fld(`wall.${T}.gamma`,T==='crib'?'Unit berat berkesan':'Unit berat bahan','kN/m³')}
    ${fld(`wall.${T}.sAllow`,'Tegasan mampatan dibenarkan','kPa')}${fld(`wall.${T}.phiJoint`,'Sudut geseran sambungan','°')}
  </div><p class="hint">Muka belakang dikira daripada lebar tapak, lebar atas dan kecondongan hadapan. ${T==='crib'?'Untuk crib, unit berat berkesan ≈ γ pengisi × (1 − ruang kosong) + rangka.':''}</p>`;
  if (T === 'gabion') return `<div class="fields">
    ${fld('wall.gabion.tilt','Condong ke belakang','°')}${fld('wall.gabion.gammaRock','Unit berat batu','kN/m³')}
    ${fld('wall.gabion.porosity','Keliangan n','')}${fld('wall.gabion.phiInt','Geseran antara lapis','°')}
  </div>
  <div class="tblwrap" style="margin-top:12px"><table class="edit"><thead><tr><th>Lapis (dari bawah)</th><th class="num">Lebar (m)</th><th class="num">Tinggi (m)</th><th></th></tr></thead><tbody>
  ${w.gabion.layers.map((l,i)=>`<tr><td>${i+1}</td><td>${cell(`wall.gabion.layers.${i}.w`)}</td><td>${cell(`wall.gabion.layers.${i}.h`)}</td><td><button class="ghost" data-del="wall.gabion.layers" data-i="${i}">Buang</button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="rowbtns"><button data-add="glayer">+ Tambah lapis</button></div>
  <p class="hint">γ gabion = γ batu × (1 − n) = ${f((+w.gabion.gammaRock)*(1-(+w.gabion.porosity)),2)} kN/m³. Saiz bakul lazim 1.0 m atau 0.5 m tinggi. Condong lazim 6° (≈ 1:10).</p>`;
  if (T === 'rc') return `<div class="fields">
    ${fld('wall.rc.H','Tinggi keseluruhan H (dari bawah tapak)','m')}${fld('wall.rc.tb','Tebal tapak','m')}
    ${fld('wall.rc.tTop','Tebal batang di atas','m')}${fld('wall.rc.tBot','Tebal batang di bawah','m')}
    ${fld('wall.rc.toe','Panjang kaki (toe)','m')}${fld('wall.rc.heel','Panjang tumit (heel)','m')}${fld('wall.rc.gammaC','Unit berat konkrit','kN/m³')}
  </div>
  <h3>Bahan & tetulang</h3>
  <div class="fields">
    ${fld('wall.rc.fck','fck','MPa')}${fld('wall.rc.fyk','fyk','MPa')}${fld('wall.rc.cover','Penutup konkrit','mm')}
    ${fld('wall.rc.barStem','Diameter bar batang','mm')}${fld('wall.rc.barBase','Diameter bar tapak','mm')}${fld('wall.rc.gF','Faktor beban γF','')}
  </div><p class="hint">Lebar tapak lazim 0.5H–0.7H. Momen reka = γF × momen khidmat (γF = 1.4 anggaran gabungan beban kekal dan surcaj).</p>`;
  if (T === 'mse') return `<div class="fields">
    ${fld('wall.mse.H','Tinggi H','m')}${fld('wall.mse.L','Panjang tetulang L','m')}${fld('wall.mse.Sv','Jarak tegak tetulang Sv','m')}
    ${fld('wall.mse.Tallow','Kekuatan reka tetulang (LTDS/FS)','kN/m')}${fld('wall.mse.Ci','Pekali interaksi Ci','')}
    ${fld('wall.mse.phiR','φ′ timbus bertetulang','°')}${fld('wall.mse.gammaR','γ timbus bertetulang','kN/m³')}${fld('wall.mse.krFactor','Faktor Kr/Ka','')}
  </div><p class="hint">L minimum lazim 0.7H dan ≥ 2.5 m. Kr/Ka = 1.0 untuk geosintetik; 1.2–1.7 untuk jalur keluli (bergantung pada kedalaman).</p>`;
  if (T === 'sheet') return `<div class="fields">
    ${fld('wall.sheet.H','Tinggi tertahan H','m')}${fld('wall.sheet.Fp','Faktor keselamatan pada Kp','')}${fld('wall.sheet.extend','Faktor tambahan kedalaman','')}
    ${fld('wall.sheet.fy','fy keluli','MPa')}${fld('wall.sheet.Zprov','Modulus keratan dibekalkan','cm³/m')}
  </div><p class="hint">Kaedah ringkas cerucuk julur: kedalaman D0 daripada keseimbangan momen di hujung; kedalaman reka = faktor × D0 (lazim 1.2). M_Ed = 1.35 Mmax; Z perlu = M_Ed / fy.</p>`;
  return '';
}
function wallStatus(){
  if (!RW) return [];
  const st = [];
  if (RW.type === 'sheet') { const s = RW.sheet; st.push({ name:'Penyelesaian kedalaman', ok: s.ok }); if (s.ok) st.push({ name:'Modulus keratan', ok: s.Zok }); return st; }
  RW.checks.forEach(c => st.push({ name:c.name, ok:c.ok }));
  if (RW.courses) st.push({ name:'Semakan setiap lapis gabion', ok: RW.courses.every(c => c.FSs >= RW.need.s && c.FSo >= RW.need.o && Math.abs(c.e) <= c.B6) });
  if (RW.sections) st.push({ name:'Semakan keratan dalaman', ok: RW.sections.every(c => Math.abs(c.e) <= c.b6 && c.qmax <= c.sAllow && c.FSs >= RW.need.s) });
  if (RW.rc) st.push({ name:'Rekabentuk struktur RC', ok: ['stem','heel','toe'].every(k => RW.rc[k].Kok && RW.rc[k].Vok && RW.rc[k].s >= 75) });
  if (RW.mse) st.push({ name:'Tetulang dalaman MSE', ok: RW.mse.layers.every(l => l.FSpo >= 1.5 && l.FSt >= 1.0) });
  return st;
}
const okPill = ok => ok ? '<span class="pill ok">Lulus</span>' : '<span class="pill bad">Gagal</span>';
function wallSummaryHTML(){
  if (RW && RW.type !== P.wall.type) return '';
  if (!RW) return '<p>Ralat pengiraan tembok. Semak input.</p>';
  const st = wallStatus(), all = st.every(c => c.ok), w = P.wall;
  let body = '';
  if (RW.type === 'sheet') {
    const s = RW.sheet;
    body = s.ok ? `<div class="kv"><div><small>Kedalaman benaman reka</small><strong>${f(s.Dd,2)} m</strong></div><div><small>Panjang cerucuk</small><strong>${f(s.Ltot,2)} m</strong></div><div><small>Mmax (khidmat)</small><strong>${f(s.Mmax,1)} kNm/m</strong></div><div><small>Z perlu / sedia</small><strong>${f(s.Zreq,0)} / ${f(s.Zprov,0)}</strong></div></div>` : '<div class="note"><b>Tiada penyelesaian.</b> Rintangan pasif tidak mencukupi; kurangkan Fp atau semak parameter.</div>';
  } else {
    body = `<div class="fos">${RW.checks.slice(0,3).map(c=>`<div><small>${c.name.split(' ')[0]}</small><strong>${c.fmt==='FOS'?f(c.val,2):f(c.val,3)}</strong><em>${c.fmt==='FOS'?'≥ '+f(c.req,2):'≤ '+f(c.req,3)+' m'}</em></div>`).join('')}</div>`;
  }
  return `<div class="hd"><b>Ringkasan tembok</b><span class="sp">${all?'<span class="pill ok">Semua lulus</span>':'<span class="pill bad">Perlu semakan</span>'}</span></div>
    <div class="mini" style="margin-bottom:8px">${WTYPES[w.type].name}${RW.seismic?' · seismik kh = '+f(w.loads.kh,2):''}</div>${body}
    <div class="status-list" style="margin-top:12px">${st.map(c=>`<div><span>${c.name}</span>${okPill(c.ok)}</div>`).join('')}</div>`;
}
function wallLegend(){
  return `<span><i style="background:var(--slip)"></i>Tekanan tanah & paduan</span><span><i style="background:var(--water)"></i>Air</span><span><i style="background:var(--accent)"></i>Tekanan galas</span>${P.wall.type==='rc'?'<span><i style="background:var(--steel)"></i>Tetulang</span>':''}${P.wall.type==='mse'?'<span><i style="background:var(--nail)"></i>Tetulang geosintetik</span>':''}`;
}
function wallResHTML(open){
  if (RW && RW.type !== P.wall.type) return '';
  if (!RW) return '<div class="note"><b>Ralat pengiraan.</b> Semak semua input bernilai positif.</div>';
  const w = P.wall;
  if (RW.type === 'sheet') {
    const s = RW.sheet;
    if (!s.ok) return '<div class="note"><b>Tiada penyelesaian kedalaman.</b> Rintangan pasif (Kp/Fp) terlalu kecil berbanding Ka.</div>';
    return `<div class="tblwrap"><table><tbody>
      <tr><td>Ka (Rankine)</td><td class="num">${f(s.Ka,3)}</td></tr><tr><td>Kp / Fp</td><td class="num">${f(s.Kp,3)}</td></tr>
      <tr><td>Kedalaman teori D0</td><td class="num">${f(s.D0,2)} m</td></tr><tr><td>Kedalaman reka D = ${f(w.sheet.extend,2)} × D0</td><td class="num"><b>${f(s.Dd,2)} m</b></td></tr>
      <tr><td>Panjang cerucuk keseluruhan</td><td class="num"><b>${f(s.Ltot,2)} m</b></td></tr>
      <tr><td>Momen maksimum (khidmat) pada kedalaman ${f(s.zM,2)} m</td><td class="num">${f(s.Mmax,1)} kNm/m</td></tr>
      <tr><td>M_Ed = 1.35 × Mmax</td><td class="num">${f(s.MEd,1)} kNm/m</td></tr>
      <tr><td>Modulus keratan perlu Z = M_Ed / fy</td><td class="num"><b>${f(s.Zreq,0)} cm³/m</b></td></tr>
      <tr><td>Modulus keratan dibekalkan</td><td class="num">${f(s.Zprov,0)} cm³/m ${okPill(s.Zok)}</td></tr>
      <tr><td>Berat keluli anggaran (pilih keratan sebenar)</td><td class="num">—</td></tr>
    </tbody></table></div>
    <p class="hint">Kaedah ringkas mengabaikan air dan tanah berlapis. Untuk H &gt; 4–5 m, gunakan cerucuk bersauh atau analisis interaksi tanah-struktur. Semak juga pesongan di kepala cerucuk.</p>`;
  }
  const x = RW.ext;
  const fmtV = c => c.fmt === 'FOS' ? f(c.val,2) : f(c.val, c.fmt==='m'?3:1) + ' ' + c.fmt;
  const fmtR = c => (c.inv ? '≤ ' : '≥ ') + (c.fmt === 'FOS' ? f(c.req,2) : f(c.req, c.fmt==='m'?3:1) + ' ' + c.fmt);
  let h = `<div class="tblwrap"><table><thead><tr><th>Semakan kestabilan luaran</th><th class="num">Nilai</th><th class="num">Had</th><th>Status</th></tr></thead><tbody>
    ${RW.checks.map(c=>`<tr><td>${c.name}</td><td class="num"><b>${fmtV(c)}</b></td><td class="num">${fmtR(c)}</td><td>${okPill(c.ok)}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="kv" style="margin-top:12px">
    <div><small>${RW.seismic?'K_AE (Mononobe–Okabe)':'Ka (Coulomb)'}</small><strong>${f(x.K,3)}</strong></div>
    <div><small>Sudut satah gagal</small><strong>${f(x.rho,1)}°</strong></div>
    <div><small>Daya normal N</small><strong>${f(x.N,1)} kN/m</strong></div>
    <div><small>Daya gelongsor T</small><strong>${f(x.Tsl,1)} kN/m</strong></div>
    <div><small>Lebar tapak B</small><strong>${f(x.Bw,2)} m</strong></div>
    <div><small>Kesipian e</small><strong>${f(x.e,3)} m</strong></div>
    <div><small>q di kaki</small><strong>${f(x.qToe,1)} kPa</strong></div>
    <div><small>q di tumit</small><strong>${f(x.qHeel,1)} kPa</strong></div>
  </div>`;
  if (x.bearing) { const b = x.bearing; h += `<details ${open?'open':''}><summary>Keupayaan galas (EC7 Lampiran D, jalur, saliran)</summary><div class="tblwrap" style="margin-top:8px"><table><tbody>
    <tr><td>Nq / Nc / Nγ</td><td class="num">${f(b.Nq,2)} / ${f(b.Nc,2)} / ${f(b.Ng,2)}</td></tr>
    <tr><td>Faktor kecondongan iq / iγ / ic</td><td class="num">${f(b.iq,3)} / ${f(b.ig,3)} / ${f(b.ic,3)}</td></tr>
    <tr><td>Lebar berkesan B′ = B − 2e</td><td class="num">${f(b.Bp,2)} m</td></tr>
    <tr><td>q ult</td><td class="num">${f(b.qult,0)} kPa</td></tr>
    <tr><td>q berkesan = N / B′</td><td class="num">${f(b.qeff,1)} kPa</td></tr>
    <tr><td>FOS galas</td><td class="num"><b>${f(b.FSb,2)}</b></td></tr>
  </tbody></table></div></details>`; }
  h += `<details ${open?'open':''}><summary>Jadual daya dan momen di sekitar kaki</summary><div class="tblwrap" style="margin-top:8px"><table><thead><tr><th>Komponen</th><th class="num">Fx (kN/m)</th><th class="num">Fy (kN/m)</th><th class="num">x (m)</th><th class="num">y (m)</th><th class="num">M (kNm/m)</th></tr></thead><tbody>
    ${x.items.map(i=>`<tr><td>${esc(i.name)}</td><td class="num">${f(i.Fx,1)}</td><td class="num">${f(i.Fy,1)}</td><td class="num">${f(i.x,2)}</td><td class="num">${f(i.y,2)}</td><td class="num">${f(i.M,1)}</td></tr>`).join('')}
    <tr><td><b>Jumlah</b></td><td class="num"><b>${f(x.Fx,1)}</b></td><td class="num"><b>${f(x.Fy,1)}</b></td><td></td><td></td><td class="num"><b>${f(x.Mt,1)}</b></td></tr>
  </tbody></table></div><p class="hint">M positif = menterbalikkan (lawan jam di sekitar kaki). Momen pemulih ${f(x.Mr,1)}, momen terbalik ${f(x.Mo,1)} kNm/m. Daya negatif Fy = ke bawah.</p></details>`;
  if (RW.courses) h += `<h3>Semakan setiap aras lapis gabion</h3><div class="tblwrap"><table><thead><tr><th class="num">Aras (m)</th><th class="num">Lapis di atas</th><th class="num">Lebar (m)</th><th class="num">FOS gelongsor</th><th class="num">FOS terbalik</th><th class="num">e (m)</th><th class="num">B/6</th><th>Status</th></tr></thead><tbody>
    ${RW.courses.map(c=>`<tr><td class="num">${f(c.level,2)}</td><td class="num">${c.above}</td><td class="num">${f(c.B,2)}</td><td class="num">${f(c.FSs,2)}</td><td class="num">${f(c.FSo,2)}</td><td class="num">${f(c.e,3)}</td><td class="num">${f(c.B6,3)}</td><td>${okPill(c.FSs>=RW.need.s && c.FSo>=RW.need.o && Math.abs(c.e)<=c.B6)}</td></tr>`).join('')}
  </tbody></table></div>`;
  if (RW.sections) h += `<h3>Semakan keratan dalaman</h3><div class="tblwrap"><table><thead><tr><th class="num">Aras (m)</th><th class="num">Lebar b (m)</th><th class="num">FOS gelongsor</th><th class="num">e (m)</th><th class="num">b/6</th><th class="num">σ maks (kPa)</th><th class="num">σ dibenarkan</th><th>Status</th></tr></thead><tbody>
    ${RW.sections.map(c=>`<tr><td class="num">${f(c.level,2)}</td><td class="num">${f(c.b,2)}</td><td class="num">${f(c.FSs,2)}</td><td class="num">${f(c.e,3)}</td><td class="num">${f(c.b6,3)}</td><td class="num">${f(c.qmax,0)}</td><td class="num">${f(c.sAllow,0)}</td><td>${okPill(Math.abs(c.e)<=c.b6 && c.qmax<=c.sAllow && c.FSs>=RW.need.s)}</td></tr>`).join('')}
  </tbody></table></div><p class="hint">e ≤ b/6 memastikan tiada tegangan pada sambungan. Gelongsor pada sambungan menggunakan sudut geseran sambungan.</p>`;
  if (RW.rc) { const r = RW.rc; const row = (n, s) => `<tr><td>${n}</td><td class="num">${f(s.M,1)}</td><td class="num">${f(s.V,1)}</td><td class="num">${f(s.d,0)}</td><td class="num">${f(s.K,3)}</td><td class="num">${f(s.AsReq,0)}</td><td class="num">${f(s.AsMin,0)}</td><td class="num"><b>T${s.bar}@${s.s}</b></td><td class="num">${f(s.AsProv,0)}</td><td class="num">${f(s.VRdc,1)}</td><td>${okPill(s.Kok && s.Vok && s.s >= 75)}</td></tr>`;
    h += `<h3>Rekabentuk struktur (EC2, per m)</h3><div class="tblwrap"><table><thead><tr><th>Bahagian</th><th class="num">M_Ed (kNm)</th><th class="num">V_Ed (kN)</th><th class="num">d (mm)</th><th class="num">K</th><th class="num">As perlu (mm²)</th><th class="num">As min</th><th class="num">Tetulang</th><th class="num">As sedia</th><th class="num">VRd,c (kN)</th><th>Status</th></tr></thead><tbody>
      ${row('Batang (muka belakang)', r.stem)}${row('Tumit (muka atas)', r.heel)}${row('Kaki (muka bawah)', r.toe)}
    </tbody></table></div>
    <p class="hint">Tetulang agihan (melintang): sekurang-kurangnya 20% tetulang utama atau As min, pada setiap muka. Jarak bar maks 300 mm. Semak lebar retak, panjang sambungan bertindih, dan sambungan batang–tapak. Momen tumit dan kaki dikira daripada taburan tekanan galas khidmat.</p>`; }
  if (RW.mse) { const ms = RW.mse;
    h += `<h3>Semakan dalaman tetulang (Ka = ${f(ms.Ka,3)})</h3><div class="tblwrap"><table><thead><tr><th class="num">z (m)</th><th class="num">σv (kPa)</th><th class="num">Tmax (kN/m)</th><th class="num">La (m)</th><th class="num">Le (m)</th><th class="num">Pr (kN/m)</th><th class="num">FOS cabut</th><th class="num">Tallow/Tmax</th><th>Status</th></tr></thead><tbody>
      ${ms.layers.map(l=>`<tr><td class="num">${f(l.z,2)}</td><td class="num">${f(l.sv,1)}</td><td class="num">${f(l.Tmax,2)}</td><td class="num">${f(l.La,2)}</td><td class="num">${f(l.Le,2)}</td><td class="num">${f(l.Pr,1)}</td><td class="num">${f(l.FSpo,2)}</td><td class="num">${f(l.FSt,2)}</td><td>${okPill(l.FSpo>=1.5 && l.FSt>=1.0)}</td></tr>`).join('')}
    </tbody></table></div><p class="hint">Tmax = Kr·σv·Sv; Le = panjang di belakang satah Rankine (45° + φ′/2); Pr = 2·Le·γz·Ci·tanφ′ (tanpa surcaj). Had: FOS cabut ≥ 1.5, Tallow ≥ Tmax.</p>`; }
  const Lw = +w.length || 0, vol = RW.volume || 0;
  const mat = { gravity:'Konkrit gred rendah', rubble:'Batu-batan + mortar', gabion:'Gabion (batu isian)', rc:'Konkrit bertetulang', mse:'Timbus bertetulang', crib:'Unit crib + pengisi' }[w.type];
  h += `<h3>Kuantiti anggaran (panjang ${f(Lw,0)} m)</h3><div class="tblwrap"><table><thead><tr><th>Perkara</th><th class="num">Per m</th><th class="num">Jumlah</th><th>Unit</th></tr></thead><tbody>
    <tr><td>${mat}</td><td class="num">${f(vol,2)}</td><td class="num">${f(vol*Lw,1)}</td><td>m³</td></tr>
    ${RW.rc?`<tr><td>Tetulang keluli (anggaran)</td><td class="num">${f(RW.rc.steel,0)}</td><td class="num">${f(RW.rc.steel*Lw/1000,2)}</td><td>kg/m · tan</td></tr>`:''}
    ${RW.mse?`<tr><td>Tetulang geosintetik</td><td class="num">${f(RW.mse.layers.length*(+w.mse.L),1)}</td><td class="num">${f(RW.mse.layers.length*(+w.mse.L)*Lw,0)}</td><td>m²</td></tr>`:''}
    <tr><td>Lubang salir / saliran belakang (geotekstil + batu)</td><td class="num">${f(RW.g.H,2)}</td><td class="num">${f(RW.g.H*Lw,0)}</td><td>m²</td></tr>
  </tbody></table></div>
  <div class="note"><b>Kestabilan menyeluruh.</b> Semakan di atas tidak merangkumi kegagalan gelinciran dalam melalui tanah asas. Semak menggunakan modul Analisis bulatan, terutamanya jika tembok berada di atas cerun atau tanah lembut.</div>`;
  return h;
}
function wallReportHTML(){
  const w = P.wall, st = wallStatus(), all = st.every(c => c.ok);
  const b = w.backfill, fd = w.found;
  return `<h4>Tembok penahan — ${WTYPES[w.type].name}</h4>
    <div class="verdict" style="margin:0 0 8px"><b>Status:</b> ${all?'<span class="pill ok">Memenuhi kriteria</span>':'<span class="pill bad">Tidak memenuhi kriteria</span>'}</div>
    <div class="figbox">${drawWall()}</div>
    <p class="mini">Timbus: γ ${f(b.gamma,1)} kN/m³, φ′ ${f(b.phi,1)}°${w.type!=='sheet'?`, β ${f(b.beta,1)}°, δ/φ′ ${f(b.deltaRatio,2)}. Asas: φ′ ${f(fd.phi,1)}°, c′ ${f(fd.c,1)} kPa, D ${f(fd.D,2)} m, δb/φ′ ${f(fd.deltaRatio,2)}. Air: hw ${f(w.water.hw,2)} m`:''}. Surcaj ${f(w.loads.q,1)} kPa${w.type!=='sheet'?`, kh ${f(w.loads.kh,2)}`:''}.</p>
    ${wallResHTML(true)}`;
}
function drawWall(){
  if (!RW || RW.type !== P.wall.type) return '';
  const w = P.wall, D2 = Math.PI/180;
  const Wpx = 900, pad = 30;
  let s = '', X, Y, k;
  const frame = (x0,x1,y0,y1) => { k = (Wpx-2*pad)/(x1-x0); X = x => (pad+(x-x0)*k).toFixed(1); Y = y => (pad+(y1-y)*k).toFixed(1); return Math.round((y1-y0)*k+2*pad); };
  const poly = (pts, fill, extra='') => `<polygon points="${pts.map(p=>`${X(p[0])},${Y(p[1])}`).join(' ')}" fill="${fill}" ${extra}/>`;
  const line = (a, b, col, wd, extra='') => `<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="${col}" stroke-width="${wd}" ${extra}/>`;
  const txt = (p, t, col='var(--muted)', anchor='start', extra='') => `<text x="${X(p[0])}" y="${Y(p[1])}" fill="${col}" text-anchor="${anchor}" ${extra}>${t}</text>`;
  const arrowL = (from, to, col) => { const ax = +X(to[0]), ay = +Y(to[1]); return line(from, to, col, 2.2) + `<path d="M${ax},${ay} l9,-5 l0,10 z" fill="${col}"/>`; };
  const defs = `<defs><pattern id="stones" width="14" height="12" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="3.2" fill="none" stroke="var(--ink)" stroke-opacity=".35"/><circle cx="11" cy="9" r="2.6" fill="none" stroke="var(--ink)" stroke-opacity=".35"/></pattern><pattern id="soilp" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".9" fill="var(--ink)" fill-opacity=".25"/><circle cx="7" cy="8" r=".9" fill="var(--ink)" fill-opacity=".25"/></pattern></defs>`;
  const head = h => `<svg viewBox="0 0 ${Wpx} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Keratan tembok penahan" font-family="IBM Plex Mono, monospace" font-size="11">${defs}`;

  if (RW.type === 'sheet') {
    const sp = RW.sheet, H = +w.sheet.H, Dd = sp.ok ? sp.Dd : H, q = +w.loads.q, g = +w.backfill.gamma;
    const x0 = -0.9*H - 1, x1 = 0.9*H + 1.5, y0 = -Dd - 0.8, y1 = H + 1.0;
    const hp = frame(x0,x1,y0,y1);
    s += head(hp);
    s += poly([[0,y0],[x1,y0],[x1,H],[0,H]], 'var(--fill)', 'fill-opacity=".45"') + poly([[0,y0],[x1,y0],[x1,H],[0,H]], 'url(#soilp)');
    s += poly([[x0,y0],[0,y0],[0,0],[x0,0]], 'var(--fill)', 'fill-opacity=".45"') + poly([[x0,y0],[0,y0],[0,0],[x0,0]], 'url(#soilp)');
    if (sp.ok) {
      const L = H + sp.D0, smax = sp.Ka*(g*L+q), pmax = sp.Kp*g*(L-H), sc = 0.7*H/Math.max(smax, pmax, 1);
      s += poly([[0,H],[sp.Ka*q*sc,H],[smax*sc,H-L],[0,H-L]], 'var(--slip)', 'fill-opacity=".22" stroke="var(--slip)"');
      s += poly([[0,0],[0,-sp.D0],[-pmax*sc,-sp.D0]], 'var(--accent)', 'fill-opacity=".22" stroke="var(--accent)"');
      s += txt([smax*sc+0.1, H-L+0.2], `σa ${f(smax,0)} kPa`, 'var(--slip)');
      s += txt([-pmax*sc-0.1, -sp.D0+0.2], `σp ${f(pmax,0)} kPa`, 'var(--accent)', 'end');
      s += line([-0.3, H-sp.zM], [0.3, H-sp.zM], 'var(--ochre)', 1.5) + txt([0.35, H-sp.zM-0.05], `Mmax ${f(sp.Mmax,0)} kNm/m`, 'var(--ochre)');
      s += line([x0, -sp.D0], [0, -sp.D0], 'var(--muted)', 0.8, 'stroke-dasharray="4 3"') + txt([x0+0.1, -sp.D0+0.12], `D0 = ${f(sp.D0,2)} m`);
    }
    s += line([0,H],[0,-Dd],'var(--steel)',4);
    s += txt([x0+0.1, 0.12], 'Aras korekan'); s += txt([x1-0.1, H+0.15], `H = ${f(H,2)} m`, 'var(--ink)', 'end');
    s += txt([0.15, -Dd+0.1], `Hujung: D = ${f(Dd,2)} m`, 'var(--ink)');
    if (q > 0) for (let xa = 0.3; xa < x1-0.2; xa += Math.max(0.5,(x1-0.3)/8)) s += line([xa,H+0.45],[xa,H+0.05],'var(--ochre)',1.4);
    return s + '</svg>';
  }

  const g = RW.g, x = RW.ext, bf = w.backfill, fd = w.found;
  const all = g.polys.flatMap(p => p.pts);
  const xmax = Math.max(...all.map(p=>p[0])), ymin = Math.min(0, ...all.map(p=>p[1])), H = g.H;
  const x0 = -Math.max(1.5, 0.45*H), x1 = xmax + Math.max(2.5, 0.85*H);
  const tb = Math.tan(bf.beta*D2), yR = g.face.B[1] + (x1 - g.face.B[0]) * tb;
  const qsc = 0.22*H / Math.max(x.qmax, 1);
  const y0 = ymin - 0.22*H - 0.9, y1 = Math.max(H, yR) + 0.15*H + 0.5;
  const hp = frame(x0, x1, y0, y1);
  s += head(hp);
  // tanah asas, tanah hadapan, timbus
  s += poly([[x0,y0],[x1,y0],[x1,0],[x0,0]], 'var(--fill)', 'fill-opacity=".35"') + poly([[x0,y0],[x1,y0],[x1,0],[x0,0]], 'url(#soilp)');
  if (+fd.D > 0) s += poly([[x0,0],[xmax,0],[xmax,+fd.D],[x0,+fd.D]], 'var(--fill)', 'fill-opacity=".45"');
  const bfPoly = [g.face.A, g.face.B, [x1, yR], [x1, 0]];
  s += poly(bfPoly, 'var(--fill)', 'fill-opacity=".55"') + poly(bfPoly, 'url(#soilp)');
  // tembok
  const wf = { gravity:'var(--conc)', rubble:'var(--stone)', gabion:'var(--stone)', rc:'var(--conc)', mse:'var(--fill)', crib:'var(--conc)' }[w.type];
  g.polys.forEach(p => {
    if (p.kind === 'soil') { s += poly(p.pts, 'var(--fill)', 'fill-opacity=".55"') + poly(p.pts, 'url(#soilp)'); return; }
    s += poly(p.pts, wf, 'stroke="var(--ink)" stroke-width="1.4"');
    if (w.type === 'gabion' || w.type === 'rubble') s += poly(p.pts, 'url(#stones)');
    if (w.type === 'mse') s += poly(p.pts, 'url(#soilp)');
  });
  if (w.type === 'crib') { const pts = g.polys[0].pts; for (let yy = 0.5; yy < H; yy += 0.5) { const xf = g.trap.nf*yy, xb = g.trap.Bb + (g.trap.backTop[0]-g.trap.Bb)*yy/H; s += line([xf,yy],[xb,yy],'var(--ink)',0.6,'stroke-opacity=".5"'); } }
  // tetulang
  if (w.type === 'rc') {
    const c = (+w.rc.cover + 10)/1000;
    s += `<polyline points="${[[g.xst-c, H-c],[g.xsb-c, c+0.02],[g.xsb-c+0.6, c+0.02]].map(p=>`${X(p[0])},${Y(p[1])}`).join(' ')}" fill="none" stroke="var(--steel)" stroke-width="2"/>`;
    s += line([g.toe, g.tb-c], [g.B-c, g.tb-c], 'var(--steel)', 2) + line([c, c], [g.B-c, c], 'var(--steel)', 2, 'stroke-dasharray="7 3"');
    s += txt([g.xsb+0.08, (g.tb+H)/2], `T${RW.rc.stem.bar}@${RW.rc.stem.s}`, 'var(--steel)');
  }
  if (w.type === 'mse') {
    const m = RW.mse; m.layers.forEach(l => s += line([0, H-l.z], [g.L, H-l.z], 'var(--nail)', 1.8));
    const t = Math.tan((45 - (+w.mse.phiR)/2)*D2);
    s += line([0,0],[H*t,H],'var(--slip)',1.2,'stroke-dasharray="6 4"') + txt([H*t+0.1,H-0.3],'satah Rankine','var(--slip)');
  }
  // air
  if (+w.water.hw > 0) { const yw = g.face.A[1] + (+w.water.hw); s += line([g.face.A[0] + (yw-g.face.A[1])*Math.tan(g.omega*D2), yw], [x1, yw], 'var(--water)', 1.8, 'stroke-dasharray="10 3 2 3"'); }
  if (+w.water.hwf > 0) s += line([x0, +w.water.hwf], [0, +w.water.hwf], 'var(--water)', 1.8, 'stroke-dasharray="10 3 2 3"');
  // surcaj
  if (+w.loads.q > 0) { for (let xa = g.face.B[0] + 0.2; xa < x1 - 0.1; xa += Math.max(0.5, (x1-g.face.B[0])/7)) { const yy = g.face.B[1] + (xa-g.face.B[0])*tb; s += line([xa, yy+0.45], [xa, yy+0.05], 'var(--ochre)', 1.4); } s += txt([x1-0.1, yR+0.55], `q = ${f(w.loads.q,0)} kPa`, 'var(--ochre)', 'end'); }
  // taburan tekanan pada muka
  const om = Math.tan(g.omega*D2), xAt = yy => g.face.A[0] + (yy - g.face.A[1])*om;
  const pr = x.T.prof, smax = Math.max(...pr.map(p => p.s + p.u), 1), psc = 0.3*H/smax;
  const pp = pr.map(p => [xAt(p.y) + p.s*psc, p.y]);
  s += poly([[xAt(g.face.B[1]), g.face.B[1]], ...pp, [xAt(g.face.A[1]), g.face.A[1]]], 'var(--slip)', 'fill-opacity=".18" stroke="var(--slip)" stroke-width="1"');
  if (x.T.Pw > 0) s += poly([[xAt(g.face.A[1] + (+w.water.hw)), g.face.A[1] + (+w.water.hw)], ...pr.filter(p=>p.u>0).map(p => [xAt(p.y) + p.u*psc, p.y]), [xAt(g.face.A[1]), g.face.A[1]]], 'var(--water)', 'fill-opacity=".25" stroke="var(--water)"');
  const Pa = x.T.Ps + x.T.Pq, ya = Pa ? (x.T.Ps*x.T.ys + x.T.Pq*x.T.yq)/Pa : 0;
  s += arrowL([xAt(ya) + 0.32*H + 0.4, ya], [xAt(ya), ya], 'var(--slip)') + txt([xAt(ya) + 0.32*H + 0.5, ya + 0.08], `Pa = ${f(Pa,1)} kN/m`, 'var(--slip)', 'start', 'font-weight="600"');
  // taburan tekanan galas
  const a = x.alpha, n = [Math.sin(a), Math.cos(a)], heel = g.heel;
  s += poly([[0,0], heel, [heel[0]-n[0]*x.qHeel*qsc, heel[1]-n[1]*x.qHeel*qsc], [-n[0]*x.qToe*qsc, -n[1]*x.qToe*qsc]], 'var(--accent)', 'fill-opacity=".2" stroke="var(--accent)"');
  s += txt([0, -x.qToe*qsc - 0.25], `${f(x.qToe,0)} kPa`, 'var(--accent)', 'middle') + txt([heel[0], heel[1] - x.qHeel*qsc - 0.25], `${f(x.qHeel,0)} kPa`, 'var(--accent)', 'middle');
  // dimensi
  s += txt([xmax/2, y0 + 0.15], `B = ${f(x.Bw,2)} m`, 'var(--ink)', 'middle') + txt([x0 + 0.1, H - 0.1], `H = ${f(H,2)} m`, 'var(--ink)');
  s += `<line x1="${X(x0+0.05)}" y1="${Y(0)}" x2="${X(x0+0.05)}" y2="${Y(H)}" stroke="var(--ink)" stroke-width="0.8"/>`;
  return s + '</svg>';
}
