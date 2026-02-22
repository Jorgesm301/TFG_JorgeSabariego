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
    public static function estaDisponible($deporteId, $fecha, $horaInicio, $horaFin)
    {
        return !self::where('deporte_id', $deporteId)
            ->where('fecha', $fecha)
            ->where('estado', '!=', 'cancelado')
            ->where(function ($query) use ($horaInicio, $horaFin) {

                $query->where(function ($q) use ($horaInicio, $horaFin) {
                    $q->where('hora_inicio', '<', $horaFin)
                    ->where('hora_fin', '>', $horaInicio);
                });
            })
            ->exists();
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

        //Ordenamos los jugadores por orden de ERO de forma descendente. En caso de ser nuevo el jugador en ese deporte le asignamos 1000.
        $jugadoresOrdenados = $jugadores->sortByDesc(function($jugador) {
            $sport = $jugador->sports->first();
            return $sport ? $sport->pivot->ero : 1000;
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
    public function registrarResultado($scoreTeam1, $scoreTeam2)
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

        $this->actualizarEroJugadores();

        return true;
    }

    //Actualizamos el ERO de los jugadores.
    private function actualizarEroJugadores()
    {

        $jugadoresEquipo1 = $this->usuarios()->wherePivot('team', 1)->get();
        $jugadoresEquipo2 = $this->usuarios()->wherePivot('team', 2)->get();


        $eroPromedioEquipo1 = $jugadoresEquipo1->avg(function($jugador) {
            return $jugador->sports()->where('sport_id', $this->deporte_id)->first()->pivot->ero ?? 1000;
        });

        $eroPromedioEquipo2 = $jugadoresEquipo2->avg(function($jugador) {
            return $jugador->sports()->where('sport_id', $this->deporte_id)->first()->pivot->ero ?? 1000;
        });


        $probabilidadEquipo1 = 1 / (1 + pow(10, ($eroPromedioEquipo2 - $eroPromedioEquipo1) / 400));
        $probabilidadEquipo2 = 1 - $probabilidadEquipo1;

        // 1 victoria, 0.5 empate, 0 derrota.
        $resultadoEquipo1 = $this->winner_team == 1 ? 1 : ($this->winner_team == 2 ? 0 : 0.5);
        $resultadoEquipo2 = 1 - $resultadoEquipo1;


        $kFactor = 32;

        //Actualizamos el ERO de los jugadores del equipo 1
        foreach ($jugadoresEquipo1 as $jugador) {
            $sportPivot = $jugador->sports()->where('sport_id', $this->deporte_id)->first();
            $eroActual = $sportPivot->pivot->ero;
            $partidosJugados = $sportPivot->pivot->matches_played;

            // Ajustamos el kFactor segun la experiencia.
            $kAjustado = $partidosJugados < 10 ? 40 : ($partidosJugados < 30 ? 32 : 24);


            $cambioEro = round($kAjustado * ($resultadoEquipo1 - $probabilidadEquipo1));
            $nuevoEro = max(100, $eroActual + $cambioEro);


            $jugador->sports()->updateExistingPivot($this->deporte_id, [
                'ero' => $nuevoEro,
                'matches_played' => $partidosJugados + 1
            ]);
        }

        //Actualizamos el ERO de los jugadores del equipo 2
        foreach ($jugadoresEquipo2 as $jugador) {
            $sportPivot = $jugador->sports()->where('sport_id', $this->deporte_id)->first();
            $eroActual = $sportPivot->pivot->ero;
            $partidosJugados = $sportPivot->pivot->matches_played;

            $kAjustado = $partidosJugados < 10 ? 40 : ($partidosJugados < 30 ? 32 : 24);

            $cambioEro = round($kAjustado * ($resultadoEquipo2 - $probabilidadEquipo2));
            $nuevoEro = max(100, $eroActual + $cambioEro);

            $jugador->sports()->updateExistingPivot($this->deporte_id, [
                'ero' => $nuevoEro,
                'matches_played' => $partidosJugados + 1
            ]);
        }
    }
}

