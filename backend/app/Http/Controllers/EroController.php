<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class EroController extends Controller
{
    //Devuelve el ERO del usuario
    public function myEro(Request $request)
    {
        $user = $request->user();

        $sports = $user->sports()
            ->select('deportes.id', 'deportes.nombre')
            ->get()
            ->map(function ($sport) {
                return [
                    'sport_id' => $sport->id,
                    'sport_name' => $sport->nombre,
                    'ero' => (int) $sport->pivot->ero,
                    'matches_played' => (int) $sport->pivot->matches_played,
                ];
            });

        return response()->json([
            'user_id' => $user->id,
            'sports' => $sports,
        ]);
    }
}
