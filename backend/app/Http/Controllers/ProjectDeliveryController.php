<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ProjectDelivery;
use App\Helpers\ActivityLogger;
use App\Services\NotificationEngineService; // 1. Importamos el servicio

class ProjectDeliveryController extends Controller
{
    public function index(Request $request, Project $project)
    {
        $userId = $request->user()?->id;

        $deliveries = $project
            ->deliveries()
            ->with(['tutor', 'respuesta' => function ($query) use ($userId) {
                if ($userId) {
                    $query->where('student_id', $userId);
                }
            }])
            ->orderBy('fecha_limite')
            ->get();

        return response()->json($deliveries);
    }

    public function store(
        Request $request,
        Project $project,
        NotificationEngineService $notifier
    )
    {
        $user = $request->user();

        \Log::info([
            'usuario' => $user->id,
            'rol' => $user->role->nombre,
            'tutor_del_proyecto' => $project->tutor_id,
            'project_id' => $project->id
        ]);

        if (
            $project->tutor_id !== $user->id &&
            $user->role->nombre !== 'Coordinador'
        ) {
            return response()->json([
                'message' => 'No autorizado.'
            ], 403);
        }

        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'fecha_limite' => 'required|date',
            'obligatorio' => 'boolean'
        ]);

        $delivery = $project
            ->deliveries()
            ->create([
                ...$validated,
                'tutor_id' => $user->id
            ]);

        ActivityLogger::log(
            $project->id,
            $user->id,
            'delivery_created',
            $user->name . ' asignó la tarea "' . $delivery->titulo . '"',
            [
                'project_id' => $project->id,
                'project_name' => $project->titulo,
                'delivery_id' => $delivery->id,
                'delivery_title' => $delivery->titulo
            ]
        );

        // 3. Notificar a los miembros del proyecto (Líder + Colaboradores)
        $destinatariosIds = collect([$project->owner_id]);

        if (method_exists($project, 'collaborators')) {
            $collaboratorIds = $project->collaborators()->pluck('users.id');
            $destinatariosIds = $destinatariosIds->merge($collaboratorIds);
        }

        // Cargar los objetos de Usuario excluyendo al creador/tutor
        $estudiantes = \App\Models\User::whereIn('id', $destinatariosIds->unique())
            ->where('id', '!=', $user->id)
            ->get();

        // Mantenemos un registro de los chats de Telegram a los que YA notificamos en esta ejecución
        $chatsNotificados = [];

        foreach ($estudiantes as $estudiante) {
            // Si el servicio envía a Telegram internamente, evitamos disparar si el chat_id ya recibió el mensaje
            $chatId = $estudiante->telegram_chat_id;

            if ($chatId && in_array($chatId, $chatsNotificados)) {
                // Si el chat_id ya recibió la notificación (ej. el mismo Telegram vinculado a 2 cuentas de prueba),
                // notificamos solo en la plataforma web y omitimos el envío duplicado.
                // (Opcional: Si tu NotificationEngineService soporta parámetros para omitir telegram):
                continue; 
            }

            if ($chatId) {
                $chatsNotificados[] = $chatId;
            }

            $notifier->notify(
                user: $estudiante->id,
                tipoClave: 'nueva_entrega',
                titulo: '📌 Nueva Entrega Publicada',
                mensaje: $user->name . ' asignó la tarea: "' . $delivery->titulo . '" en el proyecto "' . $project->titulo . '".',
                link: '/dashboard/projects/' . $project->id
            );
        }

        return response()->json(
            $delivery,
            201
        );
    }

    public function update(
        Request $request,
        ProjectDelivery $delivery
    )
    {
        $user = $request->user();

        if (
            $delivery->tutor_id !== $user->id &&
            $user->role->nombre !== 'Coordinador'
        ) {
            return response()->json([
                'message' => 'No autorizado.'
            ], 403);
        }

        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'fecha_limite' => 'required|date',
            'obligatorio' => 'boolean',
            'estado' => 'in:abierta,cerrada'
        ]);

        $delivery->update($validated);

        ActivityLogger::log(
            $delivery->project_id,
            $user->id,
            'delivery_updated',
            $user->name . ' actualizó la entrega "' . $delivery->titulo . '"',
            [
                'delivery_id' => $delivery->id
            ]
        );

        return response()->json($delivery);
    }

    public function destroy(
        Request $request,
        ProjectDelivery $delivery
    )
    {
        $user = $request->user();

        if (
            $delivery->tutor_id !== $user->id &&
            $user->role->nombre !== 'Coordinador'
        ) {
            return response()->json([
                'message' => 'No autorizado.'
            ], 403);
        }

        $delivery->delete();

        ActivityLogger::log(
            $delivery->project_id,
            $user->id,
            'delivery_deleted',
            $user->name . ' eliminó la entrega "' . $delivery->titulo . '"',
            [
                'delivery_id' => $delivery->id
            ]
        );

        return response()->json([
            'message' => 'Entrega eliminada.'
        ]);
    }

    public function getAllDeliveries(Request $request)
    {
        $user = $request->user();

        return ProjectDelivery::whereHas('project', function ($query) use ($user) {

            $query->where('owner_id', $user->id)

                  ->orWhereHas('collaborators', function ($q) use ($user) {

                      $q->where('users.id', $user->id);

                  });

        })

        ->with('project')

        ->orderBy('fecha_limite')

        ->get();
    }
}