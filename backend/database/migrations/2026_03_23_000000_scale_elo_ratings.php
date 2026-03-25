<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        //Bajamos los ELOS dividiendolos por 10 y redondeando hacia abajo, asegurándonos de que no bajen de 0
        DB::table('sport_user')->update([
            'elo' => DB::raw('GREATEST(0, CAST(elo / 10 AS INTEGER))')
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //Multiplicamos los ELOS por 10 para volver a la escala original
        DB::table('sport_user')->update([
            'elo' => DB::raw('elo * 10')
        ]);
    }
};
