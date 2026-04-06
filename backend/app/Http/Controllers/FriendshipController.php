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
    // Funcion pora enviar una solicitud de amistad a otro usuario.
    public function enviarSolicitud(Request $request)
    {

        try {
            $request->validate([
                'friend_id' => 'required|exists:users,id',
            ]);

            $userId = Auth::id();
            $friendId = $request->friend_id;


            if ($userId == $friendId) {
                return response()->json(['message' => 'No puedes enviarte solicitud a ti mismo'], 400);
            }

            // Verificamos si el usuario está bloqueado
            $estaBloqueado = BlockedUser::where(function ($query) use ($userId, $friendId) {
                $query->where('user_id', $userId)->where('blocked_user_id', $friendId);
            })->orWhere(function ($query) use ($userId, $friendId) {
                $query->where('user_id', $friendId)->where('blocked_user_id', $userId);
            })->exists();

            if ($estaBloqueado) {
                return response()->json(['message' => 'No puedes enviar solicitud a este usuario'], 403);
            }

            // Verificamos si ya existe una solicitud
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

            // Creamos la solicitud de amistad
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

    // Funcion para aceptar una solicitud de amistad
    public function aceptarSolicitud($id)
    {
        try {
            $userId = Auth::id();

            $friendship = Friendship::findOrFail($id);

            //Solo el receptor puede aceptarla
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

    // Funcion para rechazar una solicitud de amistad
    public function rechazarSolicitud($id)
    {
        try {
            $userId = Auth::id();

            $friendship = Friendship::findOrFail($id);

            // Solo el receptor puede rechazarla
            if ($friendship->friend_id != $userId) {
                return response()->json(['message' => 'No tienes permiso para rechazar esta solicitud'], 403);
            }

            if ($friendship->status !== 'pending') {
                return response()->json(['message' => 'Esta solicitud ya fue procesada'], 400);
            }

            $friendship->delete();

            return response()->json(['message' => 'Solicitud rechazada']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al rechazar solicitud: ' . $e->getMessage()], 500);
        }
    }

    // Funcion para listar a los amigos de un usuario
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
                    $amigo = User::find($friendId);

                    $estaBloqueado = BlockedUser::where('user_id', $userId)
                        ->where('blocked_user_id', $friendId)
                        ->exists();

                    if ($amigo) {
                        $amigo->esta_bloqueado = $estaBloqueado;
                    }

                    return $amigo;
                });

            return response()->json($amigos);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al listar amigos: ' . $e->getMessage()], 500);
        }
    }

    // Funcion para listar las solicitudes pendientes (recibidas)
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

    // Funcion para eliminar la amistad con un usuario
    public function eliminarAmistad($id)
    {
        try {
            $userId = Auth::id();

            $friendship = Friendship::findOrFail($id);

            if ($friendship->user_id != $userId && $friendship->friend_id != $userId) {
                return response()->json(['message' => 'No tienes permiso para eliminar esta amistad'], 403);
            }

            $friendship->delete();

            return response()->json(['message' => 'Amistad eliminada correctamente']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al eliminar amistad: ' . $e->getMessage()], 500);
        }
    }

    // Funcion para eliminar la amistad por userId del amigo
    public function eliminarAmigoPorUserId($friendId)
    {
        try {
            $userId = Auth::id();

            //Buscamos la amistad
            $friendship = Friendship::where('status', 'accepted')
                ->where(function ($query) use ($userId, $friendId) {
                    $query->where(function ($q) use ($userId, $friendId) {
                        $q->where('user_id', $userId)->where('friend_id', $friendId);
                    })->orWhere(function ($q) use ($userId, $friendId) {
                        $q->where('user_id', $friendId)->where('friend_id', $userId);
                    });
                })->first();

            if (!$friendship) {
                return response()->json(['message' => 'No existe una amistad con este usuario'], 404);
            }

            $friendship->delete();

            return response()->json(['message' => 'Amistad eliminada correctamente']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al eliminar amistad: ' . $e->getMessage()], 500);
        }
    }

    // Funcion para buscar usuarios (y luego posteriormente mandarle solicitud de amistad)
    public function buscarUsuarios(Request $request)
    {
        try {
            $request->validate([
                'query' => 'required|string|min:1',
            ]);

            $userId = Auth::id();
            $query = $request->query('query');

            $usuariosEncontrados = User::where('id', '!=', $userId)
                ->where(function ($q) use ($query) {
                    $q->where('name', 'LIKE', "%{$query}%")
                      ->orWhere('email', 'LIKE', "%{$query}%");
                })
                ->select('id', 'name', 'last_name', 'email')
                ->limit(20)
                ->get();

            // Obtenemos los IDs de usuarios con los que ya hay relación (amigos o solicitudes pendientes)
            $relacionesExistentes = Friendship::where(function ($q) use ($userId) {
                $q->where('user_id', $userId)->orWhere('friend_id', $userId);
            })->get();

            $idsConRelacion = $relacionesExistentes->map(function ($rel) use ($userId) {
                return $rel->user_id == $userId ? $rel->friend_id : $rel->user_id;
            })->toArray();

            $usuariosBloqueados = BlockedUser::where('user_id', $userId)
                ->orWhere('blocked_user_id', $userId)
                ->pluck('blocked_user_id')
                ->toArray();

            $usuarios = $usuariosEncontrados->map(function ($usuario) use ($userId, $relacionesExistentes, $idsConRelacion, $usuariosBloqueados) {
                $relacion = 'none';

                if (in_array($usuario->id, $usuariosBloqueados)) {
                    $relacion = 'blocked';
                } else if (in_array($usuario->id, $idsConRelacion)) {
                    $amistad = $relacionesExistentes->first(function ($rel) use ($userId, $usuario) {
                        return ($rel->user_id == $userId && $rel->friend_id == $usuario->id) ||
                               ($rel->friend_id == $userId && $rel->user_id == $usuario->id);
                    });
                    $relacion = $amistad ? $amistad->status : 'none';
                }

                return [
                    'id' => $usuario->id,
                    'name' => $usuario->name,
                    'last_name' => $usuario->last_name,
                    'email' => $usuario->email,
                    'relacion' => $relacion
                ];
            });

            return response()->json($usuarios);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al buscar usuarios: ' . $e->getMessage()], 500);
        }
    }
}
