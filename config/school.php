<?php

return [
    'nama' => env('SCHOOL_NAME', 'SMP Negeri 166 Jakarta'),
    'tahun_ajaran' => env('SCHOOL_YEAR', '2024/2025'),

    // Scan sampai jam ini (HH:MM, waktu server) = tepat waktu. Lewat dari ini = terlambat.
    'batas_masuk' => env('SCHOOL_BATAS_MASUK', '07:30'),

    // Kunci rahasia yang dikirim web scanner lewat header X-Scanner-Key.
    'scanner_key' => env('SCANNER_KEY'),
];
