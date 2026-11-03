<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class EloController extends Controller
{
    //Devuelve el ELO del usuario
    public function myElo(Request $request)
    {
        $user = $request->user();

        $sports = $user->sports()
            ->select('sports.id', 'sports.nombre')
            ->get()
            ->map(function ($sport) {
                return [
                    'sport_id' => $sport->id,
                    'sport_name' => $sport->nombre,
                    'elo' => (int) $sport->pivot->elo,
                    'matches_played' => (int) $sport->pivot->matches_played,
                ];
            });

        return response()->json([
            'user_id' => $user->id,
            'sports' => $sports,
        ]);
    }
}
