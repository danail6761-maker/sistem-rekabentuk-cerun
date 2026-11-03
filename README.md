# Sistem Rekabentuk Cerun

Aplikasi web (satu fail HTML, tiada pelayan) untuk rekabentuk cerun mengikut kriteria FOS JKR.

## Cara guna
Buka `Sistem-Rekabentuk-Cerun.html` dalam Chrome/Edge. Data disimpan automatik dalam pelayar.
Gunakan "Simpan .json" untuk menyimpan projek dan "Cetak laporan" untuk menyimpan laporan sebagai PDF.

## Modul
1. Maklumat projek  2. Geometri (tingkat, berm, semakan amalan lazim)  3. Lapisan tanah
4. Air bumi (garis freatik / ru), surcaj, seismik kh  5. Analisis bulatan: Bishop, Fellenius, Janbu (carian grid + perhalusan)
6. Paku tanah (tegangan, cabut keluar, FOS bertetulang)  7. Cerun tak terhingga  8. Kerja tanah & kuantiti
9. Kriteria FOS JKR (boleh ubah)  10. Laporan bercetak

## Pengesahan
Penanda aras ACADS 1(a): Bishop 0.990 (rujukan 0.987–1.00), Fellenius 0.946.
Jurutera Profesional mesti mengesahkan keputusan sebelum digunakan untuk pembinaan.

## Struktur kod
- `src/engine.js`: enjin kiraan (boleh diuji dengan Node)
- `src/app.html`: antara muka
- `tests/benchmark.js`: ujian penanda aras (`node tests/benchmark.js`)
- `docs/`: draf BRS 20 soalan
- `python3 build.py`: gabungkan menjadi `Sistem-Rekabentuk-Cerun.html` dan `dist/artifact.html`
