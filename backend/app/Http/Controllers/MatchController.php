<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MatchController extends Controller
{
    ///Funcion que genera equipos equilibrados una vez el partido esta completo.
    public function generarEquipos($bookingId)
    {
        try {
            $booking = Booking::with(['usuarios.sports' => function($query) use ($bookingId) {
                $booking = Booking::find($bookingId);
                $query->where('sport_id', $booking->deporte_id);
            }])->findOrFail($bookingId);

            if (!$booking->estaCompleta()) {
                return response()->json([
                    'message' => 'El partido aún no está completo'
                ], 400);
            }

            //Verificamos que no haya equipos ya.
            $equiposYaGenerados = $booking->usuarios()
                ->wherePivotNotNull('team')
                ->exists();

            if ($equiposYaGenerados) {
                return response()->json([
                    'message' => 'Los equipos ya han sido generados para este partido'
                ], 400);
            }


            DB::beginTransaction();

            $resultado = $booking->generarEquiposEquilibrados();

            if (!$resultado) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Error al generar equipos'
                ], 500);
            }

            DB::commit();

            //Cargamos los equipos generados
            $equipo1 = $booking->usuarios()
                ->wherePivot('team', 1)
                ->with(['sports' => function($query) use ($booking) {
                    $query->where('sport_id', $booking->deporte_id);
                }])
                ->get()
                ->map(function($jugador) {
                    $sport = $jugador->sports->first();
                    return [
                        'id' => $jugador->id,
                        'name' => $jugador->name,
                        'ero' => $sport ? $sport->pivot->ero : 1000
                    ];
                });

            $equipo2 = $booking->usuarios()
                ->wherePivot('team', 2)
                ->with(['sports' => function($query) use ($booking) {
                    $query->where('sport_id', $booking->deporte_id);
                }])
                ->get()
                ->map(function($jugador) {
                    $sport = $jugador->sports->first();
                    return [
                        'id' => $jugador->id,
                        'name' => $jugador->name,
                        'ero' => $sport ? $sport->pivot->ero : 1000
                    ];
                });

            return response()->json([
                'message' => 'Equipos generados exitosamente',
                'equipo_1' => $equipo1,
                'equipo_2' => $equipo2,
                'ero_promedio_equipo_1' => $equipo1->avg('ero'),
                'ero_promedio_equipo_2' => $equipo2->avg('ero')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al generar equipos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    //Funcion para obtener los equipos de un partido.
    public function obtenerEquipos($bookingId)
    {
        try {
            $booking = Booking::with(['usuarios' => function($query) {
                $query->wherePivotNotNull('team');
            }])->findOrFail($bookingId);

            if ($booking->usuarios->isEmpty()) {
                return response()->json([
                    'message' => 'Los equipos aún no han sido generados'
                ], 400);
            }

            $equipo1 = $booking->usuarios()
                ->wherePivot('team', 1)
                ->with(['sports' => function($query) use ($booking) {
                    $query->where('sport_id', $booking->deporte_id);
                }])
                ->get()
                ->map(function($jugador) {
                    $sport = $jugador->sports->first();
                    return [
                        'id' => $jugador->id,
                        'name' => $jugador->name,
                        'ero' => $sport ? $sport->pivot->ero : 1000
                    ];
                });

            $equipo2 = $booking->usuarios()
                ->wherePivot('team', 2)
                ->with(['sports' => function($query) use ($booking) {
                    $query->where('sport_id', $booking->deporte_id);
                }])
                ->get()
                ->map(function($jugador) {
                    $sport = $jugador->sports->first();
                    return [
                        'id' => $jugador->id,
                        'name' => $jugador->name,
                        'ero' => $sport ? $sport->pivot->ero : 1000
                    ];
                });

            return response()->json([
                'equipo_1' => $equipo1,
                'equipo_2' => $equipo2,
                'team_1_score' => $booking->team_1_score,
                'team_2_score' => $booking->team_2_score,
                'winner_team' => $booking->winner_team,
                'estado' => $booking->estado
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener equipos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    //Funcion para registrar el resultado de un partido
    public function registrarResultado(Request $request, $bookingId)
    {
        try {
            $request->validate([
                'team_1_score' => 'required|integer|min:0',
                'team_2_score' => 'required|integer|min:0',
            ]);

            $booking = Booking::findOrFail($bookingId);


            $equiposGenerados = $booking->usuarios()
                ->wherePivotNotNull('team')
                ->exists();

            if (!$equiposGenerados) {
                return response()->json([
                    'message' => 'Los equipos deben ser generados antes de registrar resultados'
                ], 400);
            }


            if ($booking->estado === 'jugado') {
                return response()->json([
                    'message' => 'Este partido ya ha sido jugado'
                ], 400);
            }

            DB::beginTransaction();

            //Registramos el resultado y actualizamos el ERO
            $booking->registrarResultado(
                $request->team_1_score,
                $request->team_2_score
            );

            DB::commit();


            $cambiosEro = $this->obtenerCambiosEro($booking);

            return response()->json([
                'message' => 'Resultado registrado exitosamente',
                'resultado' => [
                    'team_1_score' => $booking->team_1_score,
                    'team_2_score' => $booking->team_2_score,
                    'winner_team' => $booking->winner_team
                ],
                'cambios_ero' => $cambiosEro
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Datos inválidos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al registrar resultado',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    //Funcion para obtener los cambios de ERO de un partido
    private function obtenerCambiosEro($booking)
    {
        $jugadores = $booking->usuarios()
            ->with(['sports' => function($query) use ($booking) {
                $query->where('sport_id', $booking->deporte_id);
            }])
            ->get();

        return $jugadores->map(function($jugador) use ($booking) {
            $sport = $jugador->sports->first();
            return [
                'id' => $jugador->id,
                'name' => $jugador->name,
                'team' => $jugador->pivot->team,
                'nuevo_ero' => $sport ? $sport->pivot->ero : 1000,
                'partidos_jugados' => $sport ? $sport->pivot->matches_played : 0,
                'gano' => $jugador->pivot->team == $booking->winner_team
            ];
        });
    }

    //Funcion que nos devuelve el historial de partidos jugados por un usuario
    public function historialPartidos()
    {
        try {
            $userId = Auth::id();

            $partidos = Booking::whereHas('usuarios', function($query) use ($userId) {
                    $query->where('user_id', $userId);
                })
                ->where('estado', 'jugado')
                ->with(['sport:id,nombre', 'usuarios' => function($query) {
                    $query->wherePivotNotNull('team');
                }])
                ->orderBy('fecha', 'desc')
                ->orderBy('hora_inicio', 'desc')
                ->get()
                ->map(function($partido) use ($userId) {
                    $miEquipo = $partido->usuarios()
                        ->where('user_id', $userId)
                        ->first()
                        ->pivot
                        ->team;

                    return [
                        'id' => $partido->id,
                        'deporte' => $partido->sport->nombre,
                        'fecha' => $partido->fecha->format('Y-m-d'),
                        'hora' => $partido->hora_inicio,
                        'mi_equipo' => $miEquipo,
                        'resultado' => "{$partido->team_1_score} - {$partido->team_2_score}",
                        'gane' => $miEquipo == $partido->winner_team,
                        'empate' => $partido->winner_team === null
                    ];
                });

            return response()->json($partidos);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener historial',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
