<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\KehadiranController;
use App\Http\Controllers\Api\KelasController;
use App\Http\Controllers\Api\ScanController;
use App\Http\Controllers\Api\SiswaController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

// Web scanner (tanpa login, dilindungi kunci X-Scanner-Key)
Route::post('/scan', [ScanController::class, 'store'])->middleware(['scanner', 'throttle:120,1']);
Route::post('/scanner/heartbeat', [ScanController::class, 'heartbeat'])->middleware(['scanner', 'throttle:240,1']);
Route::post('/scanner/frame', [ScanController::class, 'frame'])->middleware(['scanner', 'throttle:240,1']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Baca: semua role
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/kelas', [KelasController::class, 'index']);
    Route::get('/perangkat', [DeviceController::class, 'index']);
    Route::get('/perangkat/{id}/snapshot', [DeviceController::class, 'snapshot'])->where('id', '[a-z0-9-]+');
    Route::get('/kehadiran', [KehadiranController::class, 'index']);
    Route::get('/kehadiran/summary', [KehadiranController::class, 'summary']);
    Route::get('/siswa', [SiswaController::class, 'index']);
    Route::get('/siswa/stats', [SiswaController::class, 'stats']);
    Route::get('/guru', [GuruController::class, 'index']);
    Route::get('/guru/stats', [GuruController::class, 'stats']);

    // Tulis: admin & operator (kepala_sekolah hanya melihat)
    Route::middleware('role:admin,operator')->group(function () {
        Route::post('/kehadiran', [KehadiranController::class, 'store']);
        Route::apiResource('siswa', SiswaController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('guru', GuruController::class)->only(['store', 'update', 'destroy']);
    });
});
