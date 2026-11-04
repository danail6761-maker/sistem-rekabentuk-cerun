// Ujian penanda aras ACADS 1(a): cerun homogen 2H:1V, H = 10 m, c' = 3 kPa, phi' = 19.6 deg, gamma = 20.
// Rujukan: Bishop 0.987-1.00. Jalankan: node tests/benchmark.js
const E = require('../src/engine.js');
const p = { geom:{toeElev:25,toeExt:20,crestExt:30,benches:[{h:10,n:2,berm:0}]},
  soils:[{name:'S',gamma:20,gammaSat:20,c:3,phi:19.6,bottom:''}], water:{mode:'none'}, loads:{q:0,kh:0},
  search:{auto:true,nx:15,ny:15,nr:12,nSlices:40,minDepth:0.5,depthBelow:5} };
const s = E.search(E.buildModel(p), p.search, null, 'bishop');
const fb = s.best.bishop.FS.bishop;
const fi = E.infiniteFS({beta:30,c:0,phi:35,gamma:18,gammaSat:20,m:0}, 2);
const fiRef = Math.tan(35*Math.PI/180) / Math.tan(30*Math.PI/180);
let ok = true;
const check = (name, v, lo, hi) => { const pass = v >= lo && v <= hi; ok = ok && pass; console.log(`${pass?'LULUS':'GAGAL'}  ${name}: ${v.toFixed(3)} (jangkaan ${lo}-${hi})`); };
check('ACADS 1(a) Bishop', fb, 0.97, 1.01);
check('Cerun tak terhingga kering c=0', fi, fiRef - 1e-6, fiRef + 1e-6);

// Tembok penahan
const W = require('../src/wall.js'), D2R = Math.PI/180;
check('Baji cuba-jaya = Rankine (phi 30)', W.wedgeK(30,0,0,0,0).K, W.rankineKa(30)-1e-4, W.rankineKa(30)+1e-4);
for (const [phi,d,om,b] of [[30,20,10,0],[30,20,-10,0],[35,23,0,15],[30,20,-15,10]]) {
  const ref = W.coulombKa(phi,d,om,b); check(`Baji = Coulomb tertutup (${phi},${d},${om},${b})`, W.wedgeK(phi,d,om,b,0).K, ref-1e-3, ref+1e-3);
}
const psi = Math.atan(0.2), fr = 30*D2R;
const KAE = Math.cos(fr-psi)**2/(Math.cos(psi)**2*(1+Math.sqrt(Math.sin(fr)*Math.sin(fr-psi)/Math.cos(psi)))**2);
check('Mononobe-Okabe kh=0.2', W.wedgeK(30,0,0,0,0.2).K, KAE-1e-3, KAE+1e-3);
const wr = {type:'gravity',gravity:{H:3,Btop:2,Bbase:2,nf:0,gamma:24},backfill:{gamma:19,gammaSat:20,phi:30,beta:0,deltaRatio:0},
  found:{gamma:19,phi:30,c:0,D:0,qa:200,method:'qa',deltaRatio:20/30,cBase:0},water:{hw:0,hwf:0},loads:{q:0,kh:0},passive:{on:false,factor:0.5},
  fos:{sl:1.5,ot:2,br:3,sSl:1.1,sOt:1.5,sBr:2,eRock:false}};
const ex = W.runWall(wr).ext;
check('Tembok segi empat: FOS terbalik (tangan 5.053)', ex.FSo, 5.04, 5.06);
check('Tembok segi empat: FOS gelongsor (tangan 1.839)', ex.FSs, 1.83, 1.85);
check('Tembok segi empat: qmax (tangan 114.8 kPa)', ex.qmax, 114.5, 115.1);
const sp = W.sheetPile({backfill:{gamma:19,phi:30},loads:{q:0},sheet:{H:3,Fp:1,fy:355,Zprov:1000,extend:1.2}});
check('Cerucuk julur: D0/H (analitik 0.926)', sp.D0/3, 0.92, 0.93);
process.exit(ok ? 0 : 1);
