<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GuruController extends Controller
{
    public function index(Request $r)
    {
        return Guru::query()
            ->when($r->search, fn ($q, $s) => $q->where(
                fn ($w) => $w->where('nama', 'like', "%$s%")
                    ->orWhere('nip', 'like', "%$s%")
                    ->orWhere('jabatan', 'like', "%$s%")
            ))
            ->when($r->jenis, fn ($q, $v) => $q->where('jenis', $v))
            ->when($r->status, fn ($q, $v) => $q->where('status', $v))
            ->when($r->jabatan, fn ($q, $v) => $q->where('jabatan', $v))
            ->orderBy('id')
            ->paginate(min((int) $r->get('per_page', 10), 1000));
    }

    public function stats()
    {
        $total = Guru::count();
        $perJabatan = Guru::selectRaw('jabatan, COUNT(*) as total')
            ->groupBy('jabatan')->orderByDesc('total')->get();

        return [
            'total' => $total,
            'guru' => Guru::where('jenis', 'guru')->count(),
            'staff' => Guru::where('jenis', 'staff')->count(),
            'akun_aktif' => Guru::where('status', 'aktif')->count(),
            'akun_nonaktif' => Guru::where('status', 'tidak_aktif')->count(),
            'per_jabatan' => $perJabatan,
        ];
    }

    private function rules(?int $id = null): array
    {
        return [
            'nama' => 'required|string|max:255',
            'nip' => ['nullable', 'string', 'max:25', Rule::unique('guru', 'nip')->ignore($id)],
            'jabatan' => 'required|string|max:60',
            'jenis' => 'required|in:guru,staff',
            'status' => 'required|in:aktif,tidak_aktif',
        ];
    }

    public function store(Request $r)
    {
        return response()->json(Guru::create($r->validate($this->rules())), 201);
    }

    public function update(Request $r, Guru $guru)
    {
        $guru->update($r->validate($this->rules($guru->id)));

        return $guru;
    }

    public function destroy(Guru $guru)
    {
        $guru->delete();

        return response()->noContent();
    }
}
