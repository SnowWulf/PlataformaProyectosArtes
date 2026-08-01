<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Project;
use App\Models\CollaborationRequest;
use App\Models\ProjectCollaborator;
use App\Helpers\ActivityLogger;


class CommunityController extends Controller
{
    public function users()
{
    return User::with('role:id,nombre')
        ->select(
            'id',
            'name',
            'programa',
            'role_id'
        )
        ->orderBy('name')
        ->get();
}

public function user($id)
{
    return User::with('role')
        ->findOrFail($id);
}

public function projects($id)
{
    $user = User::findOrFail($id);

    return $user->projects()
        ->select(
            'id',
            'titulo',
            'tipo_proyecto',
            'estado'
        )
        ->orderBy('titulo')
        ->get();
}

public function requestCollaboration(
    Request $request
)
{
    $request->validate([

        'project_id' =>
            'required|exists:projects,id',

        'requester_id' =>
            'required|exists:users,id'

    ]);

    /*
     * ¿Ya pertenece al proyecto?
     */

    $alreadyCollaborator =
        ProjectCollaborator::where(
            'project_id',
            $request->project_id
        )
        ->where(
            'user_id',
            $request->requester_id
        )
        ->exists();

    if ($alreadyCollaborator) {

        return response()->json([

            'message' =>
                'Ya perteneces a este proyecto.'

        ], 400);

    }

    /*
     * ¿Existe una solicitud pendiente?
     */

    $pendingRequest =
        CollaborationRequest::where(
            'project_id',
            $request->project_id
        )
        ->where(
            'requester_id',
            $request->requester_id
        )
        ->where(
            'estado',
            'Pendiente'
        )
        ->first();

    if ($pendingRequest) {

        return response()->json([

            'message' =>
                'Ya tienes una solicitud pendiente para este proyecto.'

        ], 400);

    }

    /*
     * ¿Existe una solicitud rechazada?
     */

    $rejectedRequest =
        CollaborationRequest::where(
            'project_id',
            $request->project_id
        )
        ->where(
            'requester_id',
            $request->requester_id
        )
        ->where(
            'estado',
            'Rechazada'
        )
        ->first();

    if ($rejectedRequest) {

        $rejectedRequest->estado =
            'Pendiente';

        $rejectedRequest->save();

        return response()->json([

            'message' =>
                'Solicitud reenviada correctamente.',

            'request' =>
                $rejectedRequest

        ]);

    }

    /*
     * Crear nueva solicitud
     */

    $newRequest =
        CollaborationRequest::create([

            'project_id' =>
                $request->project_id,

            'requester_id' =>
                $request->requester_id,

            'estado' =>
                'Pendiente'

        ]);

    return response()->json([

        'message' =>
            'Solicitud enviada correctamente.',

        'request' =>
            $newRequest

    ]);
}
public function receivedRequests($userId)
{
    return CollaborationRequest::with([

        'project',

        'requester'

    ])
    ->whereHas(
        'project',
        function ($query) use ($userId) {

            $query->where(
                'owner_id',
                $userId
            );

        }
    )
    ->get();
}
public function sentRequests($userId)
{
    return CollaborationRequest::with([

        'project'

    ])
    ->where(
        'requester_id',
        $userId
    )
    ->get();
}
public function acceptRequest(
    $id
)
{
    $request =
        CollaborationRequest::findOrFail($id);

    $request->estado =
        'Aceptada';

    $request->save();

    $exists =
        ProjectCollaborator::where(

            'project_id',
            $request->project_id

        )
        ->where(

            'user_id',
            $request->requester_id

        )
        ->exists();

    if (! $exists) {

        ProjectCollaborator::create([

            'project_id' =>
                $request->project_id,

            'user_id' =>
                $request->requester_id

        ]);

    }

    ActivityLogger::log(

    $request->project_id,

    auth()->id(),

    'collaborator_added',

    $request->requester->name .
    ' fue agregado como colaborador',

    [

        'user_id' =>
            $request->requester_id

    ]

);

    return response()->json([

        'message' =>
            'Solicitud aceptada.'

    ]);
}

public function rejectRequest($id)
{
    $request =
        CollaborationRequest::findOrFail($id);

    $request->estado =
        'Rechazada';

    $request->save();

    return response()->json([
        'message' =>
            'Solicitud rechazada.'
    ]);
}
}