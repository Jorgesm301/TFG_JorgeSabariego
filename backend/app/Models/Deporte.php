<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Deporte extends Model
{
    use HasFactory;

    protected $table = 'deportes';

    protected $fillable = [
        'nombre',
        'max_jugadores',
        'descripcion',
        'duracion_minutos',
    ];

    /**
     * Relación: Un deporte tiene muchas reservas
     */
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function users(){
        return $this->belongsToMany(User::class, 'sport_user', 'sport_id', 'user_id')
                    ->withPivot('ero', 'matches_played')
                    ->withTimestamps();
    }

}
