<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Friendship;
use App\Models\BlockedUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    // Enviar mensaje
    public function enviarMensaje(Request $request)
    {
        try {
            $request->validate([
                'receiver_id' => 'required|exists:users,id',
                'message' => 'required|string|max:1000',
            ]);

            $senderId = Auth::id();
            $receiverId = $request->receiver_id;

            // No puedes enviarte mensaje a ti mismo
            if ($senderId == $receiverId) {
                return response()->json(['message' => 'No puedes enviarte mensaje a ti mismo'], 400);
            }

            // Verificar si alguno bloqueó al otro
            $estaBloqueado = BlockedUser::where(function ($query) use ($senderId, $receiverId) {
                $query->where('user_id', $senderId)->where('blocked_user_id', $receiverId);
            })->orWhere(function ($query) use ($senderId, $receiverId) {
                $query->where('user_id', $receiverId)->where('blocked_user_id', $senderId);
            })->exists();

            if ($estaBloqueado) {
                return response()->json(['message' => 'No puedes enviar mensajes a este usuario'], 403);
            }

            // Verificar si son amigos
            $sonAmigos = Friendship::where('status', 'accepted')
                ->where(function ($query) use ($senderId, $receiverId) {
                    $query->where(function ($q) use ($senderId, $receiverId) {
                        $q->where('user_id', $senderId)->where('friend_id', $receiverId);
                    })->orWhere(function ($q) use ($senderId, $receiverId) {
                        $q->where('user_id', $receiverId)->where('friend_id', $senderId);
                    });
                })->exists();

            if (!$sonAmigos) {
                return response()->json(['message' => 'Solo puedes enviar mensajes a tus amigos'], 403);
            }

            // Crear el mensaje
            $message = Message::create([
                'sender_id' => $senderId,
                'receiver_id' => $receiverId,
                'message' => $request->message,
            ]);

            return response()->json([
                'message' => 'Mensaje enviado correctamente',
                'data' => $message
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al enviar mensaje: ' . $e->getMessage()], 500);
        }
    }

    // Ver conversación con un usuario
    public function obtenerConversacion($userId)
    {
        try {
            $authUserId = Auth::id();

            // Verificar si son amigos
            $sonAmigos = Friendship::where('status', 'accepted')
                ->where(function ($query) use ($authUserId, $userId) {
                    $query->where(function ($q) use ($authUserId, $userId) {
                        $q->where('user_id', $authUserId)->where('friend_id', $userId);
                    })->orWhere(function ($q) use ($authUserId, $userId) {
                        $q->where('user_id', $userId)->where('friend_id', $authUserId);
                    });
                })->exists();

            if (!$sonAmigos) {
                return response()->json(['message' => 'Solo puedes ver conversaciones con tus amigos'], 403);
            }

            // Obtener mensajes entre ambos usuarios
            $mensajes = Message::where(function ($query) use ($authUserId, $userId) {
                $query->where('sender_id', $authUserId)->where('receiver_id', $userId);
            })->orWhere(function ($query) use ($authUserId, $userId) {
                $query->where('sender_id', $userId)->where('receiver_id', $authUserId);
            })
            ->with(['sender:id,name', 'receiver:id,name'])
            ->orderBy('created_at', 'asc')
            ->get();

            return response()->json($mensajes);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener conversación: ' . $e->getMessage()], 500);
        }
    }

    // Listar todas las conversaciones (últimos mensajes con cada amigo)
    public function listarConversaciones()
    {
        try {
            $userId = Auth::id();

            // Obtener IDs de amigos
            $amigosIds = DB::table('friendships')
                ->where('status', 'accepted')
                ->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId)
                          ->orWhere('friend_id', $userId);
                })
                ->get()
                ->map(function ($friendship) use ($userId) {
                    return $friendship->user_id == $userId ? $friendship->friend_id : $friendship->user_id;
                });

            // Obtener último mensaje con cada amigo
            $conversaciones = [];
            foreach ($amigosIds as $amigoId) {
                $ultimoMensaje = Message::where(function ($query) use ($userId, $amigoId) {
                    $query->where('sender_id', $userId)->where('receiver_id', $amigoId);
                })->orWhere(function ($query) use ($userId, $amigoId) {
                    $query->where('sender_id', $amigoId)->where('receiver_id', $userId);
                })
                ->with(['sender:id,name', 'receiver:id,name'])
                ->orderBy('created_at', 'desc')
                ->first();

                if ($ultimoMensaje) {
                    $amigo = User::find($amigoId);
                    $conversaciones[] = [
                        'amigo' => $amigo,
                        'ultimo_mensaje' => $ultimoMensaje,
                        'no_leidos' => Message::where('sender_id', $amigoId)
                            ->where('receiver_id', $userId)
                            ->whereNull('read_at')
                            ->count()
                    ];
                }
            }

            // Ordenar por fecha del último mensaje
            usort($conversaciones, function ($a, $b) {
                return $b['ultimo_mensaje']->created_at <=> $a['ultimo_mensaje']->created_at;
            });

            return response()->json($conversaciones);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al listar conversaciones: ' . $e->getMessage()], 500);
        }
    }

    // Marcar mensaje como leído
    public function marcarComoLeido($id)
    {
        try {
            $userId = Auth::id();

            $message = Message::findOrFail($id);

            // Solo el receptor puede marcar como leído
            if ($message->receiver_id != $userId) {
                return response()->json(['message' => 'No tienes permiso para marcar este mensaje'], 403);
            }

            $message->markAsRead();

            return response()->json(['message' => 'Mensaje marcado como leído']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al marcar mensaje: ' . $e->getMessage()], 500);
        }
    }

    // Marcar todos los mensajes de una conversación como leídos
    public function marcarConversacionLeida($userId)
    {
        try {
            $authUserId = Auth::id();

            Message::where('sender_id', $userId)
                ->where('receiver_id', $authUserId)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            return response()->json(['message' => 'Conversación marcada como leída']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al marcar conversación: ' . $e->getMessage()], 500);
        }
    }
}
