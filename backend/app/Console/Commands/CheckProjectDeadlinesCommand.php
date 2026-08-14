<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Project;
use App\Services\NotificationEngineService;
use Carbon\Carbon;

class CheckProjectDeadlinesCommand extends Command
{
    /**
     * El nombre y firma del comando en la consola.
     */
    protected $signature = 'projects:check-deadlines';

    /**
     * Descripción del comando.
     */
    protected $description = 'Verifica proyectos con fechas de entrega próximas (3 días, 1 día o hoy) y envía notificaciones.';

    /**
     * Ejecutar la lógica del comando.
     */
    public function handle(NotificationEngineService $notifier)
    {
        $today = Carbon::today();

        // Proyectos activos que tienen fecha límite
        $projects = Project::whereNotNull('fecha_fin')
            ->whereIn('estado', ['En proceso', 'Pendiente', 'Activo']) // Ajusta los estados según tu BD
            ->with(['collaborators', 'owner', 'tutor'])
            ->get();

        $countNotificaciones = 0;

        foreach ($projects as $project) {
            $fechaFin = Carbon::parse($project->fecha_fin)->startOfDay();
            $diasRestantes = $today->diffInDays($fechaFin, false);

            $titulo = '';
            $mensaje = '';
            $tipoClave = 'alerta_vencimiento';

            // Evaluar según los días faltantes
            if ($diasRestantes === 3) {
                $titulo = '⏰ Proyecto Próximo a Vencer (3 Días)';
                $mensaje = "El proyecto '{$project->titulo}' vence en 3 días ({$fechaFin->format('d/m/Y')}).";
            } elseif ($diasRestantes === 1) {
                $titulo = '⚠️ Proyecto Próximo a Vencer Mañana';
                $mensaje = "El proyecto '{$project->titulo}' vence mañana. Revisa las entregas pendientes.";
            } elseif ($diasRestantes === 0) {
                $titulo = '🚨 ¡Hoy Vence el Proyecto!';
                $mensaje = "Hoy es la fecha límite para la entrega del proyecto '{$project->titulo}'.";
            } else {
                continue; // No requiere alerta aún
            }

            // Recopilar todos los usuarios involucrados (Owner, Colaboradores, Tutor)
            $usuariosAnotificar = collect([$project->owner_id]);

            if ($project->tutor_id) {
                $usuariosAnotificar->push($project->tutor_id);
            }

            foreach ($project->collaborators as $collaborator) {
                $usuariosAnotificar->push($collaborator->id);
            }

            // Eliminar IDs duplicados
            $usuariosAnotificar = $usuariosAnotificar->unique()->filter();

            // Enviar la notificación a cada integrante
            foreach ($usuariosAnotificar as $userId) {
                $notifier->notify(
                    user: $userId,
                    tipoClave: $tipoClave,
                    titulo: $titulo,
                    mensaje: $mensaje,
                    link: '/dashboard/projects/' . $project->id
                );
                $countNotificaciones++;
            }
        }

        $this->info("Proceso completado. Se enviaron {$countNotificaciones} alertas de vencimiento.");
        return Command::SUCCESS;
    }
}