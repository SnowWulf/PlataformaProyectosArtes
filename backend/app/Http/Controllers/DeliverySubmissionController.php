<?php

namespace App\Http\Controllers;

use App\Models\ProjectDelivery;
use App\Models\DeliverySubmission;
use App\Helpers\ActivityLogger; // 👈 Importar ActivityLogger
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
}