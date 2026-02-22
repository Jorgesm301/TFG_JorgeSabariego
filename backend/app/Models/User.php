<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'last_name',
        'ubicacion',
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

    //Un usuario tiene muchas reservas creadas. Reservas creadas por el usuario.
    public function bookingsCreadas()
    {
        return $this->hasMany(Booking::class, 'creador_id');
    }


    //Un usuario pertenece a muchas reservas. Reservas en las que participa el usuario. Aqui usamos la tabla pivote booking_user.
    public function bookings()
    {
        return $this->belongsToMany(Booking::class, 'booking_user')
                    ->withPivot('es_creador')
                    ->withTimestamps();
    }


    //Un usuario juega a varios deportes. Aqui usamos la tabla pivote sport_user.
    public function sports(){
        return $this->belongsToMany(Sport::class, 'sport_user', 'user_id', 'sport_id')
                    ->withPivot('ero', 'matches_played')
                    ->withTimestamps();
    }

    //Inicializa el ERO de un deporte para el usuario si no existe ya.
    public function initSportEro(int $deporteId)
    {

        $exists = $this->sports()->wherePivot('sport_id', $deporteId)->exists();

        if (!$exists) {
            $this->sports()->attach($deporteId, [
                'ero' => 1000,
                'matches_played' => 0
            ]);
        }
    }

    // ========== RELACIONES DE AMISTAD ==========

    // Solicitudes de amistad que YO envío
    public function sentFriendRequests()
    {
        return $this->hasMany(Friendship::class, 'user_id');
    }

    // Solicitudes de amistad que YO recibo
    public function receivedFriendRequests()
    {
        return $this->hasMany(Friendship::class, 'friend_id');
    }

    // Mis amigos (solo los aceptados)
    public function friends()
    {
        return $this->belongsToMany(User::class, 'friendships', 'user_id', 'friend_id')
                    ->wherePivot('status', 'accepted')
                    ->withPivot('status')
                    ->withTimestamps();
    }

    // ========== RELACIONES DE MENSAJES ==========

    // Mensajes que YO envío
    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    // Mensajes que YO recibo
    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    // ========== RELACIONES DE BLOQUEOS ==========

    // Usuarios que YO bloqueo
    public function blockedUsers()
    {
        return $this->belongsToMany(User::class, 'blocked_users', 'user_id', 'blocked_user_id')
                    ->withTimestamps();
    }

    // Usuarios que ME bloquean
    public function blockedBy()
    {
        return $this->belongsToMany(User::class, 'blocked_users', 'blocked_user_id', 'user_id')
                    ->withTimestamps();
    }

}
