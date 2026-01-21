<?php

namespace App\Http\Controllers;

use App\Models\Deporte;
use Illuminate\Http\Request;

class DeporteController extends Controller
{
    /**
     * Obtener todos los deportes (endpoint público)
     */
    public function index()
    {
        $deportes = Deporte::all();
        return response()->json($deportes, 200);
    }

    /**
     * Obtener un deporte específico (endpoint público)
     */
    public function show($id)
    {
        $deporte = Deporte::find($id);

        if (!$deporte) {
            return response()->json([
                'message' => 'Deporte no encontrado'
            ], 404);
        }

        return response()->json($deporte, 200);
    }
}
