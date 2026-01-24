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
                    ->withPivot('es_creador')
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
}

