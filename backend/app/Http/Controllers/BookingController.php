<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Deporte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class BookingController extends Controller
{
    /**
     * Obtener reservas por deporte y fecha
     */
    public function getReservasPorDeporteYFecha($deporteId, $fecha)
    {
        try {
            $reservas = Booking::where('deporte_id', $deporteId)
                ->whereDate('fecha', $fecha)  // Usar whereDate en lugar de where
                ->where('estado', '!=', 'cancelado')
                ->with(['creador:id,name', 'usuarios:id,name'])
                ->orderBy('hora_inicio')
                ->get();

            return response()->json($reservas);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener reservas'], 500);
        }
    }

    /**
     * Crear una nueva reserva
     */
    public function crearReserva(Request $request)
    {
        try {
            $request->validate([
                'deporte_id' => 'required|exists:deportes,id',
                'fecha' => 'required|date|after_or_equal:today',
                'hora_inicio' => 'required|date_format:H:i',
            ]);

            $userId = Auth::id();

            // Obtener información del deporte
            $deporte = Deporte::findOrFail($request->deporte_id);

            // Calcular hora de fin según duración del deporte
            $horaInicio = Carbon::createFromFormat('H:i', $request->hora_inicio);
            $horaFin = $horaInicio->copy()->addMinutes($deporte->duracion_minutos);

            // Verificar disponibilidad
            if (!Booking::estaDisponible(
                $request->deporte_id,
                $request->fecha,
                $request->hora_inicio,
                $horaFin->format('H:i')
            )) {
                return response()->json([
                    'message' => 'Ya existe una reserva en ese horario'
                ], 409);
            }

            // Crear la reserva
            DB::beginTransaction();

            $booking = Booking::create([
                'deporte_id' => $request->deporte_id,
                'creador_id' => $userId,
                'fecha' => $request->fecha,
                'hora_inicio' => $request->hora_inicio,
                'hora_fin' => $horaFin->format('H:i'),
                'pista' => $request->pista ?? 'Pista 1',
                'max_jugadores' => $deporte->max_jugadores,
                'jugadores_actuales' => 1,
                'estado' => 'abierto',
            ]);

            // Añadir al creador como jugador
            $booking->usuarios()->attach($userId, ['es_creador' => true]);

            DB::commit();

            // Cargar relaciones para la respuesta
            $booking->load(['creador:id,name', 'deporte:id,nombre', 'usuarios:id,name']);

            return response()->json([
                'message' => 'Reserva creada exitosamente',
                'booking' => $booking
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Datos inválidos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al crear la reserva',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unirse a una reserva existente
     */
    public function unirseAReserva($bookingId)
    {
        try {
            $userId = Auth::id();
            $booking = Booking::findOrFail($bookingId);

            // Verificar que no esté cancelado
            if ($booking->estado === 'cancelado') {
                return response()->json(['message' => 'Esta reserva ha sido cancelada'], 400);
            }

            // Verificar que no esté completo
            if ($booking->estaCompleta()) {
                return response()->json(['message' => 'Esta reserva ya está completa'], 400);
            }

            // Verificar que el usuario no esté ya en la reserva
            if ($booking->tieneUsuario($userId)) {
                return response()->json(['message' => 'Ya estás en esta reserva'], 400);
            }

            DB::beginTransaction();

            // Añadir usuario a la reserva
            $booking->usuarios()->attach($userId, ['es_creador' => false]);

            // Incrementar contador de jugadores
            $booking->increment('jugadores_actuales');

            // Si está completo, cambiar estado
            if ($booking->jugadores_actuales >= $booking->max_jugadores) {
                $booking->update(['estado' => 'completo']);
            }

            DB::commit();

            $booking->load(['usuarios:id,name']);

            return response()->json([
                'message' => 'Te has unido a la reserva exitosamente',
                'booking' => $booking
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al unirse a la reserva',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Salirse de una reserva
     */
    public function salirseDeReserva($bookingId)
    {
        try {
            $userId = Auth::id();
            $booking = Booking::findOrFail($bookingId);

            // Verificar que el usuario esté en la reserva
            if (!$booking->tieneUsuario($userId)) {
                return response()->json(['message' => 'No estás en esta reserva'], 400);
            }

            // Verificar si es el creador
            $esCreador = $booking->usuarios()
                ->where('user_id', $userId)
                ->wherePivot('es_creador', true)
                ->exists();

            DB::beginTransaction();

            if ($esCreador) {
                // Si es el creador, cancelar toda la reserva
                $booking->update(['estado' => 'cancelado']);
                $booking->usuarios()->detach(); // Quitar a todos los usuarios

                DB::commit();

                return response()->json([
                    'message' => 'Como eres el creador, la reserva ha sido cancelada',
                    'cancelado' => true
                ]);
            } else {
                // Si no es el creador, solo quitarlo
                $booking->usuarios()->detach($userId);
                $booking->decrement('jugadores_actuales');

                // Si estaba completo, volver a abierto
                if ($booking->estado === 'completo') {
                    $booking->update(['estado' => 'abierto']);
                }

                DB::commit();

                return response()->json([
                    'message' => 'Te has salido de la reserva',
                    'cancelado' => false
                ]);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al salirse de la reserva',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener las reservas del usuario autenticado
     * Solo muestra reservas de hoy en adelante
     */
    public function misReservas()
    {
        try {
            $userId = Auth::id();
            $hoy = Carbon::today()->format('Y-m-d');

            $reservas = Booking::whereHas('usuarios', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })
                ->where('estado', '!=', 'cancelado')
                ->where('fecha', '>=', $hoy)
                ->with(['deporte:id,nombre,duracion_minutos', 'creador:id,name', 'usuarios:id,name'])
                ->orderBy('fecha', 'asc')
                ->orderBy('hora_inicio', 'asc')
                ->get();

            return response()->json($reservas);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener tus reservas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todas las reservas disponibles (abiertas) de un deporte
     */
    public function reservasDisponibles($deporteId)
    {
        try {
            $hoy = Carbon::today()->format('Y-m-d');
            $horaActual = Carbon::now()->format('H:i');

            $reservas = Booking::where('deporte_id', $deporteId)
                ->where('estado', 'abierto')
                ->where(function($query) use ($hoy, $horaActual) {
                    $query->where('fecha', '>', $hoy)
                          ->orWhere(function($q) use ($hoy, $horaActual) {
                              $q->where('fecha', '=', $hoy)
                                ->where('hora_inicio', '>', $horaActual);
                          });
                })
                ->with(['creador:id,name'])
                ->select('id', 'deporte_id', 'creador_id', 'fecha', 'hora_inicio', 'hora_fin', 'pista', 'max_jugadores', 'jugadores_actuales', 'estado')
                ->orderBy('fecha', 'asc')
                ->orderBy('hora_inicio', 'asc')
                ->get();

            return response()->json($reservas);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener reservas disponibles',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
