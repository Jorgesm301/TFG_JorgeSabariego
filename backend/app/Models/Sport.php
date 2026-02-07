<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sport extends Model
{
    use HasFactory;

    protected $table = 'sports';

    protected $fillable = [
        'nombre',
        'max_jugadores',
        'descripcion',
        'duracion_minutos',
    ];

    //Un deporte esta en muchas reservas.
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    //Un deporte tiene muchos usuarios que juegan a el. Aqui usamos la tabla pivote sport_user.
    public function users(){
        return $this->belongsToMany(User::class, 'sport_user', 'sport_id', 'user_id')
                    ->withPivot('ero', 'matches_played')
                    ->withTimestamps();
    }

}
