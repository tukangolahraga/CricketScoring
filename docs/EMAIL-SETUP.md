# Email verifikasi Cricket Performance Lab

Status: SMTP belum aktif. Pendaftaran, pemulihan, dan kirim ulang verifikasi tetap dinonaktifkan sampai pengiriman email diuji.

## Informasi yang perlu disediakan pengelola
- Domain yang dimiliki dan alamat pengirim pada domain tersebut.
- Nama layanan email/SMTP dan akses dashboard penyedia.
- Akses DNS untuk verifikasi domain (SPF/DKIM sesuai instruksi penyedia).
- SMTP host, port, username dan password dari penyedia; isi langsung pada dashboard Supabase, jangan simpan di repository atau chat.

## Konfigurasi
1. Verifikasi domain dan alamat pengirim di penyedia email.
2. Supabase Authentication → Emails → SMTP Settings: aktifkan custom SMTP.
3. Isi alamat pengirim terverifikasi dan nama "Cricket Performance Lab", lalu host/port/username/password sesuai penyedia. Simpan.
4. Authentication → URL Configuration: Site URL dan redirect yang diizinkan mencakup https://tukangolahraga.github.io/CricketScoring/.
5. Pastikan email/password aktif, konfirmasi email tetap wajib, dan anonymous sign-in tidak digunakan.
6. Gunakan template email-konfirmasi.html sebagai body Confirm signup. Tautan harus menggunakan {{ .ConfirmationURL }}.
7. Uji kirim ke alamat milik pengelola dengan persetujuannya. Periksa inbox/spam, tautan kembali ke aplikasi, login akun terverifikasi dan pemulihan kata sandi.
8. Setelah uji berhasil, ubah DB_CONFIG.registrationReady menjadi true di index.html dan match-analyst.html. Sesuaikan registrationNote dan loginGateNote agar tidak lagi menyebut SMTP belum aktif.

Tidak ada email percobaan yang telah dikirim oleh perubahan ini. Backend tetap memerlukan email terkonfirmasi dan hak tim untuk menyimpan hasil. Cadangan lama tetap tersedia untuk impor setelah login.
