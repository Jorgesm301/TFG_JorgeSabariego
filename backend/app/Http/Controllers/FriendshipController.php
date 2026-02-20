<?php

namespace App\Http\Controllers;

use App\Models\Friendship;
use App\Models\User;
use App\Models\BlockedUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FriendshipController extends Controller
{
    // Enviar solicitud de amistad
    public function enviarSolicitud(Request $request)
    {
        try {
            $request->validate([
                'friend_id' => 'required|exists:users,id',
            ]);

            $userId = Auth::id();
            $friendId = $request->friend_id;

            // No puedes enviarte solicitud a ti mismo
            if ($userId == $friendId) {
                return response()->json(['message' => 'No puedes enviarte solicitud a ti mismo'], 400);
            }

            // Verificar si el usuario está bloqueado
            $estaBloqueado = BlockedUser::where(function ($query) use ($userId, $friendId) {
                $query->where('user_id', $userId)->where('blocked_user_id', $friendId);
            })->orWhere(function ($query) use ($userId, $friendId) {
                $query->where('user_id', $friendId)->where('blocked_user_id', $userId);
            })->exists();

            if ($estaBloqueado) {
                return response()->json(['message' => 'No puedes enviar solicitud a este usuario'], 403);
            }

            // Verificar si ya existe una solicitud
            $solicitudExistente = Friendship::where(function ($query) use ($userId, $friendId) {
                $query->where('user_id', $userId)->where('friend_id', $friendId);
            })->orWhere(function ($query) use ($userId, $friendId) {
                $query->where('user_id', $friendId)->where('friend_id', $userId);
            })->first();

            if ($solicitudExistente) {
                if ($solicitudExistente->status === 'accepted') {
                    return response()->json(['message' => 'Ya sois amigos'], 400);
                }
                return response()->json(['message' => 'Ya existe una solicitud pendiente'], 400);
            }

            // Crear la solicitud
            $friendship = Friendship::create([
                'user_id' => $userId,
                'friend_id' => $friendId,
                'status' => 'pending',
            ]);

            return response()->json([
                'message' => 'Solicitud enviada correctamente',
                'friendship' => $friendship
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al enviar solicitud: ' . $e->getMessage()], 500);
        }
    }

    // Aceptar solicitud de amistad
    public function aceptarSolicitud($id)
    {
        try {
            $userId = Auth::id();

            $friendship = Friendship::findOrFail($id);

            // Solo el receptor puede aceptar
            if ($friendship->friend_id != $userId) {
                return response()->json(['message' => 'No tienes permiso para aceptar esta solicitud'], 403);
            }

            if ($friendship->status !== 'pending') {
                return response()->json(['message' => 'Esta solicitud ya fue procesada'], 400);
            }

            $friendship->update(['status' => 'accepted']);

            return response()->json([
                'message' => 'Solicitud aceptada',
                'friendship' => $friendship
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al aceptar solicitud: ' . $e->getMessage()], 500);
        }
    }

    // Rechazar solicitud de amistad
    public function rechazarSolicitud($id)
    {
        try {
            $userId = Auth::id();

            $friendship = Friendship::findOrFail($id);

            // Solo el receptor puede rechazar
            if ($friendship->friend_id != $userId) {
                return response()->json(['message' => 'No tienes permiso para rechazar esta solicitud'], 403);
            }

            if ($friendship->status !== 'pending') {
                return response()->json(['message' => 'Esta solicitud ya fue procesada'], 400);
            }

            $friendship->update(['status' => 'rejected']);

            return response()->json(['message' => 'Solicitud rechazada']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al rechazar solicitud: ' . $e->getMessage()], 500);
        }
    }

    // Listar mis amigos
    public function listarAmigos()
    {
        try {
            $userId = Auth::id();

            $amigos = DB::table('friendships')
                ->where('status', 'accepted')
                ->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId)
                          ->orWhere('friend_id', $userId);
                })
                ->get()
                ->map(function ($friendship) use ($userId) {
                    $friendId = $friendship->user_id == $userId ? $friendship->friend_id : $friendship->user_id;
                    return User::find($friendId);
                });

            return response()->json($amigos);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al listar amigos: ' . $e->getMessage()], 500);
        }
    }

    // Listar solicitudes pendientes (recibidas)
    public function listarSolicitudesPendientes()
    {
        try {
            $userId = Auth::id();

            $solicitudes = Friendship::where('friend_id', $userId)
                ->where('status', 'pending')
                ->with('user:id,name,email')
                ->get();

            return response()->json($solicitudes);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al listar solicitudes: ' . $e->getMessage()], 500);
        }
    }

    // Eliminar amistad
    public function eliminarAmistad($id)
    {
        try {
            $userId = Auth::id();

            $friendship = Friendship::findOrFail($id);

            // Solo los involucrados pueden eliminar la amistad
            if ($friendship->user_id != $userId && $friendship->friend_id != $userId) {
                return response()->json(['message' => 'No tienes permiso para eliminar esta amistad'], 403);
            }

            $friendship->delete();

            return response()->json(['message' => 'Amistad eliminada correctamente']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al eliminar amistad: ' . $e->getMessage()], 500);
        }
    }
}
