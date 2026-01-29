<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Ampliar el enum de estado para incluir 'jugado'
            $table->dropColumn('estado');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->enum('estado', ['abierto', 'completo', 'jugado', 'cancelado'])->default('abierto')->after('jugadores_actuales');
            $table->integer('team_1_score')->nullable()->after('estado')->comment('Puntuación del equipo 1');
            $table->integer('team_2_score')->nullable()->after('team_1_score')->comment('Puntuación del equipo 2');
            $table->integer('winner_team')->nullable()->after('team_2_score')->comment('Equipo ganador: 1 o 2, null si empate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['team_1_score', 'team_2_score', 'winner_team']);
            $table->dropColumn('estado');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->enum('estado', ['abierto', 'completo', 'cancelado'])->default('abierto');
        });
    }
};
