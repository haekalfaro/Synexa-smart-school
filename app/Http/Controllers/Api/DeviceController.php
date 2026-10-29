<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ScannerRegistry;

class DeviceController extends Controller
{
    public function index(ScannerRegistry $scanners)
    {
        return ['data' => $scanners->all()];
    }

    /** Gambar terbaru dari scanner. Memanggil ini juga memberi tahu scanner bahwa ada yang memantau. */
    public function snapshot(string $id, ScannerRegistry $scanners)
    {
        $scanners->watch($id);
        $jpeg = $scanners->frame($id);

        if (! $jpeg) {
            return response()->noContent();
        }

        return response($jpeg, 200, ['Content-Type' => 'image/jpeg', 'Cache-Control' => 'no-store']);
    }
}
