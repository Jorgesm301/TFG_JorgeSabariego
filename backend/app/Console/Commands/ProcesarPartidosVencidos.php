<?php

namespace App\Console\Commands;

use App\Models\Booking;
use Illuminate\Console\Command;

class ProcesarPartidosVencidos extends Command
{

    //Nombre del comando de la consola
    protected $signature = 'partidos:procesar-vencidos';


    //Descripción del comando
    protected $description = 'Procesa partidos vencidos sin resultado y les aplica 0-0 por defecto sin actualizar ELO';


    public function handle()
    {
        $this->info('Buscando partidos vencidos sin resultado');

        $procesados = Booking::procesarPartidosVencidos();

        if ($procesados > 0) {
            $this->info("Se procesaron {$procesados} partido(s) vencido(s)");
            $this->info("   Resultado aplicado: 0-0 (sin actualizar ELO)");
        } else {
            $this->info("ℹNo se encontraron partidos vencidos pendientes");
        }

        return 0;
    }
}
