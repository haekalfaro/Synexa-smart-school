<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ScannerKey
{
    public function handle(Request $request, Closure $next)
    {
        $key = (string) config('school.scanner_key');

        if ($key === '' || ! hash_equals($key, (string) $request->header('X-Scanner-Key'))) {
            abort(401, 'Kunci scanner tidak valid.');
        }

        return $next($request);
    }
}
