<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kehadiran;
use App\Models\Siswa;
use App\Services\ScannerRegistry;
use Illuminate\Http\Request;

class ScanController extends Controller
{
    /** Dikirim web scanner tiap ~10 detik supaya muncul sebagai perangkat online di dashboard. */
    public function heartbeat(Request $r, ScannerRegistry $registry)
    {
        $d = $r->validate([
            'nama' => 'required|string|max:40',
            'gerbang' => 'nullable|string|max:40',
            'kamera' => 'nullable|boolean',
        ]);

        $id = $registry->touch($d['nama'], $d['gerbang'] ?? null, (bool) ($d['kamera'] ?? false));

        // stream = true berarti ada admin yang sedang membuka live view; scanner mulai kirim cuplikan.
        return ['stream' => $registry->isWatched($id)];
    }

    /** Cuplikan kamera (JPEG kecil) dari scanner, hanya dikirim saat ada yang memantau. */
    public function frame(Request $r, ScannerRegistry $registry)
    {
        $d = $r->validate([
            'nama' => 'required|string|max:40',
            'image' => 'required|string|max:300000',
        ]);

        $id = $registry->idFor($d['nama']);
        $bin = base64_decode(preg_replace('#^data:image/jpeg;base64,#', '', $d['image']), true);

        if ($bin === false || strncmp($bin, "\xFF\xD8", 2) !== 0) {
            return response()->json(['message' => 'Gambar tidak valid.'], 422);
        }

        $registry->putFrame($id, $bin);

        return ['stream' => $registry->isWatched($id)];
    }

    /**
     * Dipanggil web scanner. Waktu diambil dari server (bukan dari perangkat scanner)
     * supaya tidak bisa dimanipulasi dan semua gerbang memakai jam yang sama.
     */
    public function store(Request $r)
    {
        $data = $r->validate([
            'barcode' => 'required|string|max:50',
            'gerbang' => 'nullable|string|max:40',
        ]);

        $code = strtoupper(trim($data['barcode']));
        $siswa = Siswa::with('kelas')->where('barcode', $code)->first();

        if (! $siswa) {
            return response()->json(['result' => 'tidak_dikenal', 'message' => 'Barcode tidak terdaftar.'], 404);
        }

        $info = ['nama' => $siswa->nama, 'nis' => $siswa->nis, 'kelas' => $siswa->kelas->nama];

        if ($siswa->status !== 'aktif') {
            return response()->json(['result' => 'tidak_aktif', 'message' => 'Siswa berstatus tidak aktif.', 'siswa' => $info], 403);
        }

        $now = now();
        $tanggal = $now->toDateString();

        $existing = Kehadiran::where('siswa_id', $siswa->id)->whereDate('tanggal', $tanggal)->first();
        if ($existing && in_array($existing->status, ['hadir', 'terlambat'], true)) {
            return response()->json([
                'result' => 'sudah',
                'message' => 'Sudah tercatat hari ini.',
                'status' => $existing->status,
                'waktu' => substr((string) $existing->waktu_masuk, 0, 5),
                'siswa' => $info,
            ]);
        }

        // "H:i:s" bisa dibandingkan sebagai teks. Tepat 07:30:00 masih tepat waktu.
        $terlambat = $now->format('H:i:s') > config('school.batas_masuk', '07:30') . ':00';
        $status = $terlambat ? 'terlambat' : 'hadir';

        Kehadiran::updateOrCreate(
            ['siswa_id' => $siswa->id, 'tanggal' => $tanggal],
            ['waktu_masuk' => $now->format('H:i:s'), 'status' => $status, 'gerbang' => $data['gerbang'] ?? null]
        );

        return [
            'result' => 'ok',
            'status' => $status,
            'waktu' => $now->format('H:i'),
            'batas' => config('school.batas_masuk', '07:30'),
            'siswa' => $info,
        ];
    }
}
