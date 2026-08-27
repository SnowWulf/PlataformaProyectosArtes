<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Project;
use App\Models\CollaborationRequest;
use App\Models\ProjectCollaborator;
use App\Helpers\ActivityLogger;
use App\Services\NotificationEngineService;

class CommunityController extends Controller
{
    public function users(Request $request)
    {
        return User::with(['role:id,nombre', 'projects' => function ($query) {
            // Filtrar proyectos visibles en caso de incluir relación
            $query->where('es_visible', true);
        }])
        ->select('id', 'name', 'programa', 'role_id', 'foto', 'mostrar_proyectos')
        ->where('id', '!=', $request->user()->id)
        ->orderBy('name')
        ->get();
    }

    public function user($id)
    {
        $user = User::with('role')->findOrFail($id);
        $viewer = auth()->user();

        $isOwner = $viewer && $viewer->id === $user->id;
        $isCoordinator = $viewer && $viewer->role && $viewer->role->nombre === 'Coordinador';

        if (!$isOwner && !$isCoordinator && !$user->mostrar_correo) {
            $user->email = null;
        }

        return response()->json($user);
    }

    public function projects($id)
    {
        $profileUser = User::findOrFail($id);
        $viewer = auth()->user();

        $isOwner = $viewer && $viewer->id === $profileUser->id;
        $isCoordinator = $viewer && $viewer->role && $viewer->role->nombre === 'Coordinador';

        // 1. Si NO es dueño/coordinador y el usuario apagó "mostrar_proyectos", retorna arreglo vacío
        if (!$isOwner && !$isCoordinator && !$profileUser->mostrar_proyectos) {
            return response()->json([]);
        }

        $query = $profileUser->projects()
            ->select('id', 'titulo', 'tipo_proyecto', 'estado', 'es_visible', 'owner_id')
            ->orderBy('titulo');

        // 2. Si NO es el dueño ni coordinador, filtrar ÚNICAMENTE proyectos activos e individuales como visibles
        if (!$isOwner && !$isCoordinator) {
            $query->where('es_visible', true);
        }

        return $query->get();
    }

    public function requestCollaboration(Request $request, NotificationEngineService $notifier)
    {
        $project = Project::findOrFail($request->project_id);

        if ($project->owner_id === $request->requester_id) {
            return response()->json([
                'message' => 'No puedes solicitar colaboración en tu propio proyecto.'
            ], 422);
        }

        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'requester_id' => 'required|exists:users,id'
        ]);

        $alreadyCollaborator = ProjectCollaborator::where('project_id', $request->project_id)
            ->where('user_id', $request->requester_id)
            ->exists();

        if ($alreadyCollaborator) {
            return response()->json([
                'message' => 'Ya perteneces a este proyecto.'
            ], 400);
        }

        $pendingRequest = CollaborationRequest::where('project_id', $request->project_id)
            ->where('requester_id', $request->requester_id)
            ->where('estado', 'Pendiente')
            ->first();

        if ($pendingRequest) {
            return response()->json([
                'message' => 'Ya tienes una solicitud pendiente para este proyecto.'
            ], 400);
        }

        $userRequester = User::find($request->requester_id);

        $rejectedRequest = CollaborationRequest::where('project_id', $request->project_id)
            ->where('requester_id', $request->requester_id)
            ->where('estado', 'Rechazada')
            ->first();

        if ($rejectedRequest) {
            $rejectedRequest->estado = 'Pendiente';
            $rejectedRequest->save();

            // Notificar al DUEÑO del proyecto sobre la resolicitud
            $notifier->notify(
                user: $project->owner_id,
                tipoClave: 'invitacion_proyecto',
                titulo: '📩 Solicitud de Colaboración Reenviada',
                mensaje: "El usuario {$userRequester->name} ha reenviado su solicitud para colaborar en '{$project->titulo}'.",
                link: '/dashboard/projects/' . $project->id
            );

            return response()->json([
                'message' => 'Solicitud reenviada correctamente.',
                'request' => $rejectedRequest
            ]);
        }

        $newRequest = CollaborationRequest::create([
            'project_id' => $request->project_id,
            'requester_id' => $request->requester_id,
            'estado' => 'Pendiente',
            'tipo' => 'request'
        ]);

        // Notificar al DUEÑO del proyecto que recibió una solicitud
        $notifier->notify(
            user: $project->owner_id,
            tipoClave: 'invitacion_proyecto',
            titulo: '📩 Nueva Solicitud de Colaboración',
            mensaje: "El usuario {$userRequester->name} desea colaborar en tu proyecto '{$project->titulo}'.",
            link: '/dashboard/projects/' . $project->id
        );

        return response()->json([
            'message' => 'Solicitud enviada correctamente.',
            'request' => $newRequest
        ]);
    }

    public function receivedRequests($userId)
    {
        return CollaborationRequest::with(['project', 'requester', 'receiver'])
            ->where(function ($query) use ($userId) {
                $query->where(function ($q) use ($userId) {
                    $q->where('tipo', 'request')
                      ->whereHas('project', function ($p) use ($userId) {
                          $p->where('owner_id', $userId);
                      });
                })->orWhere(function ($q) use ($userId) {
                    $q->where('tipo', 'invite')
                      ->where('receiver_id', $userId);
                });
            })
            ->get();
    }

    public function sentRequests($userId)
    {
        return CollaborationRequest::with(['project', 'requester', 'receiver'])
            ->where('requester_id', $userId)
            ->get();
    }

    public function acceptRequest($id, NotificationEngineService $notifier)
    {
        $collaborationRequest = CollaborationRequest::with(['project', 'requester', 'receiver'])->findOrFail($id);

        $collaborationRequest->estado = 'Aceptada';
        $collaborationRequest->save();

        $userToAdd = $collaborationRequest->tipo === 'invite'
            ? $collaborationRequest->receiver_id
            : $collaborationRequest->requester_id;

        $exists = ProjectCollaborator::where('project_id', $collaborationRequest->project_id)
            ->where('user_id', $userToAdd)
            ->exists();

        if (!$exists) {
            ProjectCollaborator::create([
                'project_id' => $collaborationRequest->project_id,
                'user_id' => $userToAdd
            ]);
        }

        $usuario = $collaborationRequest->tipo === 'invite'
            ? $collaborationRequest->receiver
            : $collaborationRequest->requester;

        ActivityLogger::log(
            $collaborationRequest->project_id,
            auth()->id(),
            'collaborator_added',
            $usuario->name . ' fue agregado como colaborador',
            ['user_id' => $usuario->id]
        );

        $destinatarioId = $collaborationRequest->tipo === 'invite'
            ? $collaborationRequest->project->owner_id
            : $collaborationRequest->requester_id;

        $userQueAcepto = auth()->user();

        $notifier->notify(
            user: $destinatarioId,
            tipoClave: 'invitacion_proyecto',
            titulo: '✅ Solicitud de Colaboración Aceptada',
            mensaje: "{$userQueAcepto->name} aceptó la colaboración para el proyecto '{$collaborationRequest->project->titulo}'.",
            link: '/dashboard/projects/' . $collaborationRequest->project_id
        );

        return response()->json([
            'message' => 'Solicitud aceptada.'
        ]);
    }

    public function rejectRequest($id, NotificationEngineService $notifier)
    {
        $request = CollaborationRequest::with(['project', 'requester', 'receiver'])->findOrFail($id);

        $request->estado = 'Rechazada';
        $request->save();

        $destinatarioId = $request->tipo === 'invite'
            ? $request->project->owner_id
            : $request->requester_id;

        $userQueRechazo = auth()->user();

        $notifier->notify(
            user: $destinatarioId,
            tipoClave: 'invitacion_proyecto',
            titulo: '❌ Solicitud de Colaboración Rechazada',
            mensaje: "{$userQueRechazo->name} ha declinado la colaboración en el proyecto '{$request->project->titulo}'.",
            link: '/dashboard/projects/' . $request->project_id
        );

        return response()->json([
            'message' => 'Solicitud rechazada.'
        ]);
    }

    public function inviteToProject(Request $request, NotificationEngineService $notifier)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'receiver_id' => 'required|exists:users,id'
        ]);

        $project = Project::findOrFail($validated['project_id']);

        if ($project->owner_id !== auth()->id()) {
            return response()->json([
                'message' => 'No autorizado.'
            ], 403);
        }

        if ($validated['receiver_id'] == auth()->id()) {
            return response()->json([
                'message' => 'No puedes invitarte a ti mismo.'
            ], 422);
        }

        if ($project->collaborators()->where('users.id', $validated['receiver_id'])->exists()) {
            return response()->json([
                'message' => 'El usuario ya pertenece al proyecto.'
            ], 422);
        }

        $pendiente = CollaborationRequest::where('project_id', $project->id)
            ->where('receiver_id', $validated['receiver_id'])
            ->where('estado', 'Pendiente')
            ->where('tipo', 'invite')
            ->exists();

        if ($pendiente) {
            return response()->json([
                'message' => 'Ya existe una invitación pendiente.'
            ], 422);
        }

        $invitacion = CollaborationRequest::create([
            'project_id' => $project->id,
            'requester_id' => auth()->id(),
            'receiver_id' => $validated['receiver_id'],
            'estado' => 'Pendiente',
            'tipo' => 'invite'
        ]);

        ActivityLogger::log(
            $project->id,
            auth()->id(),
            'invite_sent',
            'Invitación enviada a colaborar.',
            ['receiver_id' => $validated['receiver_id']]
        );

        $sender = auth()->user();

        $notifier->notify(
            user: $validated['receiver_id'],
            tipoClave: 'invitacion_proyecto',
            titulo: '👥 Invitación a Colaborar',
            mensaje: "El usuario {$sender->name} te ha invitado a colaborar en su proyecto '{$project->titulo}'.",
            link: '/dashboard/projects/' . $project->id
        );

        return response()->json([
            'message' => 'Invitación enviada correctamente.',
            'invitation' => $invitacion
        ]);
    }
}