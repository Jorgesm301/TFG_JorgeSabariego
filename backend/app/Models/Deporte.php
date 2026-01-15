<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Deporte extends Model
{
    use HasFactory;

    protected $table = 'deportes'; // Opcional, pero ayuda si el plural es complejo

    protected $fillable = [
        'nombre',
        'max_jugadores',
        'descripcion',
    ];
}
