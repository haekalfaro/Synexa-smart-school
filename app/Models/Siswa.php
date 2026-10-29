<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Siswa extends Model
{
    protected $table = 'siswa';
    protected $fillable = ['nis', 'nama', 'kelas_id', 'jenis_kelamin', 'status', 'kontak_orang_tua'];

    protected static function booted(): void
    {
        // Setiap siswa baru otomatis mendapat barcode unik: SYX + 10 digit.
        static::creating(function (Siswa $s) {
            if (! $s->barcode) {
                $s->barcode = self::generateBarcode();
            }
        });
    }

    public static function generateBarcode(): string
    {
        do {
            $code = 'SYX' . str_pad((string) random_int(0, 9999999999), 10, '0', STR_PAD_LEFT);
        } while (static::where('barcode', $code)->exists());

        return $code;
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }

    public function kehadiran()
    {
        return $this->hasMany(Kehadiran::class, 'siswa_id');
    }
}
