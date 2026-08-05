<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ProjectDelivery;
use App\Helpers\ActivityLogger;

class ProjectDeliveryController extends Controller
{
    public function index(Project $project)
    {
        return response()->json(

            $project
                ->deliveries()
                ->with('tutor')
                ->orderBy('fecha_limite')
                ->get()

        );
    }

    public function store(
        Request $request,
        Project $project
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
        $user->name .
        ' creó la entrega "' .
        $delivery->titulo .
        '"',
        [
            'delivery_id' => $delivery->id
        ]
    );

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

    $user->name .
    ' actualizó la entrega "' .
    $delivery->titulo .
    '"',

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

    $user->name .
    ' eliminó la entrega "' .
    $delivery->titulo .
    '"',

    [

        'delivery_id' => $delivery->id

    ]

);

        return response()->json([

            'message' => 'Entrega eliminada.'

        ]);
    }
}