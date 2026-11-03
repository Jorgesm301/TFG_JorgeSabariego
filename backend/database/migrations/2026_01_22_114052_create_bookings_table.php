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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deporte_id')->constrained('sports')->onDelete('cascade');
            $table->foreignId('creador_id')->constrained('users')->onDelete('cascade');
            $table->date('fecha');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('pista')->default('Pista 1');
            $table->integer('max_jugadores');
            $table->integer('jugadores_actuales')->default(1);
            $table->enum('estado', ['abierto', 'completo', 'cancelado'])->default('abierto');
            $table->timestamps();

            // Índice para búsquedas rápidas por deporte y fecha
            $table->index(['deporte_id', 'fecha', 'hora_inicio']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
