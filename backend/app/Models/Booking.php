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

    /**
     * Relación: Una reserva pertenece a un deporte
     */
    public function deporte()
    {
        return $this->belongsTo(Deporte::class);
    }

    /**
     * Relación: Una reserva pertenece a un creador (usuario)
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'creador_id');
    }

    /**
     * Relación: Una reserva tiene muchos usuarios (jugadores)
     */
    public function usuarios()
    {
        return $this->belongsToMany(User::class, 'booking_user')
                    ->withPivot('es_creador', 'team', 'result')
                    ->withTimestamps();
    }

    /**
     * Verificar si un horario está disponible
     * Detecta cualquier tipo de solapamiento entre reservas
     */
    public static function estaDisponible($deporteId, $fecha, $horaInicio, $horaFin)
    {
        return !self::where('deporte_id', $deporteId)
            ->where('fecha', $fecha)
            ->where('estado', '!=', 'cancelado')
            ->where(function ($query) use ($horaInicio, $horaFin) {
                // Solapamiento: Nueva reserva comienza antes de que termine una existente
                // Y termina después de que comience una existente
                $query->where(function ($q) use ($horaInicio, $horaFin) {
                    $q->where('hora_inicio', '<', $horaFin)
                      ->where('hora_fin', '>', $horaInicio);
                });
            })
            ->exists();
    }

    /**
     * Verificar si la reserva está completa
     */
    public function estaCompleta()
    {
        return $this->jugadores_actuales >= $this->max_jugadores;
    }

    /**
     * Verificar si un usuario está en la reserva
     */
    public function tieneUsuario($userId)
    {
        return $this->usuarios()->where('user_id', $userId)->exists();
    }

    /**
     * Generar equipos equilibrados basados en ERO
     * Algoritmo: Ordenar por ERO y distribuir alternadamente (serpentina)
     */
    public function generarEquiposEquilibrados()
    {
        // Verificar que la reserva esté completa
        if (!$this->estaCompleta()) {
            return false;
        }

        // Obtener todos los jugadores con su ERO en este deporte
        $jugadores = $this->usuarios()
            ->with(['sports' => function($query) {
                $query->where('sport_id', $this->deporte_id);
            }])
            ->get();

        // Ordenar jugadores por ERO (mayor a menor)
        $jugadoresOrdenados = $jugadores->sortByDesc(function($jugador) {
            $sport = $jugador->sports->first();
            return $sport ? $sport->pivot->ero : 1000;
        })->values();

        // Distribuir en equipos usando serpentina:
        // Equipo 1: 1°, 4°, 5°, 8°, 9°, 12°...
        // Equipo 2: 2°, 3°, 6°, 7°, 10°, 11°...
        $equipo1 = [];
        $equipo2 = [];
        
        foreach ($jugadoresOrdenados as $index => $jugador) {
            $grupo = floor($index / 2);
            if ($grupo % 2 == 0) {
                // Grupos pares (0, 2, 4...): asignar normalmente
                if ($index % 2 == 0) {
                    $equipo1[] = $jugador->id;
                } else {
                    $equipo2[] = $jugador->id;
                }
            } else {
                // Grupos impares (1, 3, 5...): invertir asignación (serpentina)
                if ($index % 2 == 0) {
                    $equipo2[] = $jugador->id;
                } else {
                    $equipo1[] = $jugador->id;
                }
            }
        }

        // Asignar equipos en la tabla pivot
        foreach ($equipo1 as $userId) {
            $this->usuarios()->updateExistingPivot($userId, ['team' => 1]);
        }
        foreach ($equipo2 as $userId) {
            $this->usuarios()->updateExistingPivot($userId, ['team' => 2]);
        }

        return true;
    }

    /**
     * Registrar el resultado del partido y actualizar ERO
     */
    public function registrarResultado($scoreTeam1, $scoreTeam2)
    {
        // Actualizar marcadores
        $this->team_1_score = $scoreTeam1;
        $this->team_2_score = $scoreTeam2;
        
        // Determinar ganador
        if ($scoreTeam1 > $scoreTeam2) {
            $this->winner_team = 1;
        } elseif ($scoreTeam2 > $scoreTeam1) {
            $this->winner_team = 2;
        } else {
            $this->winner_team = null; // Empate
        }
        
        $this->estado = 'jugado';
        $this->save();

        // Actualizar ERO de todos los jugadores
        $this->actualizarEroJugadores();

        return true;
    }

    /**
     * Actualizar ERO de los jugadores según el resultado
     * Sistema ELO adaptado para equipos
     */
    private function actualizarEroJugadores()
    {
        // Obtener jugadores de cada equipo con su ERO actual
        $jugadoresEquipo1 = $this->usuarios()->wherePivot('team', 1)->get();
        $jugadoresEquipo2 = $this->usuarios()->wherePivot('team', 2)->get();

        // Calcular ERO promedio de cada equipo
        $eroPromedioEquipo1 = $jugadoresEquipo1->avg(function($jugador) {
            return $jugador->sports()->where('sport_id', $this->deporte_id)->first()->pivot->ero ?? 1000;
        });

        $eroPromedioEquipo2 = $jugadoresEquipo2->avg(function($jugador) {
            return $jugador->sports()->where('sport_id', $this->deporte_id)->first()->pivot->ero ?? 1000;
        });

        // Calcular probabilidad esperada (fórmula ELO)
        $probabilidadEquipo1 = 1 / (1 + pow(10, ($eroPromedioEquipo2 - $eroPromedioEquipo1) / 400));
        $probabilidadEquipo2 = 1 - $probabilidadEquipo1;

        // Determinar resultado (1 = victoria, 0.5 = empate, 0 = derrota)
        $resultadoEquipo1 = $this->winner_team == 1 ? 1 : ($this->winner_team == 2 ? 0 : 0.5);
        $resultadoEquipo2 = 1 - $resultadoEquipo1;

        // K-factor: más alto para jugadores nuevos, menor para experimentados
        $kFactor = 32;

        // Actualizar ERO de jugadores del equipo 1
        foreach ($jugadoresEquipo1 as $jugador) {
            $sportPivot = $jugador->sports()->where('sport_id', $this->deporte_id)->first();
            $eroActual = $sportPivot->pivot->ero;
            $partidosJugados = $sportPivot->pivot->matches_played;
            
            // Ajustar K-factor según experiencia
            $kAjustado = $partidosJugados < 10 ? 40 : ($partidosJugados < 30 ? 32 : 24);
            
            // Calcular nuevo ERO
            $cambioEro = round($kAjustado * ($resultadoEquipo1 - $probabilidadEquipo1));
            $nuevoEro = max(100, $eroActual + $cambioEro); // Mínimo 100
            
            // Actualizar en base de datos
            $jugador->sports()->updateExistingPivot($this->deporte_id, [
                'ero' => $nuevoEro,
                'matches_played' => $partidosJugados + 1
            ]);
        }

        // Actualizar ERO de jugadores del equipo 2
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

