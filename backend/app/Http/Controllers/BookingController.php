<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class BookingController extends Controller
{
    //Obtenemos las reservas de un deporte por una fecha concreta. Endpoint publico.
    public function getReservasPorSportYFecha($sportId, $fecha)
    {
        try {
            $reservas = Booking::where('deporte_id', $sportId)
                ->whereDate('fecha', $fecha)
                ->where('estado', '!=', 'cancelado')
                ->with(['creador:id,name', 'usuarios:id,name'])
                ->orderBy('hora_inicio')
                ->get();

            return response()->json($reservas);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener reservas'], 500);
        }
    }

    //Funcion para crear una nueva reserva
    public function crearReserva(Request $request)
    {
        try {
            $request->validate([
                'deporte_id' => 'required|exists:sports,id',
                'fecha' => 'required|date|after_or_equal:today',
                'hora_inicio' => 'required|date_format:H:i',
                'ubicacion' => 'required|string|max:255',
                'latitud' => 'nullable|numeric|between:-90,90',
                'longitud' => 'nullable|numeric|between:-180,180',
            ]);

            $userId = Auth::id();

            //Inicializamos el ELO del usuario en este deporte si no existe
            /** @var User $user */
            $user = Auth::user();
            $user->initSportElo((int) $request->deporte_id);

            //Obtenemos la informacion del deporte y calculamos su duracion.
            $sport = Sport::findOrFail($request->deporte_id);
            $horaInicio = Carbon::createFromFormat('H:i', $request->hora_inicio);
            $horaFin = $horaInicio->copy()->addMinutes($sport->duracion_minutos);

            if (!Booking::estaDisponible(
                $request->deporte_id,
                $request->fecha,
                $request->hora_inicio,
                $horaFin->format('H:i'),
                $request->pista ?? 'Pista 1',
                $request->ubicacion
            )) {
                return response()->json([
                    'message' => 'Ya existe una reserva en ese horario para esta pista y ubicación'
                ], 409);
            }

            // Crear la reserva
            DB::beginTransaction();

            $bookingData = [
                'deporte_id' => $request->deporte_id,
                'creador_id' => $userId,
                'fecha' => $request->fecha,
                'hora_inicio' => $request->hora_inicio,
                'hora_fin' => $horaFin->format('H:i'),
                'pista' => $request->pista ?? 'Pista 1',
                'ubicacion' => $request->ubicacion,
                'max_jugadores' => $sport->max_jugadores,
                'jugadores_actuales' => 1,
                'estado' => 'abierto',
            ];

            // Añadir coordenadas si se proporcionan
            if ($request->has('latitud') && $request->has('longitud')) {
                $bookingData['latitud'] = $request->latitud;
                $bookingData['longitud'] = $request->longitud;
            }

            $booking = Booking::create($bookingData);

            //Añadimos al creador en booking_user
            $booking->usuarios()->attach($userId, ['es_creador' => true]);

            DB::commit();

            $booking->load(['creador:id,name', 'sport:id,nombre', 'usuarios:id,name']);

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

    //Funcion para unirse a una reserva
    public function unirseAReserva($bookingId)
    {
        try {
            $userId = Auth::id();
            $booking = Booking::findOrFail($bookingId);

            //Verficamos que no este cancelado
            if ($booking->estado === 'cancelado') {
                return response()->json(['message' => 'Esta reserva ha sido cancelada'], 400);
            }

            // Verificamos que no esté completo
            if ($booking->estaCompleta()) {
                return response()->json(['message' => 'Esta reserva ya está completa'], 400);
            }

            // Verificamos que el usuario no esté ya en la reserva
            if ($booking->tieneUsuario($userId)) {
                return response()->json(['message' => 'Ya estás en esta reserva'], 400);
            }

            //Inicializamos el ELO del usuario en el deporte de la reserva si no existe
            /** @var User $user */
            $user = Auth::user();
            $user->initSportElo((int) $booking->deporte_id);

            DB::beginTransaction();

            $booking->usuarios()->attach($userId, ['es_creador' => false]);
            $booking->increment('jugadores_actuales');

            // Si está completo, cambiamos el estado a completo
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

    //Funcion para salirse de una reserva
    public function salirseDeReserva($bookingId)
    {
        try {
            $userId = Auth::id();
            $booking = Booking::findOrFail($bookingId);


            if (!$booking->tieneUsuario($userId)) {
                return response()->json(['message' => 'No estás en esta reserva'], 400);
            }

            $esCreador = $booking->usuarios()
                ->where('user_id', $userId)
                ->wherePivot('es_creador', true)
                ->exists();

            DB::beginTransaction();

            if ($esCreador) {
                // Si es el creador, asignamos la reserva a otro usuario aleatorio
                $otrosUsuarios = $booking->usuarios()
                    ->where('user_id', '!=', $userId)
                    ->get();

                if ($otrosUsuarios->isEmpty()) {
                    // Si no hay otros usuarios, cancelamos la reserva
                    $booking->update(['estado' => 'cancelado']);
                    $booking->usuarios()->detach();

                    DB::commit();

                    return response()->json([
                        'message' => 'Como eres el único usuario, la reserva ha sido cancelada',
                        'cancelado' => true
                    ]);
                }

                // Seleccionar un usuario aleatorio para ser el nuevo creador
                $nuevoCreador = $otrosUsuarios->random();

                // Actualizar el creador en la tabla bookings
                $booking->update(['creador_id' => $nuevoCreador->id]);

                // Actualizar el pivot: quitar es_creador del antiguo creador
                $booking->usuarios()->updateExistingPivot($userId, ['es_creador' => false]);

                // Poner es_creador al nuevo creador
                $booking->usuarios()->updateExistingPivot($nuevoCreador->id, ['es_creador' => true]);

                // Quitar al antiguo creador de la reserva
                $booking->usuarios()->detach($userId);
                $booking->decrement('jugadores_actuales');

                if ($booking->estado === 'completo') {
                    $booking->update(['estado' => 'abierto']);
                }

                DB::commit();

                return response()->json([
                    'message' => 'Te has salido de la reserva. Se ha asignado un nuevo creador',
                    'nuevo_creador' => $nuevoCreador->name,
                    'cancelado' => false
                ]);
            } else {
                //En caso de no ser creador, solo quitamos dicho usuario de la reserva
                $booking->usuarios()->detach($userId);
                $booking->decrement('jugadores_actuales');

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

    //Funcion para obtener las reservas del usuario autenticado
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
                ->with(['sport:id,nombre,duracion_minutos', 'creador:id,name', 'usuarios:id,name'])
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

    //Funcion que nos devuelve las reservas disponibles de un deporte
    public function reservasDisponibles($sportId)
    {
        try {

            $hoy = Carbon::today()->format('Y-m-d');
            $horaActual = Carbon::now()->format('H:i');

            $reservas = Booking::where('deporte_id', $sportId)
                ->where('estado', 'abierto')
                ->where(function($query) use ($hoy, $horaActual) {
                    $query->where('fecha', '>', $hoy)
                          ->orWhere(function($q) use ($hoy, $horaActual) {
                              $q->where('fecha', '=', $hoy)
                                ->where('hora_inicio', '>', $horaActual);
                          });
                })
                ->with(['creador:id,name'])
                ->select('id', 'deporte_id', 'creador_id', 'fecha', 'hora_inicio', 'hora_fin', 'pista', 'ubicacion', 'max_jugadores', 'jugadores_actuales', 'estado')
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

    //Funcion que filtra reservas disponibles por ubicación
    public function reservasPorUbicacion(Request $request, $sportId)
    {
        try {
            $request->validate([
                'ubicacion' => 'required|string|max:255',
            ]);

            $hoy = Carbon::today()->format('Y-m-d');
            $horaActual = Carbon::now()->format('H:i');

            $reservas = Booking::where('deporte_id', $sportId)
                ->where('estado', 'abierto')
                ->where('ubicacion', 'LIKE', '%' . $request->ubicacion . '%')
                ->where(function($query) use ($hoy, $horaActual) {
                    $query->where('fecha', '>', $hoy)
                          ->orWhere(function($q) use ($hoy, $horaActual) {
                              $q->where('fecha', '=', $hoy)
                                ->where('hora_inicio', '>', $horaActual);
                          });
                })
                ->with(['creador:id,name'])
                ->select('id', 'deporte_id', 'creador_id', 'fecha', 'hora_inicio', 'hora_fin', 'pista', 'ubicacion', 'latitud', 'longitud', 'max_jugadores', 'jugadores_actuales', 'estado')
                ->orderBy('fecha', 'asc')
                ->orderBy('hora_inicio', 'asc')
                ->get();

            return response()->json($reservas);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener reservas por ubicación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    //Función para buscar reservas disponibles por radio desde coordenadas
    public function reservasPorRadio(Request $request, $sportId)
    {
        try {
            $request->validate([
                'latitud' => 'required|numeric|between:-90,90',
                'longitud' => 'required|numeric|between:-180,180',
                'radio' => 'required|numeric|min:1|max:500', // Radio en kilómetros
            ]);

            $hoy = Carbon::today()->format('Y-m-d');
            $horaActual = Carbon::now()->format('H:i');

            // Obtenemos reservas disponibles con coordenadas
            $reservas = Booking::where('deporte_id', $sportId)
                ->where('estado', 'abierto')
                ->whereNotNull('latitud')
                ->whereNotNull('longitud')
                ->where(function($query) use ($hoy, $horaActual) {
                    $query->where('fecha', '>', $hoy)
                          ->orWhere(function($q) use ($hoy, $horaActual) {
                              $q->where('fecha', '=', $hoy)
                                ->where('hora_inicio', '>', $horaActual);
                          });
                })
                ->get();

            // Filtramos por distancia y añadimos el campo de distancia
            $reservasFiltradas = $reservas->filter(function ($reserva) use ($request) {
                $distancia = Booking::calcularDistancia(
                    $request->latitud,
                    $request->longitud,
                    $reserva->latitud,
                    $reserva->longitud
                );
                // Añadimos la distancia a la reserva
                $reserva->distancia_km = round($distancia, 2);
                return $distancia <= $request->radio;
            })->values();

            // Ordenamos por distancia
            $reservasOrdenadas = $reservasFiltradas->sortBy('distancia_km')->values();

            // Cargamos las relaciones necesarias
            $reservasOrdenadas->load(['creador:id,name']);

            return response()->json($reservasOrdenadas);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al buscar reservas por radio',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
