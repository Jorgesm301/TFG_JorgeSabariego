<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // <-- AÑADIR

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable; // <-- AÑADIR HasApiTokens

    protected $fillable = [
        'name',
        'last_name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relación: Un usuario tiene muchas reservas creadas
     */
    public function bookingsCreadas()
    {
        return $this->hasMany(Booking::class, 'creador_id');
    }

    /**
     * Relación: Un usuario puede estar en muchas reservas
     */
    public function bookings()
    {
        return $this->belongsToMany(Booking::class, 'booking_user')
                    ->withPivot('es_creador')
                    ->withTimestamps();
    }
}
