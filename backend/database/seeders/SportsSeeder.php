<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Sport;

class SportsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sports = [
            [
                'nombre' => 'Futbol',
                'max_jugadores' => 22,
                'duracion_minutos' => 60,
                'descripcion' => 'Futbol 11vs11'
            ],
            [
                'nombre' => 'Futbol Sala',
                'max_jugadores' => 10,
                'duracion_minutos' => 60,
                'descripcion' => 'Futbol sala 5vs5'
            ],
            [
                'nombre' => 'Baloncesto',
                'max_jugadores' => 10,
                'duracion_minutos' => 60,
                'descripcion' => 'Baloncesto 5vs5'
            ],
            [
                'nombre' => 'Tenis',
                'max_jugadores' => 2,
                'duracion_minutos' => 90,
                'descripcion' => 'Tenis individual'
            ],
            [
                'nombre' => 'Padel',
                'max_jugadores' => 4,
                'duracion_minutos' => 90,
                'descripcion' => 'Padel dobles'
            ],
            [
                'nombre' => 'Voleibol',
                'max_jugadores' => 12,
                'duracion_minutos' => 60,
                'descripcion' => 'Voleibol 6vs6'
            ],
            [
                'nombre' => 'Natacion',
                'max_jugadores' => 1,
                'duracion_minutos' => 45,
                'descripcion' => 'Sesion de natacion'
            ],
            [
                'nombre' => 'Atletismo',
                'max_jugadores' => 1,
                'duracion_minutos' => 60,
                'descripcion' => 'Sesion de atletismo'
            ]
        ];

        foreach ($sports as $sport) {
            Sport::create($sport);
        }
    }
}
