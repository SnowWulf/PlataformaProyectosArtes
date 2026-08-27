<?php

namespace App\Http\Controllers;

use App\Models\ProjectDelivery;
use App\Models\DeliverySubmission;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class DeliverySubmissionController extends Controller
{
    public function store(
        Request $request,
        ProjectDelivery $delivery
    )
    {
        $validated = $request->validate([
            'file' => 'required|file|max:20480',
            'comentario' => 'nullable|string'
        ]);

        $path = $request
            ->file('file')
            ->store('delivery_submissions', 'public');

        $user = $request->user();

        // 1. Verificamos si ya existía una entrega previa de este estudiante
        $existiaPreviamente = DeliverySubmission::where('delivery_id', $delivery->id)
            ->where('student_id', $user->id)
            ->exists();

        // 2. Guardamos o actualizamos la entrega
        $submission = DeliverySubmission::updateOrCreate(
            [
                'delivery_id' => $delivery->id,
                'student_id' => $user->id
            ],
            [
                'file_path' => $path,
                'comentario' => $validated['comentario'] ?? null,
                'estado' => 'submitted'
            ]
        );

        // 3. Registrar en ActivityLogger
        $accion = $existiaPreviamente ? 'delivery_response_updated' : 'delivery_response_created';
        $mensaje = $existiaPreviamente
            ? $user->name . ' actualizó su respuesta en la tarea "' . $delivery->titulo . '"'
            : $user->name . ' respondió a la tarea "' . $delivery->titulo . '"';

        ActivityLogger::log(
            $delivery->project_id,
            $user->id,
            $accion,
            $mensaje,
            [
                'project_id' => $delivery->project_id,
                'delivery_id' => $delivery->id,
                'delivery_title' => $delivery->titulo,
                'submission_id' => $submission->id
            ]
        );

        return response()->json(
            $submission,
            201
        );
    }

    public function index(
        ProjectDelivery $delivery
    )
    {
        return $delivery
            ->submissions()
            ->with('student')
            ->get();
    }

    /**
     * Actualiza la revisión (calificación y retroalimentación/comentario) de una entrega.
     */
    public function update(
        Request $request,
        $id
    )
    {
        // Buscar explícitamente el registro por su ID para garantizar el UPDATE
        $submission = DeliverySubmission::findOrFail($id);

        $validated = $request->validate([
            'comentario'    => 'nullable|string',
            'observaciones' => 'nullable|string',
            'nota'          => 'nullable|string',
            'estado'        => 'nullable|in:submitted,reviewed,approved,rejected'
        ]);

        // Mapear los campos a actualizar
        $comentarioFinal = $request->input('comentario') 
            ?? $request->input('observaciones') 
            ?? $submission->comentario;

        $submission->comentario = $comentarioFinal;
        
        if ($request->has('nota')) {
            $submission->nota = $validated['nota'];
        }

        $submission->estado = $validated['estado'] ?? 'reviewed';

        // Ejecutar UPDATE en la base de datos
        $submission->save();

        // Log de actividad protegido
        try {
            $user = $request->user();
            $delivery = ProjectDelivery::find($submission->delivery_id);

            if ($delivery) {
                $nombreUsuario = $user ? $user->name : 'El tutor';
                $userId = $user ? $user->id : $submission->student_id;

                ActivityLogger::log(
                    $delivery->project_id,
                    $userId,
                    'delivery_submission_reviewed',
                    $nombreUsuario . ' revisó la entrega de la tarea "' . $delivery->titulo . '"',
                    [
                        'project_id' => $delivery->project_id,
                        'delivery_id' => $delivery->id,
                        'submission_id' => $submission->id,
                        'nota' => $submission->nota
                    ]
                );
            }
        } catch (\Throwable $e) {
            Log::error('Error registrando ActivityLogger: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Revisión guardada con éxito.',
            'data'    => $submission->fresh()->load('student')
        ], 200);
    }
}