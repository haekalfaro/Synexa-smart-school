<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $r)
    {
        $data = $r->validate(['email' => 'required|email', 'password' => 'required']);

        if (! Auth::attempt($data)) {
            throw ValidationException::withMessages(['email' => 'Email atau kata sandi salah.']);
        }

        $user = Auth::user();

        return [
            'token' => $user->createToken('spa')->plainTextToken,
            'user' => $user->only('id', 'name', 'email', 'role'),
        ];
    }

    public function me(Request $r)
    {
        return $r->user()->only('id', 'name', 'email', 'role');
    }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
