<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    /**
     * Envía un mensaje formateado en Markdown a un chatId de Telegram.
     *
     * @param string|int|null $chatId ID de Telegram del destinatario
     * @param string $mensaje Contenido del mensaje (acepta sintaxis Markdown)
     * @param bool $validarUsuario Si es true, verifica que el chatId exista en la BD antes de enviar
     * @return bool
     */
    public static function enviarNotificacion($chatId, string $mensaje, bool $validarUsuario = true): bool
    {
        $token = env('TELEGRAM_BOT_TOKEN');

        // 1. Si no existe token o chatId, cancelamos la ejecución
        if (!$token || !$chatId) {
            Log::warning('TelegramService: Falta configurar TELEGRAM_BOT_TOKEN o el chatId.');
            return false;
        }

        // 2. Control de Seguridad: Verificar que el chatId pertenezca a un usuario vinculado en la BD
        if ($validarUsuario) {
            $usuarioVinculado = User::where('telegram_chat_id', (string) $chatId)->exists();

            if (!$usuarioVinculado) {
                Log::warning("TelegramService: Envío cancelado. El Chat ID '{$chatId}' no está vinculado a ninguna cuenta activa en la BD.");
                return false;
            }
        }

        // 3. Proceso de envío
        $url = "https://api.telegram.org/bot{$token}/sendMessage";

        try {
            $response = Http::post($url, [
                'chat_id'    => $chatId,
                'text'       => $mensaje,
                'parse_mode' => 'Markdown',
            ]);

            if ($response->successful()) {
                Log::info("Notificación enviada a Telegram con éxito al Chat ID: {$chatId}");
                return true;
            }

            Log::error('Error de API Telegram: ' . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error('Excepción en TelegramService: ' . $e->getMessage());
            return false;
        }
    }
}