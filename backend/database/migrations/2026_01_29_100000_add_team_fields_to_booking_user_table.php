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
        Schema::table('booking_user', function (Blueprint $table) {
            $table->integer('team')->nullable()->after('es_creador')->comment('Equipo asignado: 1 o 2');
            $table->integer('result')->nullable()->after('team')->comment('Puntuación individual del jugador');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_user', function (Blueprint $table) {
            $table->dropColumn(['team', 'result']);
        });
    }
};
