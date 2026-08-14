<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\UserAlertPreference;
use App\Models\User;
use App\Services\TelegramService; // 1. Importamos TelegramService

class NotificationEngineService
{
    /**
     * Procesa y guarda una notificación si el usuario tiene habilitado el tipo de alerta.
     * También despacha el mensaje vía Telegram.
     *
     * @param User|int $user Instancia de User o el ID del usuario destinatario
     * @param string $tipoClave 'documento_revisado', 'respuesta_tutoria', 'nueva_entrega', 'mensajes_proyecto', 'proyecto_por_finalizar', 'invitacion_proyecto'
     * @param string $titulo Título visible en la alerta
     * @param string $mensaje Descripción de la alerta
     * @param string|null $link Ruta interna a la que redirigir al hacer clic (ej. '/dashboard/projects/5')
     * @return Notification|null Retorna el modelo de la notificación o null si estaba deshabilitada por el usuario
     */
    public function notify(
        User|int $user,
        string $tipoClave,
        string $titulo,
        string $mensaje,
        ?string $link = null
    ): ?Notification {
        $recipient = $user instanceof User ? $user : User::find($user);

        if (!$recipient) {
            return null;
        }

        // 1. Obtener o inicializar las preferencias de alertas del usuario
        $pref = UserAlertPreference::firstOrCreate(
            ['user_id' => $recipient->id],
            [
                'global_enabled' => true,
                'preferences' => UserAlertPreference::defaultPreferences()
            ]
        );

        // 2. Si las alertas globales están apagadas, ignorar
        if (!$pref->global_enabled) {
            return null;
        }

        // 3. Si el tipo de alerta específico está deshabilitado, ignorar
        $preferences = $pref->preferences ?? [];
        if (isset($preferences[$tipoClave]) && !$preferences[$tipoClave]) {
            return null;
        }

        // 4. Crear la notificación In-App
        $notification = Notification::create([
            'user_id' => $recipient->id,
            'title'   => $titulo,
            'message' => $mensaje,
            'type'    => $tipoClave,
            'is_read' => false,
            'link'    => $link,
        ]);

        // 5. Despachar mensaje a Telegram
        // Si el usuario ya vinculó su Telegram se envía a su Chat ID.
        // Mientras están en pruebas, si no tiene vinculado uno, lo envía a tu TELEGRAM_ADMIN_CHAT_ID.
        $chatIdTarget = $recipient->telegram_chat_id ?? env('TELEGRAM_ADMIN_CHAT_ID');

        if ($chatIdTarget) {
            $urlApp = config('app.url');
            $mensajeTelegram = "{$titulo}\n\n"
                . "{$mensaje}\n\n"
                . ($link ? "🔗 *Ver más:* {$urlApp}{$link}" : "");

            TelegramService::enviarNotificacion($chatIdTarget, $mensajeTelegram);
        }

        return $notification;
    }
}