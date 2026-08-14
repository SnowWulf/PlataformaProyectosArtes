<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class TelegramAuthController extends Controller
{
    /**
     * Genera un enlace único de vinculación para el usuario autenticado.
     */
public function getConnectLink(Request $request)
{
    $user = $request->user();

    // SOLO generar token si NO tiene uno activo y tampoco tiene un chatId guardado.
    // Esto evita que las peticiones del polling destruyan el token mientras ves el QR.
    if (empty($user->telegram_connect_token) && empty($user->telegram_chat_id)) {
        $user->telegram_connect_token = Str::random(32);
        $user->save();
    }

    $token = $user->telegram_connect_token;
    $botUsername = env('TELEGRAM_BOT_USERNAME', 'gestArte_bot');
    $telegramUrl = "https://t.me/{$botUsername}?start={$token}";

    return response()->json([
        'telegram_url' => $telegramUrl,
        'is_connected' => !empty($user->telegram_chat_id),
        'telegram_chat_id' => $user->telegram_chat_id,
    ]);
}

    /**
     * Recibe la notificación de Telegram cuando el usuario presiona "Iniciar" /start
     */
   public function handleWebhook(Request $request)
{
    $data = $request->all();

    Log::info('=== TELEGRAM WEBHOOK ENTRANTE ===');
    Log::info('Payload:', $data);

    $message = $data['message'] ?? $data['edited_message'] ?? null;

    if ($message && isset($message['chat']['id'])) {
        $chatId = (string) $message['chat']['id'];
        $text = trim($message['text'] ?? '');

        Log::info("Mensaje de Chat ID {$chatId}: '{$text}'");

        if (str_starts_with(strtolower($text), '/start')) {
            // Extraer el token después de /start
            $parts = explode(' ', $text);
            $token = isset($parts[1]) ? trim($parts[1]) : null;

            Log::info("Token parseado del comando Telegram: '{$token}'");

            if ($token) {
                $user = User::where('telegram_connect_token', $token)->first();

                if ($user) {
                    $user->telegram_chat_id = $chatId;
                    $user->telegram_connect_token = null; // Limpiar token usado
                    $user->save();

                    Log::info("SUCCESS: Usuario ID {$user->id} ({$user->email}) vinculado con chat_id: {$chatId}");

                    // IMPORTANTE: Pasar `false` en el 3er parámetro para omitir la validación de BD en este primer mensaje de confirmación
                    TelegramService::enviarNotificacion(
                        $chatId,
                        "🎉 *¡Cuenta vinculada exitosamente!*\n\nHola {$user->name}, tu cuenta de gestArte ha sido conectada correctamente.",
                        false
                    );

                    return response()->json(['status' => 'success']);
                }

                Log::warning("ERROR: No existe usuario en BD con el token '{$token}'");
            } else {
                Log::warning("El usuario envió /start sin parámetro de token.");
            }

            // Si llegó a esta línea, significa que NO hubo un token válido
            TelegramService::enviarNotificacion(
                $chatId,
                "⚠️ El enlace de vinculación no es válido o ya fue utilizado. Genera uno nuevo en la plataforma.",
                false
            );

            return response()->json(['status' => 'invalid_token']);
        }
    }

    return response()->json(['status' => 'ok']);
}

    /**
     * Desvincula la cuenta de Telegram del usuario.
     */
    public function disconnect(Request $request)
    {
        $user = $request->user();
        $user->telegram_chat_id = null;
        $user->telegram_connect_token = null;
        $user->save();

        return response()->json([
            'message' => 'Cuenta de Telegram desvinculada correctamente.'
        ]);
    }
}