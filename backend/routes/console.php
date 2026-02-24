<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Programar el procesamiento automático de partidos vencidos
// Se ejecuta cada hora para verificar si hay partidos que necesiten resultado por defecto
Schedule::command('partidos:procesar-vencidos')->hourly();
