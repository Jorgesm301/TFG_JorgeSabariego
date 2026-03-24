<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{

    //Funcio que redirige al usuario a Google para autenticarse
    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->with(['prompt' => 'select_account'])
            ->redirect();
    }

    //Funcion para manejar la devolución de llamada de Google
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            $email = $googleUser->getEmail();
            $fullName = $googleUser->getName() ?? 'Usuario Google';

            $nameParts = explode(' ', trim($fullName), 2);
            $name = $nameParts[0] ?? 'Usuario';
            $lastName = $nameParts[1] ?? '';

            $user = User::where('email', $email)->first();

            if (!$user) {
                $user = User::create([
                    'name' => $name,
                    'last_name' => $lastName,
                    'email' => $email,
                    'password' => bcrypt(Str::random(24)),
                ]);
            }

            $token = $user->createToken('google-token')->plainTextToken;

            return redirect(
                env('FRONTEND_URL') .
                '/auth/google/callback?token=' . urlencode($token) .
                '&name=' . urlencode($user->name) .
                '&last_name=' . urlencode($user->last_name ?? '') .
                '&email=' . urlencode($user->email)
            );
        } catch (\Exception $e) {
            return redirect(env('FRONTEND_URL') . '/login?error=google');
        }
    }
}
