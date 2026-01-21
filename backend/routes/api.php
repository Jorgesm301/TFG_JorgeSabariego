<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeporteController;
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
