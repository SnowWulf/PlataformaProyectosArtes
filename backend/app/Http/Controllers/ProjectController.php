<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ActivityLog;
use App\Models\User;
use App\Helpers\ActivityLogger;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Coordinador
        if ($user->role->nombre === 'Coordinador') {
            return Project::with(['owner', 'tutor', 'collaborators'])->get();
        }

        // Tutor
        if ($user->role->nombre === 'Tutor') {
            return Project::with(['owner', 'tutor', 'collaborators'])
                ->where('owner_id', $user->id)
                ->orWhere('tutor_id', $user->id)
                ->get();
        }

        // Estudiante
        return Project::with([

    'owner',

    'tutor',

    'collaborators'

])

->where(
    'owner_id',
    $user->id
)

->orWhereHas(

    'collaborators',

    function ($query) use ($user) {

        $query->where(
            'users.id',
            $user->id
        );

    }

)

->get();
    }

    public function show(Request $request, $id)
    {
        $project = Project::with(['owner', 'tutor', 'collaborators'])->findOrFail($id);

        $user = $request->user();

        // Coordinador
        if ($user->role->nombre === 'Coordinador') {
            return response()->json($project);
        }

        // Tutor
        if (
            $user->role->nombre === 'Tutor' &&
            $project->tutor_id === $user->id
        ) {
            return response()->json($project);
        }

        // Propietario
        if ($project->owner_id === $user->id) {
            return response()->json($project);
        }
        $esColaborador =

    $project->collaborators()

        ->where(
            'users.id',
            $user->id
        )

        ->exists();

if ($esColaborador) {

    return response()->json(
        $project
    );

}

        return response()->json([
            'message' => 'No autorizado.'
        ], 403);
    }

    public function store(Request $request)
    {
        $project = Project::create([

            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'tipo_proyecto' => $request->tipo_proyecto,
            'estado' => 'Pendiente',
            'fecha_inicio' => now(),

            // Siempre será el usuario autenticado
            'owner_id' => $request->user()->id,

            // Se podrá asignar desde Coordinador
            'tutor_id' => $request->tutor_id
        ]);

        return response()->json($project, 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $user = $request->user();

        if (
            $user->role->nombre === 'Coordinador' ||
            (
                $user->role->nombre === 'Tutor' &&
                $project->tutor_id === $user->id
            ) ||
            $project->owner_id === $user->id
        ) {

            $project->update([

                'titulo' => $request->titulo,
                'descripcion' => $request->descripcion,
                'tipo_proyecto' => $request->tipo_proyecto,
                'estado' => $request->estado

            ]);

            return response()->json($project);
        }

        return response()->json([
            'message' => 'No autorizado.'
        ], 403);
    }

    public function destroy(Request $request, $id)
{
    $project = Project::findOrFail($id);

    $user = $request->user();


    if (
        $user->role->nombre !== 'Coordinador'
        &&
        $project->owner_id !== $user->id
    ) {

        return response()->json([
            'message' => 'No autorizado.'
        ], 403);

    }

    $project->delete();

    return response()->json([
        'message' => 'Proyecto eliminado correctamente.'
    ]);
}

    public function documents(Project $project)
    {
    return response()->json(
        $project->documents()
            ->with('user')
            ->latest()
            ->get()
    );
    }

    public function removeCollaborator(
    Request $request,
    $projectId,
    $userId
)
{   
        $collaborator = User::find($userId);
    $project =
        Project::findOrFail(
            $projectId
        );

    $user =
        $request->user();

    if (

        $project->owner_id !==
        $user->id

        &&

        $user->role->nombre !==
        'Coordinador'

    ) {

        return response()->json([

            'message' =>
                'No autorizado.'

        ], 403);

    }
    ActivityLogger::log(

    $project->id,

    auth()->id(),

    'collaborator_removed',

    auth()->user()->name .
    ' eliminó a ' .
    ($collaborator?->name ?? 'Usuario') .
    ' como colaborador',

    [

        'removed_user_id' =>
            $userId

    ]

);

    $project->collaborators()
        ->detach($userId);



    return response()->json([

        'message' =>
            'Colaborador eliminado.'

    ]);
}


public function activity(
    Project $project
)
{
    return response()->json(

        $project
            ->activityLogs()
            ->with('user')
            ->latest()
            ->take(100)
            ->get()

    );
}

public function studentActivity(
    Request $request
)
{
    $user = $request->user();

    $activities = ActivityLog::whereHas(
        'project',
        function ($query) use ($user) {

            $query->where(
                'owner_id',
                $user->id
            )

            ->orWhereHas(
                'collaborators',
                function ($q) use ($user) {

                    $q->where(
                        'users.id',
                        $user->id
                    );

                }
            );

        }
    )
    ->latest()
    ->take(50)
    ->get();

    return response()->json(
        $activities
    );
}

}
