<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TutorRequest;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use App\Helpers\ActivityLogger;
use App\Services\NotificationEngineService; // 1. Importamos el servicio

class TutorRequestController extends Controller
{
    public function store(Request $request, NotificationEngineService $notifier)
    {
        $user = $request->user();

        if ($user->role->nombre !== 'Estudiante') {

            return response()->json([
                'message' => 'Solo los estudiantes pueden solicitar tutor.'
            ], 403);

        }

        $request->validate([

            'project_id' => 'required|exists:projects,id',

            'tutor_id' => 'required|exists:users,id',

            'mensaje' => 'nullable|string|max:1000'

        ]);

        $project = Project::findOrFail(
            $request->project_id
        );

        if ($project->owner_id !== $user->id) {

            return response()->json([
                'message' => 'No puede solicitar tutor para un proyecto que no es suyo.'
            ], 403);

        }

        if ($project->tutor_id) {

            return response()->json([
                'message' => 'Este proyecto ya tiene un tutor asignado.'
            ], 400);

        }

        if ($project->tutor_id == $request->tutor_id) {

            return response()->json([
                'message' => 'Ese tutor ya está asignado al proyecto.'
            ], 400);

        }

        $exists = TutorRequest::where(
            'project_id',
            $project->id
        )
        ->where(
            'tutor_id',
            $request->tutor_id
        )
        ->where(
            'estado',
            'Pendiente'
        )
        ->exists();

        if ($exists) {

            return response()->json([
                'message' => 'Ya existe una solicitud pendiente para este tutor.'
            ], 422);

        }

        $solicitud = TutorRequest::create([

            'project_id' => $project->id,

            'student_id' => $user->id,

            'tutor_id' => $request->tutor_id,

            'mensaje' => $request->mensaje,

            'estado' => 'Pendiente'

        ]);

        ActivityLogger::log(

            $project->id,

            $user->id,

            'tutor_request_sent',

            'Solicitud de tutoría enviada.',

            [

                'tutor_id' => $request->tutor_id

            ]

        );

        // 2. Notificar al Tutor que recibió una nueva solicitud
        $notifier->notify(
            user: $request->tutor_id,
            tipoClave: 'respuesta_tutoria',
            titulo: '📩 Nueva Solicitud de Tutoría',
            mensaje: "El estudiante {$user->name} te ha enviado una solicitud para el proyecto '{$project->titulo}'.",
            link: '/dashboard/tutorships'
        );

        return response()->json(

            $solicitud,

            201

        );
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

    public function accept(Request $request, $id, NotificationEngineService $notifier)
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

            ActivityLogger::log(

                $proyecto->id,

                $user->id,

                'tutor_assigned',

                $user->name . ' fue asignado como tutor',

                []

            );

            // 3. Rechazar las demás solicitudes del mismo proyecto
            TutorRequest::where('project_id', $proyecto->id)
                ->where('id', '!=', $solicitud->id)
                ->where('estado', 'Pendiente')
                ->update([
                    'estado' => 'Rechazada'
                ]);

        });

        // 3. Notificar al estudiante que su solicitud fue aceptada
        $notifier->notify(
            user: $solicitud->student_id,
            tipoClave: 'respuesta_tutoria',
            titulo: '✅ Solicitud de Tutoría Aceptada',
            mensaje: "El tutor {$user->name} ha aceptado ser el tutor de tu proyecto.",
            link: '/dashboard/projects/' . $solicitud->project_id
        );

        return response()->json([
            'message' => 'Solicitud aceptada correctamente.'
        ]);

    }

    public function reject(Request $request, $id, NotificationEngineService $notifier)
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

        // 4. Notificar al estudiante que su solicitud fue rechazada
        $notifier->notify(
            user: $solicitud->student_id,
            tipoClave: 'respuesta_tutoria',
            titulo: '❌ Solicitud de Tutoría Rechazada',
            mensaje: "El tutor {$user->name} ha declinado la solicitud de tutoría.",
            link: '/dashboard/projects/' . $solicitud->project_id
        );

        return response()->json([
            'message' => 'Solicitud rechazada correctamente.'
        ]);
    }
}