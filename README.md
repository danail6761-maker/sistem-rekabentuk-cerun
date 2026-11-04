# Sistem Rekabentuk Cerun

Aplikasi web (satu fail HTML, tiada pelayan) untuk rekabentuk cerun mengikut kriteria FOS JKR.

## Cara guna
Buka `Sistem-Rekabentuk-Cerun.html` dalam Chrome/Edge. Data disimpan automatik dalam pelayar.
Gunakan "Simpan .json" untuk menyimpan projek dan "Cetak laporan" untuk menyimpan laporan sebagai PDF.

## Modul
1. Maklumat projek  2. Geometri (tingkat, berm, semakan amalan lazim)  3. Lapisan tanah
4. Air bumi (garis freatik / ru), surcaj, seismik kh  5. Analisis bulatan: Bishop, Fellenius, Janbu (carian grid + perhalusan)
6. Paku tanah (tegangan, cabut keluar, FOS bertetulang)  7. Cerun tak terhingga  8. Kerja tanah & kuantiti
9. Tembok penahan  10. Kriteria FOS JKR (boleh ubah)  11. Laporan bercetak

### Tembok penahan
Jenis: konkrit graviti, batu-batan (rubble), gabion, RC julur (cantilever), tanah bertetulang (MSE), crib, cerucuk keping julur (sheet pile).
- Tekanan tanah: baji cuba-jaya Coulomb (muka condong, timbus bercerun, seismik Mononobe–Okabe), air bumi, surcaj
- Kestabilan luaran: gelongsor, terbalik, kesipian, tekanan galas, keupayaan galas EC7 Lampiran D, rintangan pasif (pilihan)
- Semakan dalaman: setiap aras lapis gabion; keratan dalaman graviti/batu-batan/crib (tiada tegangan, tegasan mampatan)
- RC: rekabentuk tetulang dan ricih batang, tumit dan kaki (EC2)
- MSE: tegangan dan cabut keluar setiap lapisan tetulang
- Cerucuk keping: kedalaman benaman, momen maksimum, modulus keratan diperlukan
- Kuantiti anggaran bahan dan besi

## Pengesahan
Penanda aras ACADS 1(a): Bishop 0.990 (rujukan 0.987–1.00), Fellenius 0.946.
Tembok: baji cuba-jaya sepadan dengan Rankine, Coulomb tertutup dan Mononobe–Okabe; semakan tangan tembok segi empat; cerucuk julur D0/H = 0.926 (analitik). Jalankan `node tests/benchmark.js`.
Jurutera Profesional mesti mengesahkan keputusan sebelum digunakan untuk pembinaan.

## Struktur kod
- `src/engine.js`: enjin kiraan (boleh diuji dengan Node)
- `src/wall.js`: enjin tembok penahan
- `src/app.html`, `src/wall-ui.part.js`: antara muka
- `tests/benchmark.js`: ujian penanda aras (`node tests/benchmark.js`)
- `docs/`: draf BRS 20 soalan
- `python3 build.py`: gabungkan menjadi `Sistem-Rekabentuk-Cerun.html` dan `dist/artifact.html`

## Hos di GitHub Pages
Repo ini sedia untuk GitHub Pages (`index.html` di akar repo).
Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)` → Save.
Aplikasi akan tersedia di `https://<pengguna>.github.io/<nama-repo>/`.
