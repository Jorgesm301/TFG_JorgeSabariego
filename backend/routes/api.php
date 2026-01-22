<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeporteController;
use App\Http\Controllers\BookingController;
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
Route::get('/deportes', [DeporteController::class, 'index']);
Route::get('/deportes/{id}', [DeporteController::class, 'show']);

// Rutas públicas para reservas (ver reservas disponibles)
Route::get('/bookings/deporte/{deporteId}/fecha/{fecha}', [BookingController::class, 'getReservasPorDeporteYFecha']);
Route::get('/bookings/disponibles/{deporteId}', [BookingController::class, 'reservasDisponibles']);

// Rutas protegidas para reservas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/bookings', [BookingController::class, 'crearReserva']);
    Route::post('/bookings/{bookingId}/unirse', [BookingController::class, 'unirseAReserva']);
    Route::delete('/bookings/{bookingId}/salir', [BookingController::class, 'salirseDeReserva']);
    Route::get('/mis-bookings', [BookingController::class, 'misReservas']);
});
