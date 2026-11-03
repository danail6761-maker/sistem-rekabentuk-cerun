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
process.exit(ok ? 0 : 1);
