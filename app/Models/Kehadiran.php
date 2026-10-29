<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kehadiran extends Model
{
    protected $table = 'kehadiran';
    protected $fillable = ['siswa_id', 'tanggal', 'waktu_masuk', 'status', 'gerbang'];
    protected $casts = ['tanggal' => 'date:Y-m-d'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'siswa_id');
    }
}
