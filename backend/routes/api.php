<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Models\User;


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

//Ruta pra el registro
Route::post('/register', [AuthController::class, 'register']);

//Ruta para ver todos los usuarios
Route::get('/ver-usuarios', function () {
    return User::all();
});
