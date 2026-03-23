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
        // Escalar todos los ELOs dividiéndolos entre 10
        // Ejemplo: 1200 -> 120, 800 -> 80, 1000 -> 100
        DB::table('sport_user')->update([
            'elo' => DB::raw('GREATEST(0, CAST(elo / 10 AS INTEGER))')
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir: multiplicar por 10
        DB::table('sport_user')->update([
            'elo' => DB::raw('elo * 10')
        ]);
    }
};
