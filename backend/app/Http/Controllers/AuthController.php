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

}
