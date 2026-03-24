<?php

namespace App\Http\Controllers;

use App\Models\Sport;
use Illuminate\Http\Request;

class SportController extends Controller
{
    //Funcion para obtener todos los deportes en un endpoint público.
    public function index()
    {
        $sports = Sport::all();
        return response()->json($sports, 200);
    }

    //Funcion para mostrar un deporte en específico.
    public function show($id)
    {
        $sport = Sport::find($id);

        if (!$sport) {
            return response()->json([
                'message' => 'Deporte no encontrado'
            ], 404);
        }

        return response()->json($sport, 200);
    }
}
