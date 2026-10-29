# Synexa Smart School

Laravel (API) + React (Vite) + MySQL + Chart.js. Tiga bagian:

| Folder | Fungsi | Alamat dev |
|---|---|---|
| `backend/` | File tambahan untuk proyek Laravel (model, controller, routes, SQL) | http://127.0.0.1:8000 |
| `frontend/` | Web admin (dashboard, siswa, guru, kehadiran) | http://localhost:5173 |
| `scanner/` | Web scanner barcode (kamera siaga terus) | http://localhost:5174 |

## Alur
1. Admin menambah siswa di web admin → siswa otomatis mendapat barcode unik (`SYX` + 10 digit). Kartu barcode bisa dicetak.
2. Scanner membaca barcode lewat kamera dan mengirimnya ke `POST /api/scan`.
3. Server mencatat kehadiran memakai jam server:
   - sampai 07:30:00 → **hadir** (tepat waktu)
   - lewat 07:30:00 → **terlambat**
   - scan kedua di hari yang sama tidak mengubah catatan pertama.
4. Dashboard dan halaman Kehadiran memuat ulang otomatis tiap 15 detik.
5. Selama halaman scanner terbuka di browser, ia mengirim heartbeat tiap 10 detik. Di dashboard, kartu "Status Perangkat Gerbang" menampilkan perangkat itu (mis. Scanner 1) sebagai Online; offline bila tidak ada heartbeat 30 detik. Data heartbeat disimpan di cache Laravel (`CACHE_DRIVER=file`).

Batas jam diatur di `.env` Laravel: `SCHOOL_BATAS_MASUK=07:30`.

## Pengaturan Laravel
- `config/app.php` → `'timezone' => 'Asia/Jakarta'` (WAJIB, kalau tidak jam scan salah 7 jam)
- `.env` → tambahkan `SCANNER_KEY=` dengan teks rahasia buatan sendiri
- Daftarkan dua middleware (Laravel 10: `app/Http/Kernel.php`, di `$middlewareAliases`):
  ```php
  'role' => \App\Http\Middleware\RoleMiddleware::class,
  'scanner' => \App\Http\Middleware\ScannerKey::class,
  ```
  (Laravel 11+: `$middleware->alias([...])` di `bootstrap/app.php`)

## Scanner
```bash
cd scanner
copy .env.example .env     # isi VITE_SCANNER_KEY sama dengan SCANNER_KEY Laravel
npm install
npm run dev                # http://localhost:5174
```
Kamera hanya bisa dipakai di `localhost` atau alamat `https://`.

## Database
- Instalasi baru: impor `backend/database/sql/schema.sql` (struktur + daftar kelas, tanpa data dummy).
- Sudah terlanjur impor versi pertama: jalankan `migrasi_barcode.sql` sekali (hapus data dummy + tambah kolom barcode).
