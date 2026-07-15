<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Coordinador
        if ($user->role->nombre === 'Coordinador') {
            return Project::with(['owner', 'tutor'])->get();
        }

        // Tutor
        if ($user->role->nombre === 'Tutor') {
            return Project::with(['owner', 'tutor'])
                ->where('owner_id', $user->id)
                ->orWhere('tutor_id', $user->id)
                ->get();
        }

        // Estudiante
        return Project::with(['owner', 'tutor'])
            ->where('owner_id', $user->id)
            ->get();
    }

    public function show(Request $request, $id)
    {
        $project = Project::with(['owner', 'tutor'])->findOrFail($id);

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
                'tipo_proyecto' => $request->tipo_proyecto

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

        if ($user->role->nombre !== 'Coordinador') {

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
}
