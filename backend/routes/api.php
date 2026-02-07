<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SportController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\EroController;
use App\Http\Controllers\MatchController;
use App\Models\User;


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

//Ruta para el registro
Route::post('/register', [AuthController::class, 'register']);

//Ruta para el login
Route::post('/login', [AuthController::class, 'login']);

//Ruta para ver todos los usuarios
Route::get('/ver-usuarios', function () {
    return User::all();
});

// Rutas públicas para deportes (sin autenticación)
Route::get('/sports', [SportController::class, 'index']);
Route::get('/sports/{id}', [SportController::class, 'show']);

// Rutas públicas para reservas (ver reservas disponibles)
Route::get('/bookings/sport/{sportId}/fecha/{fecha}', [BookingController::class, 'getReservasPorSportYFecha']);
Route::get('/bookings/disponibles/{sportId}', [BookingController::class, 'reservasDisponibles']);

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

    // Para probar el ERO
    Route::get('/me/ero', [EroController::class, 'myEro']);
});
