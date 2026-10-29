<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kehadiran;
use App\Models\Siswa;
use App\Services\AttendanceService;
use Illuminate\Http\Request;

class KehadiranController extends Controller
{
    /** Daftar semua siswa aktif beserta status kehadiran pada tanggal tertentu. */
    public function index(Request $r)
    {
        $date = $r->get('date', now()->toDateString());
        $onDate = fn ($k) => $k->whereDate('tanggal', $date);

        $q = Siswa::with(['kelas', 'kehadiran' => $onDate])
            ->where('status', 'aktif')
            ->when($r->search, fn ($q, $s) => $q->where(
                fn ($w) => $w->where('nama', 'like', "%$s%")->orWhere('nis', 'like', "%$s%")
            ))
            ->when($r->kelas_id, fn ($q, $v) => $q->where('kelas_id', $v))
            ->when($r->status, function ($q, $st) use ($date) {
                if ($st === 'tidak_hadir') {
                    $q->whereDoesntHave('kehadiran', fn ($k) => $k->whereDate('tanggal', $date)
                        ->whereIn('status', ['hadir', 'terlambat']));
                } else {
                    $q->whereHas('kehadiran', fn ($k) => $k->whereDate('tanggal', $date)->where('status', $st));
                }
            })
            ->orderBy('nis');

        return $q->paginate(min((int) $r->get('per_page', 10), 1000))->through(function ($s) {
            $k = $s->kehadiran->first();

            return [
                'siswa_id' => $s->id,
                'nis' => $s->nis,
                'nama' => $s->nama,
                'kelas' => $s->kelas->nama,
                'waktu_masuk' => $k && $k->waktu_masuk ? substr($k->waktu_masuk, 0, 5) : null,
                'status' => $k && $k->status !== 'tidak_hadir' ? $k->status : 'tidak_hadir',
                'gerbang' => $k?->gerbang,
            ];
        });
    }

    public function summary(Request $r, AttendanceService $svc)
    {
        $date = $r->get('date', now()->toDateString());

        return [
            'summary' => $svc->summary($date),
            'per_kelas' => $svc->perKelas($date),
            'trend' => $svc->trend($date, 7),
        ];
    }

    /** Catat / ubah kehadiran satu siswa pada satu tanggal. */
    public function store(Request $r)
    {
        $data = $r->validate([
            'siswa_id' => 'required|exists:siswa,id',
            'tanggal' => 'required|date',
            'status' => 'required|in:hadir,terlambat,tidak_hadir',
            'waktu_masuk' => 'nullable|date_format:H:i',
            'gerbang' => 'nullable|string|max:40',
        ]);

        if ($data['status'] === 'tidak_hadir') {
            $data['waktu_masuk'] = null;
            $data['gerbang'] = null;
        }

        $row = Kehadiran::updateOrCreate(
            ['siswa_id' => $data['siswa_id'], 'tanggal' => $data['tanggal']],
            $data
        );

        return response()->json($row, 201);
    }
}
