# Cricket Performance Lab — Match Analyst Edition

Aplikasi: https://tukangolahraga.github.io/CricketScoring/

Scoring lokal tanpa akun; direktori dan statistik publik; pencatat login email/password; draft dan taktik privat. T10, T20, 6s dan Super8 tersedia. V6.4 tetap terpisah di v6.4-popup-preserved.html.

Backend Supabase khusus Cricket Performance Lab sudah dipasang. Pendaftaran umum masih ditahan sampai SMTP dan alur konfirmasi email berhasil diuji. Jangan menganggap login/penyimpanan akun sudah diuji end-to-end sebelum aktivasi tersebut selesai.

Pencatat hanya dapat mengirim hasil untuk tim yang dikelolanya atau tim yang mengundangnya. Identitas pemain memakai UUID, tidak digabung berdasarkan nama saja. Server menghitung ulang statistik; revisi dan pengiriman ulang tidak menggandakan hasil. Draft dan rencana hanya dapat dibaca pemilik akun. Publikasi hasil selesai bersifat eksplisit atau memakai opsi otomatis yang dipilih pencatat.

Panduan pengguna: panduan-publik.html. Apps Script tidak dipakai sebagai halaman aplikasi publik. Kunci publik frontend bukan kunci server; jangan menaruh kredensial SMTP atau service-role di repository.

Validasi: 33 pengujian scoring/data, 5 pengujian rencana, 13 pengujian backend/client bersama; pengujian transaksi PostgreSQL untuk akses A/B/anon, hak tim, privasi, retry dan revisi telah dijalankan lalu dibatalkan agar tidak meninggalkan data contoh. Pengujian akun nyata menunggu SMTP.