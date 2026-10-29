<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Mencatat perangkat scanner yang mengirim heartbeat.
 * Disimpan di cache Laravel (CACHE_DRIVER=file), jadi tidak perlu tabel baru.
 */
class ScannerRegistry
{
    /** Scanner dianggap online bila heartbeat terakhir kurang dari ini (detik). */
    public const ONLINE_SECONDS = 30;

    public function idFor(string $nama): string
    {
        return Str::slug($nama) ?: 'scanner';
    }

    public function touch(string $nama, ?string $gerbang, bool $kamera): string
    {
        $id = $this->idFor($nama);

        Cache::forever("scanner:$id", [
            'nama' => $nama,
            'gerbang' => $gerbang,
            'kamera' => $kamera,
            'last_seen' => now()->timestamp,
        ]);

        $index = Cache::get('scanner:index', []);
        if (! in_array($id, $index, true)) {
            $index[] = $id;
            Cache::forever('scanner:index', $index);
        }

        return $id;
    }

    /** Admin sedang melihat live view? Berlaku 20 detik sejak permintaan gambar terakhir. */
    public function watch(string $id): void
    {
        Cache::put("scanner:watch:$id", true, now()->addSeconds(20));
    }

    public function isWatched(string $id): bool
    {
        return Cache::has("scanner:watch:$id");
    }

    /** Hanya cuplikan terbaru yang disimpan (maks. 1 menit), tidak ada rekaman. */
    public function putFrame(string $id, string $jpeg): void
    {
        Cache::put("scanner:frame:$id", ['at' => now()->timestamp, 'jpeg' => base64_encode($jpeg)], now()->addMinute());
    }

    public function frame(string $id): ?string
    {
        $f = Cache::get("scanner:frame:$id");
        if (! $f || now()->timestamp - $f['at'] > 15) {
            return null;
        }

        return base64_decode($f['jpeg']);
    }

    public function all(): array
    {
        return collect(Cache::get('scanner:index', []))
            ->map(function ($id) {
                $d = Cache::get("scanner:$id");
                if (! $d) {
                    return null;
                }

                return [
                    'id' => $id,
                    'nama' => $d['nama'],
                    'gerbang' => $d['gerbang'],
                    'kamera' => $d['kamera'],
                    'status' => now()->timestamp - $d['last_seen'] <= self::ONLINE_SECONDS ? 'online' : 'offline',
                    'terakhir_online' => Carbon::createFromTimestamp($d['last_seen'])->format('j M H:i'),
                ];
            })
            ->filter()->sortBy('nama')->values()->all();
    }
}
