<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'deporte_id',
        'creador_id',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'pista',
        'ubicacion',
        'latitud',
        'longitud',
        'max_jugadores',
        'jugadores_actuales',
        'estado',
        'team_1_score',
        'team_2_score',
        'winner_team',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    //Una reserva pertenece a un deporte
    public function sport()
    {
        return $this->belongsTo(Sport::class, 'deporte_id');
    }

    //Una reserva pertenee a un usuario, el creador
    public function creador()
    {
        return $this->belongsTo(User::class, 'creador_id');
    }

    //Una reserva tiene muchos usuarios. Aqui usamos la tbla pivote booking_user
    public function usuarios()
    {
        return $this->belongsToMany(User::class, 'booking_user')
                    ->withPivot('es_creador', 'team', 'result')
                    ->withTimestamps();
    }


    //Verificamos si el horario esta disponible y no hay ningun solapamiento de reservas
    //Ahora consideramos ubicacion y pista para que cada ubicacion tenga sus propias pistas independientes
    public static function estaDisponible($deporteId, $fecha, $horaInicio, $horaFin, $pista = null, $ubicacion = null)
    {
        $query = self::where('deporte_id', $deporteId)
            ->where('fecha', $fecha)
            ->where('estado', '!=', 'cancelado');

        // Si se proporciona pista, filtramos por ella
        if ($pista !== null) {
            $query->where('pista', $pista);
        }

        // Si se proporciona ubicación, filtramos por ella
        if ($ubicacion !== null) {
            $query->where('ubicacion', $ubicacion);
        }

        $query->where(function ($query) use ($horaInicio, $horaFin) {
            $query->where(function ($q) use ($horaInicio, $horaFin) {
                $q->where('hora_inicio', '<', $horaFin)
                  ->where('hora_fin', '>', $horaInicio);
            });
        });

        return !$query->exists();
    }

    /**
     * Calcula la distancia en kilómetros entre dos coordenadas usando la fórmula Haversine
     *
     * @param float $lat1 Latitud del punto 1
     * @param float $lon1 Longitud del punto 1
     * @param float $lat2 Latitud del punto 2
     * @param float $lon2 Longitud del punto 2
     * @return float Distancia en kilómetros
     */
    public static function calcularDistancia($lat1, $lon1, $lat2, $lon2)
    {
        $radioTierra = 6371; // Radio de la Tierra en kilómetros

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $radioTierra * $c;
    }

    /**
     * Busca reservas disponibles dentro de un radio desde una ubicación
     *
     * @param int $deporteId ID del deporte
     * @param float $latitud Latitud del centro de búsqueda
     * @param float $longitud Longitud del centro de búsqueda
     * @param float $radioKm Radio de búsqueda en kilómetros
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function buscarPorRadio($deporteId, $latitud, $longitud, $radioKm)
    {
        // Obtenemos todas las reservas disponibles con coordenadas
        $reservas = self::where('deporte_id', $deporteId)
            ->where('estado', 'abierto')
            ->whereNotNull('latitud')
            ->whereNotNull('longitud')
            ->get();

        // Filtramos por distancia
        return $reservas->filter(function ($reserva) use ($latitud, $longitud, $radioKm) {
            $distancia = self::calcularDistancia(
                $latitud,
                $longitud,
                $reserva->latitud,
                $reserva->longitud
            );
            return $distancia <= $radioKm;
        });
    }


    public function estaCompleta()
    {
        return $this->jugadores_actuales >= $this->max_jugadores;
    }

    //Verificamos si el usuario esta apuntado en la reserva. Aqui usamos la tabla booking_user para ver si dicho usuario esta apuntado.
    public function tieneUsuario($userId)
    {
        return $this->usuarios()->where('user_id', $userId)->exists();
    }

    //Funcion para generear los equipos equilibrados.
    public function generarEquiposEquilibrados()
    {

        if (!$this->estaCompleta()) {
            return false;
        }


        $jugadores = $this->usuarios()
            ->with(['sports' => function($query) {
                $query->where('sport_id', $this->deporte_id);
            }])
            ->get();

        //Ordenamos los jugadores por orden de ELO de forma descendente. En caso de ser nuevo el jugador en ese deporte le asignamos 100.
        $jugadoresOrdenados = $jugadores->sortByDesc(function($jugador) {
            $sport = $jugador->sports->first();
            return $sport ? $sport->pivot->elo : 100;
        })->values();

        //Usamos algoritmo serpentina para repartir los jugadores.
        $equipo1 = [];
        $equipo2 = [];

        foreach ($jugadoresOrdenados as $index => $jugador) {
            $grupo = floor($index / 2);
            if ($grupo % 2 == 0) {

                if ($index % 2 == 0) {
                    $equipo1[] = $jugador->id;
                } else {
                    $equipo2[] = $jugador->id;
                }
            } else {

                if ($index % 2 == 0) {
                    $equipo2[] = $jugador->id;
                } else {
                    $equipo1[] = $jugador->id;
                }
            }
        }

        //Asignamos los equipos en la tabla pivot
        foreach ($equipo1 as $userId) {
            $this->usuarios()->updateExistingPivot($userId, ['team' => 1]);
        }
        foreach ($equipo2 as $userId) {
            $this->usuarios()->updateExistingPivot($userId, ['team' => 2]);
        }

        return true;
    }

    //Funcion que registra el resultado del partido.
    public function registrarResultado($scoreTeam1, $scoreTeam2, $actualizarElo = true)
    {

        $this->team_1_score = $scoreTeam1;
        $this->team_2_score = $scoreTeam2;


        if ($scoreTeam1 > $scoreTeam2) {
            $this->winner_team = 1;
        } elseif ($scoreTeam2 > $scoreTeam1) {
            $this->winner_team = 2;
        } else {
            //Empate
            $this->winner_team = null;
        }

        $this->estado = 'jugado';
        $this->save();

        // Solo actualizar ELO si se especifica
        if ($actualizarElo) {
            $this->actualizarEloJugadores();
        }

        return true;
    }



    //Actualizamos el ELO de los jugadores.
    private function actualizarEloJugadores()
    {

        $jugadoresEquipo1 = $this->usuarios()->wherePivot('team', 1)->get();
        $jugadoresEquipo2 = $this->usuarios()->wherePivot('team', 2)->get();


        $eloPromedioEquipo1 = $jugadoresEquipo1->avg(function($jugador) {
            return $jugador->sports()->where('sport_id', $this->deporte_id)->first()->pivot->elo ?? 100;
        });

        $eloPromedioEquipo2 = $jugadoresEquipo2->avg(function($jugador) {
            return $jugador->sports()->where('sport_id', $this->deporte_id)->first()->pivot->elo ?? 100;
        });


        $probabilidadEquipo1 = 1 / (1 + pow(10, ($eloPromedioEquipo2 - $eloPromedioEquipo1) / 400));
        $probabilidadEquipo2 = 1 - $probabilidadEquipo1;

        // 1 victoria, 0.5 empate, 0 derrota.
        $resultadoEquipo1 = $this->winner_team == 1 ? 1 : ($this->winner_team == 2 ? 0 : 0.5);
        $resultadoEquipo2 = 1 - $resultadoEquipo1;


        $kFactor = 32;

        //Actualizamos el ELO de los jugadores del equipo 1
        foreach ($jugadoresEquipo1 as $jugador) {
            $sportPivot = $jugador->sports()->where('sport_id', $this->deporte_id)->first();
            $eloActual = $sportPivot->pivot->elo;
            $partidosJugados = $sportPivot->pivot->matches_played;

            // Ajustamos el kFactor segun la experiencia.
            $kAjustado = $partidosJugados < 10 ? 40 : ($partidosJugados < 30 ? 32 : 24);


            $cambioElo = round($kAjustado * ($resultadoEquipo1 - $probabilidadEquipo1));
            $nuevoElo = max(0, $eloActual + $cambioElo);


            $jugador->sports()->updateExistingPivot($this->deporte_id, [
                'elo' => $nuevoElo,
                'matches_played' => $partidosJugados + 1
            ]);
        }

        //Actualizamos el ELO de los jugadores del equipo 2
        foreach ($jugadoresEquipo2 as $jugador) {
            $sportPivot = $jugador->sports()->where('sport_id', $this->deporte_id)->first();
            $eloActual = $sportPivot->pivot->elo;
            $partidosJugados = $sportPivot->pivot->matches_played;

            $kAjustado = $partidosJugados < 10 ? 40 : ($partidosJugados < 30 ? 32 : 24);

            $cambioElo = round($kAjustado * ($resultadoEquipo2 - $probabilidadEquipo2));
            $nuevoElo = max(0, $eloActual + $cambioElo);

            $jugador->sports()->updateExistingPivot($this->deporte_id, [
                'elo' => $nuevoElo,
                'matches_played' => $partidosJugados + 1
            ]);
        }
    }
}

