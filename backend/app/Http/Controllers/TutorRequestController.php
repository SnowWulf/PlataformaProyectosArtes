<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TutorRequest;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

class TutorRequestController extends Controller
{
    public function store(Request $request)
{
    $user = $request->user();

    // Solo los estudiantes pueden solicitar tutor
    if ($user->role->nombre !== 'Estudiante') {

        return response()->json([
            'message' => 'Solo los estudiantes pueden solicitar tutor.'
        ], 403);

    }

    // Buscar el proyecto
    $project = Project::findOrFail($request->project_id);

    // Verificar que el proyecto pertenezca al estudiante
    if ($project->owner_id !== $user->id) {

        return response()->json([
            'message' => 'No puede solicitar tutor para un proyecto que no es suyo.'
        ], 403);

    }

    // Verificar que aún no tenga tutor asignado
    if ($project->tutor_id) {

        return response()->json([
            'message' => 'Este proyecto ya tiene un tutor asignado.'
        ], 400);

    }

    // Verificar que no exista una solicitud pendiente
    $pendiente = TutorRequest::where('project_id', $project->id)
        ->where('estado', 'Pendiente')
        ->exists();

    if ($pendiente) {

        return response()->json([
            'message' => 'Ya existe una solicitud pendiente para este proyecto.'
        ], 400);

    }

    // Crear la solicitud
    $solicitud = TutorRequest::create([

        'project_id' => $project->id,
        'student_id' => $user->id,
        'tutor_id' => $request->tutor_id,
        'mensaje' => $request->mensaje,
        'estado' => 'Pendiente'

    ]);

    return response()->json($solicitud, 201);
}

public function pending(Request $request)
{
    $user = $request->user();

    // Solo los tutores pueden consultar sus solicitudes
    if ($user->role->nombre !== 'Tutor') {

        return response()->json([
            'message' => 'No autorizado.'
        ], 403);

    }

    $solicitudes = TutorRequest::with([
            'project',
            'student'
        ])
        ->where('tutor_id', $user->id)
        ->where('estado', 'Pendiente')
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json($solicitudes);
}

public function accept(Request $request, $id)
{
    $user = $request->user();

    if ($user->role->nombre !== 'Tutor') {

        return response()->json([
            'message' => 'No autorizado.'
        ], 403);

    }

    $solicitud = TutorRequest::findOrFail($id);

    if ($solicitud->tutor_id !== $user->id) {

        return response()->json([
            'message' => 'No autorizado.'
        ], 403);

    }

    DB::transaction(function () use ($solicitud, $user) {

        // 1. Aceptar la solicitud
        $solicitud->estado = 'Aceptada';
        $solicitud->save();

        // 2. Asignar el tutor al proyecto
        $proyecto = $solicitud->project;

        $proyecto->tutor_id = $user->id;

        $proyecto->save();

        // 3. Rechazar las demás solicitudes del mismo proyecto
        TutorRequest::where('project_id', $proyecto->id)
            ->where('id', '!=', $solicitud->id)
            ->where('estado', 'Pendiente')
            ->update([
                'estado' => 'Rechazada'
            ]);

    });

    return response()->json([
        'message' => 'Solicitud aceptada correctamente.'
    ]);

}

public function reject(Request $request, $id)
{
    $user = $request->user();

    // Solo un tutor puede rechazar
    if ($user->role->nombre !== 'Tutor') {

        return response()->json([
            'message' => 'No autorizado.'
        ], 403);

    }

    $solicitud = TutorRequest::findOrFail($id);

    // Solo puede rechazar sus propias solicitudes
    if ($solicitud->tutor_id !== $user->id) {

        return response()->json([
            'message' => 'No autorizado.'
        ], 403);

    }

    // Solo puede rechazarse si sigue pendiente
    if ($solicitud->estado !== 'Pendiente') {

        return response()->json([
            'message' => 'La solicitud ya fue procesada.'
        ], 400);

    }

    $solicitud->estado = 'Rechazada';

    $solicitud->save();

    return response()->json([
        'message' => 'Solicitud rechazada correctamente.'
    ]);
}
}
