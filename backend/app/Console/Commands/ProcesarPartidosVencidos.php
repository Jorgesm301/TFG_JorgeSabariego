<?php

namespace App\Console\Commands;

use App\Models\Booking;
use Illuminate\Console\Command;

class ProcesarPartidosVencidos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'partidos:procesar-vencidos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Procesa partidos vencidos sin resultado y les aplica 0-0 por defecto sin actualizar ELO';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Buscando partidos vencidos sin resultado...');

        $procesados = Booking::procesarPartidosVencidos();

        if ($procesados > 0) {
            $this->info("✅ Se procesaron {$procesados} partido(s) vencido(s)");
            $this->info("   Resultado aplicado: 0-0 (sin actualizar ELO)");
        } else {
            $this->info("ℹ️  No se encontraron partidos vencidos pendientes");
        }

        return 0;
    }
}
