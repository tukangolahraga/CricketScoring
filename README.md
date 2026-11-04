# Cricket Performance Lab — Match Analyst Publik

[Buka aplikasi langsung](https://tukangolahraga.github.io/cricket-performance-lab/) · [Panduan pengguna](https://tukangolahraga.github.io/cricket-performance-lab/panduan-publik.html)

Aplikasi scoring dan analisis cricket untuk semua tim. Berjalan langsung di GitHub Pages, tanpa login dan tanpa membuka halaman Apps Script.

## Fitur

- T10, T20, 6s’ dan Super8; batas over/bowler dapat disesuaikan.
- Scoring runs, extras, wicket, target, dua innings, undo/redo dan autosave browser.
- Profil lawan dan matchup berdasarkan match aktif serta arsip yang dideduplikasi; bukti dan jumlah sampel tetap terlihat.
- Rencana per lawan: Plan A/Plan B, field placement, taktik batting, jadwal bowler/alternatif per over, serta evaluasi.
- Tema siang/malam, logo PCI DKI Jakarta, dan tab/popup ringkas.
- Impor/ekspor JSON serta CSV pertandingan.

## Penyimpanan versi publik

Setiap pengguna menyimpan datanya di browser/perangkat masing-masing. Tidak ada database bersama, unggahan otomatis, atau sinkronisasi lintas perangkat pada versi publik ini. Ekspor JSON untuk cadangan lengkap termasuk rencana; impor JSON untuk pindah perangkat. CSV pertandingan tidak mencakup rencana.

Menghapus data browser atau memakai mode incognito dapat memengaruhi autosave. Data pribadi/cloud yang pernah dipakai pemilik tidak dibuka ke publik.

## File

- `index.html`: aplikasi publik langsung pada alamat utama.
- `match-analyst.html`: aplikasi publik yang sama pada alamat alternatif.
- `panduan-publik.html`: cara scoring, arsip, taktik dan cadangan.
- `v6.4-popup-preserved.html`: V6.4 sebelumnya, disimpan terpisah.
- Berkas backend/dokumentasi lama tetap sebagai riwayat proyek; versi publik tidak memanggil backend tersebut.

Pembaruan hosting 5 November 2026. GitHub Pages memakai branch `main`, folder root, dan HTTPS.
