<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ProjectChatMessage;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

class ProjectAiChatController extends Controller
{
    /**
     * Obtener el historial de chat del proyecto.
     */
    public function getHistory($projectId)
    {
        try {
            $messages = ProjectChatMessage::where('project_id', $projectId)
                ->orderBy('created_at', 'asc')
                ->get(['id', 'sender', 'text', 'created_at as timestamp']);

            return response()->json($messages);
        } catch (\Exception $e) {
            Log::error("Error al obtener historial de chat para project_id {$projectId}: " . $e->getMessage());
            return response()->json([], 200); // Retornar array vacío para evitar romper el frontend
        }
    }

    /**
     * Procesar la pregunta del estudiante enviándola a Gemini con el contexto del proyecto.
     */
    public function chat(Request $request, $projectId)
    {
        // Ampliar tiempo límite de ejecución a 60 segundos por la consulta a Gemini
        set_time_limit(60);

        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $userMessage = $request->input('message');

        // 1. Cargar la información del proyecto y sus relaciones
        $project = Project::with([
            'deliveries',                     // Carga project_deliveries
            'documents.reviews'              // Carga documents y document_reviews
        ])->find($projectId);

        if (!$project) {
            return response()->json(['error' => 'Proyecto no encontrado.'], 404);
        }

        // 2. Guardar el mensaje del usuario en la Base de Datos
        ProjectChatMessage::create([
            'project_id' => $projectId,
            'sender'     => 'user',
            'text'       => $userMessage,
        ]);

        // 3. Estructurar la información contextual del proyecto
        $context = $this->buildProjectContext($project);

        // 4. Construir el Prompt del Sistema completo
        $systemPrompt = $this->buildSystemPrompt($projectId, $context);

        try {
            $promptCompleto = $systemPrompt . "\n\nPregunta del estudiante: " . $userMessage;

            // 5. Enviar a Gemini utilizando métodos nativos con respaldo seguro
            $aiResponse = $this->generateContentWithFallback($promptCompleto);

            // 6. Guardar la respuesta de la IA en la Base de Datos
            $chatRecord = ProjectChatMessage::create([
                'project_id' => $projectId,
                'sender'     => 'ai',
                'text'       => $aiResponse,
            ]);

            return response()->json([
                'response'  => $aiResponse,
                'timestamp' => $chatRecord->created_at,
            ]);

        } catch (\Exception $e) {
            Log::error("Error general en Gemini API para project_id {$projectId}: " . $e->getMessage());

            return response()->json([
                'response' => '⚠️ Ocurrió un inconveniente al conectar con Gemini. Revisa la configuración de la API Key o los logs del servidor.',
                'error'    => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ejecuta la generación de contenido usando los métodos nativos de la Facade de Gemini.
     */
    private function generateContentWithFallback(string $prompt): string
{
    try {

        $result = Gemini::generativeModel(
            model: 'gemini-3.5-flash'
        )->generateContent($prompt);

        return $result->text();

    } catch (\Exception $e) {

        Log::error(
            'Error al generar contenido con Gemini: ' .
            $e->getMessage()
        );

        throw $e;
    }
}

    /**
     * Formatear las tablas de la BD a texto estructurado para Gemini con fallbacks seguros.
     */
    private function buildProjectContext(Project $project): string
    {
        $titulo = $project->titulo ?? $project->title ?? 'Sin título';
        $descripcion = $project->descripcion ?? $project->description ?? 'Sin descripción';
        $estado = $project->estado ?? $project->status ?? 'En proceso';

        $info = "DATOS DEL PROYECTO:\n";
        $info .= "- ID: {$project->id}\n";
        $info .= "- Título: {$titulo}\n";
        $info .= "- Descripción: {$descripcion}\n";
        $info .= "- Estado actual: {$estado}\n\n";

        $info .= "ENTREGAS DEL PROYECTO (project_deliveries):\n";
        if ($project->deliveries && $project->deliveries->count() > 0) {
            foreach ($project->deliveries as $del) {
                $delTitulo = $del->titulo ?? $del->title ?? 'Entrega sin título';
                $delFecha = $del->fecha_limite ?? $del->due_date ?? 'Sin fecha';
                $delEstado = $del->estado ?? $del->status ?? 'Pendiente';
                $delDesc = $del->descripcion ?? $del->description ?? '';

                $info .= "  • [ID: {$del->id}] Título: {$delTitulo} | Fecha Límite: {$delFecha} | Estado: {$delEstado}\n";
                if (!empty($delDesc)) {
                    $info .= "    Descripción: {$delDesc}\n";
                }
            }
        } else {
            $info .= "  • No hay entregas registradas aún.\n";
        }
        $info .= "\n";

        $info .= "DOCUMENTOS Y REVISIONES DEL TUTOR (documents / document_reviews):\n";
        if ($project->documents && $project->documents->count() > 0) {
            foreach ($project->documents as $doc) {
                $docNombre = $doc->nombre ?? $doc->name ?? 'Documento';
                $docPath = $doc->file_path ?? $doc->ruta ?? 'Sin archivo';

                $info .= "  • Documento: {$docNombre} (Archivo: {$docPath})\n";

                if (!empty($doc->extracted_text)) {
                    $info .= "    Contenido extraído del archivo: " . substr($doc->extracted_text, 0, 1500) . "...\n";
                }

                if ($doc->reviews && $doc->reviews->count() > 0) {
                    foreach ($doc->reviews as $rev) {
                        $revComentario = $rev->comment ?? $rev->comentario ?? 'Sin observaciones';
                        $revEstado = $rev->status ?? $rev->estado ?? 'Pendiente';

                        $info .= "    - Revisión Tutor: {$revComentario} | Calificación/Estado: {$revEstado} | Fecha: {$rev->created_at}\n";
                    }
                } else {
                    $info .= "    - Sin observaciones registradas para este documento.\n";
                }
            }
        } else {
            $info .= "  • No hay documentos subidos a este proyecto.\n";
        }

        return $info;
    }

    /**
     * Inyectar el Prompt del Sistema exacto con las reglas requeridas.
     */
    private function buildSystemPrompt($projectId, string $context): string
    {
        return <<<PROMPT
Actúa como un asistente académico especializado en proyectos universitarios.
Estás integrado dentro de una plataforma de gestión de proyectos de la Facultad de Artes. El usuario puede acceder al asistente desde la vista de detalle de un proyecto específico, mediante un botón flotante de chatbot.
El asistente debe utilizar como contexto principal la información correspondiente al proyecto actual, identificado mediante project_id = {$projectId}.

Para construir el contexto del proyecto, se ha consultado y relacionado la información disponible en:
- projects: información general del proyecto.
- project_deliveries: entregas asignadas al proyecto, incluyendo títulos, descripciones y fechas límite.
- documents: documentos que los estudiantes han subido al proyecto.
- document_reviews: revisiones, observaciones, correcciones y comentarios realizados por el tutor sobre los documentos.

==================================================
CONTEXTO REAL DEL PROYECTO ID: {$projectId}
==================================================
{$context}
==================================================

Objetivo principal:
Ayudar al estudiante a comprender qué necesita hacer para avanzar correctamente en su proyecto.
Analiza conjuntamente:
- El estado actual del proyecto.
- Las entregas pendientes y próximas.
- Los documentos que ya han sido enviados.
- Las observaciones realizadas por el tutor.
- Las correcciones que todavía podrían estar pendientes.
- El contenido de los documentos disponibles.

A partir de esta información, debes proporcionar recomendaciones concretas y relacionadas directamente con el proyecto.

Análisis de las revisiones del tutor:
- Identifica: correcciones solicitadas, observaciones importantes, problemas recurrentes, recomendaciones del tutor y aspectos que parecen estar pendientes.
- No debes afirmar que una corrección ya fue solucionada si la información disponible no lo demuestra.
- Si existe una observación del tutor que todavía parece relevante, indícala claramente.

Análisis de entregas:
- Determina entregas pendientes, próximas fechas límite y entregas que ya deberían haberse realizado.
- Si una entrega está próxima a vencer, debe recibir mayor prioridad en las recomendaciones.

Priorización:
Organiza las recomendaciones según prioridad:
🔴 Alta: actividades urgentes, entregas próximas o correcciones importantes señaladas por el tutor.
🟡 Media: actividades necesarias para mejorar el proyecto pero que no son inmediatamente urgentes.
🟢 Baja: recomendaciones de mejora o actividades que pueden realizarse posteriormente.

Reglas importantes:
- No inventes información sobre el proyecto, comentarios del tutor ni contenido de documentos.
- Diferencia claramente entre información encontrada en el proyecto y recomendaciones generadas por IA.
- Si no existe suficiente información para responder, dilo explícitamente.
- No sustituyas el criterio del tutor.
- Las recomendaciones deben ser prácticas y específicas. Evita respuestas genéricas.
- Siempre utiliza project_id = {$projectId} como identificador principal.

Formato recomendado de respuesta:
Cuando sea apropiado (en consultas generales), puedes estructurar la respuesta así:
📌 Situación actual
🔴 Prioridad
📝 Correcciones pendientes
📚 Documentos relacionados
➡️ Siguiente paso recomendado
💡 Sugerencias

Si el usuario realiza una pregunta concreta, responde directamente sin utilizar necesariamente toda esta estructura.
PROMPT;
    }
}