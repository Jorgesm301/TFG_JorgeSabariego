<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;

class GeocodeController extends Controller
{
    //Funcion para buscar coordenadas a partir de una dirección usando Nominatim
    public function search(Request $request)
    {
        $q = trim($request->query('q', ''));
        if ($q === '') {
            return response()->json(['found' => false, 'message' => 'Missing q'], 422);
        }

        /** @var Response $res */
        $res = Http::withHeaders([
                'User-Agent' => 'TFG-Polideportivo/1.0 (geocoding)',
                'Accept' => 'application/json',
            ])
            ->timeout(10)
            ->get('https://nominatim.openstreetmap.org/search', [
                'format' => 'json',
                'limit' => 1,
                'q' => $q,
                'accept-language' => 'es',
            ]);

        if ($res->failed()) {
            return response()->json([
                'found' => false,
                'message' => 'Nominatim error',
                'status' => $res->status(),
            ], 502);
        }

        $data = $res->json();

        if (!is_array($data) || count($data) === 0) {
            return response()->json(['found' => false], 200);
        }

        return response()->json([
            'found' => true,
            'lat' => (float) $data[0]['lat'],
            'lng' => (float) $data[0]['lon'],
            'display_name' => $data[0]['display_name'] ?? null,
        ]);
    }
}
