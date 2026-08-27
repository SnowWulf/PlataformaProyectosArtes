<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReviewModerationService
{
    /**
     * Evalúa el asunto y contenido de la reseña usando la API de Groq (openai/gpt-oss-20b).
     */
    public function moderarResena(string $asunto, string $observaciones): array
    {
        $apiKey = env('GROQ_API_KEY') ?? config('services.groq.key');
        $timeout = 15;

        if (!$apiKey) {
            Log::warning('GROQ_API_KEY no encontrada en .env');
            return [
                'aprobado' => false,
                'motivo' => 'Servicio de moderación no disponible.',
                'fallback' => true,
            ];
        }

        $prompt = "Actúa como un moderador de contenido estricto para la Facultad de Artes de la Universidad de Nariño.
Evalúa la siguiente reseña enviada por un usuario:

- Asunto: \"{$asunto}\"
- Comentario: \"{$observaciones}\"

CRITERIOS DE MODERACIÓN:
1. Rechazar (aprobado = false) si contiene insultos, groserías, vulgaridades, ofensas, ataques personales, política, difamación o faltas de respeto.
2. Rechazar (aprobado = false) si es spam, enlaces externos o texto aleatorio sin sentido.
3. Aprobar (aprobado = true) únicamente si es una opinión, sugerencia o testimonio respetuoso sobre la plataforma o proyectos de arte.

INSTRUCCIONES DE SALIDA:
Responde EXCLUSIVAMENTE en formato JSON válido con esta estructura exacta:
{
    \"aprobado\": true o false,
    \"motivo\": \"Explicación breve en español si fue rechazado, o null si fue aprobado\"
}";

        try {
            $response = Http::withoutVerifying()
                ->timeout($timeout)
                ->withToken(trim($apiKey))
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'openai/gpt-oss-20b',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Eres un moderador de contenido. Responde únicamente en formato JSON puro sin bloques de código ni texto adicional.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'temperature' => 0.0,
                    'response_format' => ['type' => 'json_object']
                ]);

            if ($response->successful()) {
                $rawContent = $response->json('choices.0.message.content');
                
                // Limpiar posibles etiquetas o marcas markdown si existieran
                $cleanJson = preg_replace('/```json\s*|\s*```/', '', trim($rawContent));
                $result = json_decode($cleanJson, true);

                $esAprobado = filter_var($result['aprobado'] ?? false, FILTER_VALIDATE_BOOLEAN);

                return [
                    'aprobado' => $esAprobado,
                    'motivo' => $esAprobado ? null : ($result['motivo'] ?? 'El comentario no cumple con las normas comunitarias.'),
                ];
            }

            Log::error('Error HTTP Groq API: ' . $response->status() . ' - ' . $response->body());
        } catch (\Throwable $e) {
            Log::error('Excepción al conectar con Groq: ' . $e->getMessage());
        }

        return [
            'aprobado' => false,
            'motivo' => 'Error de conexión con el servicio de moderación. Intente de nuevo.',
            'fallback' => true
        ];
    }
}