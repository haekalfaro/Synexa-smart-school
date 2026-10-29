<?php

namespace App\Services;

use App\Models\Kehadiran;
use App\Models\Kelas;
use App\Models\Siswa;
use Carbon\Carbon;

class AttendanceService
{
    private function pct(int $n, int $total): float
    {
        return $total > 0 ? round($n / $total * 100, 1) : 0.0;
    }

    /** Ringkasan satu hari. Siswa aktif tanpa catatan dihitung tidak hadir. */
    public function summary(string $date): array
    {
        $total = Siswa::where('status', 'aktif')->count();

        $counts = Kehadiran::query()
            ->join('siswa', 'siswa.id', '=', 'kehadiran.siswa_id')
            ->where('siswa.status', 'aktif')
            ->whereDate('kehadiran.tanggal', $date)
            ->selectRaw('kehadiran.status, COUNT(*) as c')
            ->groupBy('kehadiran.status')
            ->pluck('c', 'status');

        $hadir = (int) ($counts['hadir'] ?? 0);
        $terlambat = (int) ($counts['terlambat'] ?? 0);
        $tidak = max($total - $hadir - $terlambat, 0);

        return [
            'tanggal' => $date,
            'total' => $total,
            'hadir' => $hadir,
            'terlambat' => $terlambat,
            'tidak_hadir' => $tidak,
            'persen_hadir' => $this->pct($hadir, $total),
            'persen_terlambat' => $this->pct($terlambat, $total),
            'persen_tidak_hadir' => $this->pct($tidak, $total),
        ];
    }

    public function perKelas(string $date): array
    {
        $kelas = Kelas::withCount(['siswa as total' => fn ($q) => $q->where('status', 'aktif')])
            ->orderBy('nama')->get();

        $att = Kehadiran::query()
            ->join('siswa', 'siswa.id', '=', 'kehadiran.siswa_id')
            ->where('siswa.status', 'aktif')
            ->whereDate('kehadiran.tanggal', $date)
            ->selectRaw('siswa.kelas_id, kehadiran.status, COUNT(*) as c')
            ->groupBy('siswa.kelas_id', 'kehadiran.status')
            ->get()
            ->groupBy('kelas_id');

        return $kelas->map(function ($k) use ($att) {
            $rows = ($att[$k->id] ?? collect())->pluck('c', 'status');
            $hadir = (int) ($rows['hadir'] ?? 0);
            $terlambat = (int) ($rows['terlambat'] ?? 0);

            return [
                'kelas' => $k->nama,
                'hadir' => $hadir,
                'terlambat' => $terlambat,
                'tidak_hadir' => max($k->total - $hadir - $terlambat, 0),
                'total' => $k->total,
                'persen' => $this->pct($hadir, $k->total),
            ];
        })->values()->all();
    }

    /** Jumlah masuk per jam (06:00–13:00) untuk grafik harian. */
    public function hourly(string $date): array
    {
        $rows = Kehadiran::query()
            ->whereDate('tanggal', $date)
            ->whereNotNull('waktu_masuk')
            ->whereIn('status', ['hadir', 'terlambat'])
            ->selectRaw('HOUR(waktu_masuk) as h, status, COUNT(*) as c')
            ->groupBy('h', 'status')
            ->get();

        $labels = $hadir = $terlambat = [];
        for ($h = 6; $h <= 13; $h++) {
            $labels[] = sprintf('%02d:00', $h);
            $hadir[] = (int) $rows->where('h', $h)->where('status', 'hadir')->sum('c');
            $terlambat[] = (int) $rows->where('h', $h)->where('status', 'terlambat')->sum('c');
        }

        return compact('labels', 'hadir', 'terlambat');
    }

    /** Tren N hari terakhir sampai $date (hari tanpa data sama sekali dilewati). */
    public function trend(string $date, int $days = 7): array
    {
        $out = [];
        $end = Carbon::parse($date);
        for ($i = $days - 1; $i >= 0; $i--) {
            $d = $end->copy()->subDays($i);
            if (! Kehadiran::whereDate('tanggal', $d)->exists()) {
                continue;
            }
            $s = $this->summary($d->toDateString());
            $out[] = [
                'label' => $d->format('j M'),
                'hadir' => $s['hadir'],
                'terlambat' => $s['terlambat'],
                'tidak_hadir' => $s['tidak_hadir'],
            ];
        }

        return $out;
    }

    /** Rekap bulan berjalan dari $date. */
    public function monthly(string $date): array
    {
        $d = Carbon::parse($date);
        $q = fn () => Kehadiran::whereYear('tanggal', $d->year)->whereMonth('tanggal', $d->month);

        $days = $q()->distinct('tanggal')->count('tanggal');
        $hadir = $q()->where('status', 'hadir')->count();
        $terlambat = $q()->where('status', 'terlambat')->count();
        $expected = Siswa::where('status', 'aktif')->count() * $days;
        $tidak = max($expected - $hadir - $terlambat, 0);

        return [
            'bulan' => $d->translatedFormat('F Y'),
            'persen_hadir' => $this->pct($hadir, $expected),
            'persen_terlambat' => $this->pct($terlambat, $expected),
            'persen_tidak_hadir' => $this->pct($tidak, $expected),
        ];
    }
}
