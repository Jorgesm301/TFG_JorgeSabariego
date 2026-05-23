<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }


        $user = User::create([
            'name' => $request->name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);


        return response()->json([
            'message' => '¡Usuario registrado correctamente!',
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        //Buscamos usuario por email.
        $user = User::where('email', $request->email)->first();

        //Verficamos si el usuario existe y la contraseña es correcta.
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        //Creamos el token de acceso con Sanctum.
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login exitoso',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 200);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $user->update([
            'name' => $request->name,
            'last_name' => $request->last_name,
            'email' => $request->email,
        ]);

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'user' => $user
        ], 200);
    }

    public function verifyPassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // Verificamos que la contraseña sea correcta
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'valid' => false,
                'message' => 'La contraseña actual es incorrecta'
            ], 200);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Contraseña verificada correctamente'
        ], 200);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // Verificamos que la contraseña actual sea correcta
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta'
            ], 401);
        }

        // Actualizamos la contraseña
        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada correctamente'
        ], 200);
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user();

        $reservasUnidas = $user->bookings()->get();

        foreach ($reservasUnidas as $reserva) {
            if ($reserva->jugadores_actuales > 0) {
                $reserva->decrement('jugadores_actuales');
            }

            // Si la reserva estaba completa, cambiarla a abierto
            if ($reserva->estado === 'completo') {
                $reserva->update(['estado' => 'abierto']);
            }
        }

        // Desvinculamos al usuario de todas sus reservas
        $user->bookings()->detach();

        $reservasCreadas = $user->bookingsCreadas()->get();

        foreach ($reservasCreadas as $reserva) {

            $otrosJugadores = $reserva->usuarios()->count();

            if ($otrosJugadores > 0) {
                $primerJugador = $reserva->usuarios()->first();
                $reserva->update(['creador_id' => $primerJugador->id]);
            } else {
                $reserva->delete();
            }
        }

        $user->tokens()->delete();

        // Eliminamos el usuario
        $user->delete();

        return response()->json([
            'message' => 'Cuenta eliminada correctamente'
        ], 200);
    }

}
