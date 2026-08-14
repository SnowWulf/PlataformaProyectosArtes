<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ProjectMessage;
use App\Services\NotificationEngineService; // 1. Importamos el servicio
use Illuminate\Support\Str;

class ProjectMessageController extends Controller
{
    public function index(
        $projectId
    )
    {
        return ProjectMessage::with(

            'user'

        )
        ->where(
            'project_id',
            $projectId
        )
        ->orderBy(
            'created_at'
        )
        ->get();
    }

    public function store(
        Request $request,
        $projectId,
        NotificationEngineService $notifier // 2. Inyectamos el servicio
    )
    {
        $sender = $request->user();

        $request->validate([

            'mensaje' =>
                'required|string|max:1000'

        ]);

        $message =
            ProjectMessage::create([

                'project_id' =>
                    $projectId,

                'user_id' =>
                    $sender->id,

                'mensaje' =>
                    $request
                        ->mensaje

            ]);

        $project = Project::find($projectId);

        if ($project) {
            // Construir la lista de participantes del proyecto
            $participantesIds = collect([$project->owner_id]);

            if ($project->tutor_id) {
                $participantesIds->push($project->tutor_id);
            }

            if (method_exists($project, 'collaborators')) {
                $collaboratorIds = $project->collaborators()->pluck('users.id');
                $participantesIds = $participantesIds->merge($collaboratorIds);
            }

            // Excluir al emisor del mensaje
            $destinatarios = $participantesIds->unique()->filter(fn($id) => $id !== $sender->id);

            foreach ($destinatarios as $destinatarioId) {
                $notifier->notify(
                    user: $destinatarioId,
                    tipoClave: 'mensajes_proyecto',
                    titulo: '💬 Nuevo mensaje en "' . $project->titulo . '"',
                    mensaje: $sender->name . ': ' . Str::limit($message->mensaje, 50),
                    link: '/dashboard/projects/' . $project->id
                );
            }
        }

        return $message->load(
            'user'
        );
    }
}