<?php

namespace App\Http\Controllers;

use App\Models\BlockedUser;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BlockedUserController extends Controller
{
    // Bloquear usuario
    public function bloquearUsuario(Request $request)
    {
        try {
            $request->validate([
                'blocked_user_id' => 'required|exists:users,id',
            ]);

            $userId = Auth::id();
            $blockedUserId = $request->blocked_user_id;

            // Para que un usuario no se bloquee a sí mismo
            if ($userId == $blockedUserId) {
                return response()->json(['message' => 'No puedes bloquearte a ti mismo'], 400);
            }

            // Verificar si ya está bloqueado
            $yaEstaBloquedo = BlockedUser::where('user_id', $userId)
                ->where('blocked_user_id', $blockedUserId)
                ->exists();

            if ($yaEstaBloquedo) {
                return response()->json(['message' => 'Este usuario ya está bloqueado'], 400);
            }

            // Bloquear usuario pero manteniendo la amistad
            $bloqueo = BlockedUser::create([
                'user_id' => $userId,
                'blocked_user_id' => $blockedUserId,
            ]);

            return response()->json([
                'message' => 'Usuario bloqueado correctamente',
                'bloqueo' => $bloqueo
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al bloquear usuario: ' . $e->getMessage()], 500);
        }
    }

    // Desbloquear usuario
    public function desbloquearUsuario($blockedUserId)
    {
        try {
            $userId = Auth::id();

            $bloqueo = BlockedUser::where('user_id', $userId)
                ->where('blocked_user_id', $blockedUserId)
                ->first();

            if (!$bloqueo) {
                return response()->json(['message' => 'Este usuario no está bloqueado'], 404);
            }

            $bloqueo->delete();

            return response()->json(['message' => 'Usuario desbloqueado correctamente']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al desbloquear usuario: ' . $e->getMessage()], 500);
        }
    }

    // Listar usuarios bloqueados
    public function listarBloqueados()
    {
        try {
            $userId = Auth::id();

            $bloqueados = BlockedUser::where('user_id', $userId)
                ->with('blockedUser:id,name,email')
                ->get()
                ->map(function ($bloqueo) {
                    return [
                        'id' => $bloqueo->id,
                        'usuario' => $bloqueo->blockedUser,
                        'bloqueado_en' => $bloqueo->created_at,
                    ];
                });

            return response()->json($bloqueados);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al listar bloqueados: ' . $e->getMessage()], 500);
        }
    }
}
