<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Kehadiran;
use App\Models\Siswa;
use App\Services\AttendanceService;
use App\Services\ScannerRegistry;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $r, AttendanceService $svc, ScannerRegistry $scanners)
    {
        $date = $r->get('date', now()->toDateString());

        $recent = Kehadiran::with('siswa.kelas')
            ->whereDate('tanggal', $date)
            ->whereNotNull('waktu_masuk')
            ->orderByDesc('waktu_masuk')
            ->limit(5)
            ->get()
            ->map(fn ($k) => [
                'waktu' => substr($k->waktu_masuk, 0, 5),
                'nama' => $k->siswa->nama,
                'kelas' => $k->siswa->kelas->nama,
                'status' => $k->status,
                'gerbang' => $k->gerbang,
            ]);

        return [
            'tanggal' => $date,
            'school' => [
                'nama' => config('school.nama'),
                'tahun_ajaran' => config('school.tahun_ajaran'),
                'siswa_aktif' => Siswa::where('status', 'aktif')->count(),
                'guru_staff' => Guru::where('status', 'aktif')->count(),
            ],
            'summary' => $svc->summary($date),
            'hourly' => $svc->hourly($date),
            'per_kelas' => $svc->perKelas($date),
            'recent' => $recent,
            'trend' => $svc->trend($date, 7),
            'monthly' => $svc->monthly($date),
            'devices' => $scanners->all(),
        ];
    }
}
