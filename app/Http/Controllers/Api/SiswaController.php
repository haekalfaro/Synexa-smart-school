<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SiswaController extends Controller
{
    public function index(Request $r)
    {
        return Siswa::with('kelas')
            ->when($r->search, fn ($q, $s) => $q->where(
                fn ($w) => $w->where('nama', 'like', "%$s%")->orWhere('nis', 'like', "%$s%")->orWhere('barcode', 'like', "%$s%")
            ))
            ->when($r->kelas_id, fn ($q, $v) => $q->where('kelas_id', $v))
            ->when($r->jenjang, fn ($q, $v) => $q->whereHas('kelas', fn ($k) => $k->where('jenjang', $v)))
            ->when($r->status, fn ($q, $v) => $q->where('status', $v))
            ->orderBy('nis')
            ->paginate(min((int) $r->get('per_page', 10), 1000));
    }

    public function stats()
    {
        $total = Siswa::count();
        $aktif = Siswa::where('status', 'aktif')->count();

        $perJenjang = Siswa::join('kelas', 'kelas.id', '=', 'siswa.kelas_id')
            ->selectRaw('kelas.jenjang, COUNT(*) as total')
            ->groupBy('kelas.jenjang')->orderBy('kelas.jenjang')->get();

        $perKelas = Kelas::withCount([
            'siswa as total',
            'siswa as laki' => fn ($q) => $q->where('jenis_kelamin', 'L'),
            'siswa as perempuan' => fn ($q) => $q->where('jenis_kelamin', 'P'),
        ])->orderBy('nama')->get();

        return [
            'total' => $total,
            'aktif' => $aktif,
            'tidak_aktif' => $total - $aktif,
            'jumlah_kelas' => Kelas::count(),
            'per_jenjang' => $perJenjang,
            'per_kelas' => $perKelas,
        ];
    }

    private function rules(?int $id = null): array
    {
        return [
            'nis' => ['required', 'string', 'max:20', Rule::unique('siswa', 'nis')->ignore($id)],
            'nama' => 'required|string|max:255',
            'kelas_id' => 'required|exists:kelas,id',
            'jenis_kelamin' => 'required|in:L,P',
            'status' => 'required|in:aktif,tidak_aktif',
            'kontak_orang_tua' => 'nullable|string|max:20',
        ];
    }

    public function store(Request $r)
    {
        return response()->json(Siswa::create($r->validate($this->rules()))->load('kelas'), 201);
    }

    public function update(Request $r, Siswa $siswa)
    {
        $siswa->update($r->validate($this->rules($siswa->id)));

        return $siswa->load('kelas');
    }

    public function destroy(Siswa $siswa)
    {
        $siswa->delete();

        return response()->noContent();
    }
}
