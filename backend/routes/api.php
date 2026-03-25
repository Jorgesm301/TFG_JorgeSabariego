<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SportController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\EloController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\FriendshipController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\BlockedUserController;
use App\Http\Controllers\GeocodeController;
use App\Models\User;


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

//Ruta para el registro
Route::post('/register', [AuthController::class, 'register']);

//Ruta para el login
Route::post('/login', [AuthController::class, 'login']);

// Rutas públicas para deportes (sin autenticación)
Route::get('/sports', [SportController::class, 'index']);
Route::get('/sports/{id}', [SportController::class, 'show']);

// Rutas públicas para reservas (ver reservas disponibles)
Route::get('/bookings/sport/{sportId}/fecha/{fecha}', [BookingController::class, 'getReservasPorSportYFecha']);
Route::get('/bookings/disponibles/{sportId}', [BookingController::class, 'reservasDisponibles']);
Route::post('/bookings/ubicacion/{sportId}', [BookingController::class, 'reservasPorUbicacion']);
Route::post('/bookings/radio/{sportId}', [BookingController::class, 'reservasPorRadio']);

//Ruta para la geolocalizacion
Route::get('/geocode', [GeocodeController::class, 'search']);

// Rutas protegidas para reservas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {


    Route::post('/bookings', [BookingController::class, 'crearReserva']);
    Route::post('/bookings/{bookingId}/unirse', [BookingController::class, 'unirseAReserva']);
    Route::delete('/bookings/{bookingId}/salir', [BookingController::class, 'salirseDeReserva']);
    Route::get('/mis-bookings', [BookingController::class, 'misReservas']);

    // Rutas para gestión de partidos y equipos
    Route::post('/matches/{bookingId}/generar-equipos', [MatchController::class, 'generarEquipos']);
    Route::get('/matches/{bookingId}/equipos', [MatchController::class, 'obtenerEquipos']);
    Route::post('/matches/{bookingId}/resultado', [MatchController::class, 'registrarResultado']);
    Route::get('/mis-partidos', [MatchController::class, 'historialPartidos']);

    // Para probar el ELO
    Route::get('/me/elo', [EloController::class, 'myElo']);

    //Rutas de amistad
    Route::get('/users/search', [FriendshipController::class, 'buscarUsuarios']);
    Route::post('/friendships', [FriendshipController::class, 'enviarSolicitud']);
    Route::put('/friendships/{id}/accept', [FriendshipController::class, 'aceptarSolicitud']);
    Route::put('/friendships/{id}/reject', [FriendshipController::class, 'rechazarSolicitud']);
    Route::get('/friends', [FriendshipController::class, 'listarAmigos']);
    Route::get('/friend-requests', [FriendshipController::class, 'listarSolicitudesPendientes']);
    Route::delete('/friendships/{id}', [FriendshipController::class, 'eliminarAmistad']);
    Route::delete('/friends/{friendId}', [FriendshipController::class, 'eliminarAmigoPorUserId']);

    //Rutas de mensajeria
    Route::post('/messages', [MessageController::class, 'enviarMensaje']);
    Route::get('/messages/{userId}', [MessageController::class, 'obtenerConversacion']);
    Route::get('/conversations', [MessageController::class, 'listarConversaciones']);
    Route::put('/messages/{id}/read', [MessageController::class, 'marcarComoLeido']);
    Route::put('/messages/conversation/{userId}/read', [MessageController::class, 'marcarConversacionLeida']);

    //Rutas de bloqueos
    Route::post('/blocked-users', [BlockedUserController::class, 'bloquearUsuario']);
    Route::delete('/blocked-users/{blockedUserId}', [BlockedUserController::class, 'desbloquearUsuario']);
    Route::get('/blocked-users', [BlockedUserController::class, 'listarBloqueados']);
});
