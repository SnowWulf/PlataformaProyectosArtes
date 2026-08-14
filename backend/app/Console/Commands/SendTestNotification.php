<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\NotificationEngineService;

class SendTestNotification extends Command
{
    /**
     * El nombre y firma del comando en la consola.
     */
    protected $signature = 'notify:test {user_id? : ID del usuario que recibirá la notificación}';

    /**
     * Descripción del comando.
     */
    protected $description = 'Envía una notificación de prueba a un usuario específico o al primero registrado';

    /**
     * Ejecuta el comando.
     */
    public function handle(NotificationEngineService $notifier)
    {
        $userId = $this->argument('user_id');

        // Si no se pasa un ID, toma el primer usuario de la base de datos
        $user = $userId ? User::find($userId) : User::first();

        if (!$user) {
            $this->error('❌ No se encontró ningún usuario en la base de datos.');
            return Command::FAILURE;
        }

        // Títulos y mensajes de prueba
        $ejemplos = [
            [
                'tipo' => 'nueva_entrega',
                'titulo' => '📌 Nueva Entrega: Avance de Proyecto',
                'mensaje' => 'El tutor asignó la tarea "Entrega de Borrador Final".',
                'link' => '/dashboard/projects'
            ],
            [
                'tipo' => 'respuesta_tutoria',
                'titulo' => '✅ Solicitud de Tutoría Aceptada',
                'mensaje' => 'El tutor ha aceptado tu solicitud para el proyecto.',
                'link' => '/dashboard/tutorships'
            ],
            [
                'tipo' => 'mensajes_proyecto',
                'titulo' => '💬 Nuevo mensaje en el Proyecto',
                'mensaje' => 'Juan Pérez: "¿Cuándo nos reunimos para revisar los avances?"',
                'link' => '/dashboard/projects'
            ]
        ];

        $prueba = $ejemplos[array_rand($ejemplos)];

        $notifier->notify(
            user: $user->id,
            tipoClave: $prueba['tipo'],
            titulo: $prueba['titulo'],
            mensaje: $prueba['mensaje'],
            link: $prueba['link']
        );

        $this->info("✅ Notificación de prueba enviada con éxito a: {$user->name} (ID: {$user->id})");
        $this->line("   • Título: {$prueba['titulo']}");
        $this->line("   • Tipo: {$prueba['tipo']}");

        return Command::SUCCESS;
    }
}