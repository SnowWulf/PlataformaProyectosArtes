<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ActivityLog;
use App\Models\User;
use App\Models\ProjectDelivery; // 👈 Importación agregada
use App\Models\CalendarEvent;   // 👈 Importación agregada
use App\Helpers\ActivityLogger;
use Carbon\Carbon;


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
        ->where('owner_id', $user->id)
        ->orWhereHas('collaborators', function ($query) use ($user) {
            $query->where('users.id', $user->id);
        })
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

        $esColaborador = $project->collaborators()
            ->where('users.id', $user->id)
            ->exists();

        if ($esColaborador) {
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
            $user->role->nombre !== 'Coordinador' &&
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

    public function removeCollaborator(Request $request, $projectId, $userId)
    {   
        $collaborator = User::find($userId);
        $project = Project::findOrFail($projectId);
        $user = $request->user();

        if (
            $project->owner_id !== $user->id &&
            $user->role->nombre !== 'Coordinador'
        ) {
            return response()->json([
                'message' => 'No autorizado.'
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
                'removed_user_id' => $userId
            ]
        );

        $project->collaborators()->detach($userId);

        return response()->json([
            'message' => 'Colaborador eliminado.'
        ]);
    }

    public function activity(Project $project)
    {
        $activities = $project
            ->activityLogs()
            ->with(['user', 'project'])
            ->latest()
            ->take(100)
            ->get();

        $activities->each(function ($activity) {
            $activity->project_name = $activity->project?->titulo;
        });

        return response()->json($activities);
    }

    public function studentActivity(Request $request)
    {
        $user = $request->user();

        $projectIds = Project::where('owner_id', $user->id)->pluck('id');

        return ActivityLog::whereIn('project_id', $projectIds)
            ->latest()
            ->take(50)
            ->get();
    }

    public function getActiveDeadlineAlerts(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['banner_projects' => [], 'critical_projects' => []]);
            }

            $userId = $user->id;
            $today = Carbon::today();

            $warningBannerProjects = [];
            $criticalModalProjects = [];

            // 1. Obtener IDs de proyectos del usuario (Propietario o Colaborador)
            $userProjectIds = Project::where('owner_id', $userId)
                ->orWhereHas('collaborators', function ($query) use ($userId) {
                    $query->where('users.id', $userId);
                })
                ->pluck('id');

            // 2. CONSULTA ENTREGAS (project_deliveries) FILTRADAS
            $deliveriesQuery = ProjectDelivery::query();
            
            // Si la tabla tiene 'project_id', filtramos por sus proyectos
            if (\Illuminate\Support\Facades\Schema::hasColumn('project_deliveries', 'project_id')) {
                $deliveriesQuery->whereIn('project_id', $userProjectIds);
            } elseif (\Illuminate\Support\Facades\Schema::hasColumn('project_deliveries', 'user_id')) {
                $deliveriesQuery->where('user_id', $userId);
            }

            $deliveries = $deliveriesQuery->get();

            foreach ($deliveries as $delivery) {
                $fechaRaw = $delivery->fecha_entrega 
                         ?? $delivery->fecha_limite 
                         ?? $delivery->fecha_fin 
                         ?? $delivery->deadline 
                         ?? null;

                if (!$fechaRaw) continue;

                $fechaFin = Carbon::parse($fechaRaw)->startOfDay();
                $diasRestantes = $today->diffInDays($fechaFin, false);

                if ($diasRestantes < 0) continue; // Ignorar pasadas

                $item = [
                    'id' => $delivery->project_id ?? $delivery->id,
                    'titulo' => 'Entrega: ' . ($delivery->titulo ?? $delivery->nombre ?? 'Sin título'),
                    'fecha_fin' => $fechaFin->format('Y-m-d'),
                    'dias_restantes' => (int) $diasRestantes,
                ];

                if ($diasRestantes <= 1) {
                    $criticalModalProjects[] = $item;
                } elseif ($diasRestantes <= 3) {
                    $warningBannerProjects[] = $item;
                }
            }

            // 3. CONSULTA CALENDARIO (calendar_events) FILTRADO
            $eventsQuery = CalendarEvent::query();

            // Detectar automáticamente qué columna existe en calendar_events
            $eventsQuery->where(function ($q) use ($userId, $userProjectIds) {
                $hasFilter = false;

                if (\Illuminate\Support\Facades\Schema::hasColumn('calendar_events', 'user_id')) {
                    $q->orWhere('user_id', $userId);
                    $hasFilter = true;
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('calendar_events', 'created_by')) {
                    $q->orWhere('created_by', $userId);
                    $hasFilter = true;
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('calendar_events', 'project_id')) {
                    $q->orWhereIn('project_id', $userProjectIds);
                    $hasFilter = true;
                }

                // Si no existe ninguna de las columnas anteriores, trae solo si no se encuentra relación
                if (!$hasFilter) {
                    $q->whereRaw('1 = 1');
                }
            });

            $events = $eventsQuery->get();

            foreach ($events as $event) {
                $fechaRaw = $event->end_date 
                         ?? $event->start_date 
                         ?? $event->fecha_fin 
                         ?? $event->fecha 
                         ?? null;

                if (!$fechaRaw) continue;

                $fechaFin = Carbon::parse($fechaRaw)->startOfDay();
                $diasRestantes = $today->diffInDays($fechaFin, false);

                if ($diasRestantes < 0) continue;

                $item = [
                    'id' => $event->id,
                    'titulo' => 'Calendario: ' . ($event->title ?? $event->titulo ?? $event->nombre ?? 'Evento'),
                    'fecha_fin' => $fechaFin->format('Y-m-d'),
                    'dias_restantes' => (int) $diasRestantes,
                ];

                if ($diasRestantes <= 1) {
                    $criticalModalProjects[] = $item;
                } elseif ($diasRestantes <= 3) {
                    $warningBannerProjects[] = $item;
                }
            }

            return response()->json([
                'banner_projects' => $warningBannerProjects,
                'critical_projects' => $criticalModalProjects,
            ]);

        } catch (\Exception $e) {
            // Retornar detalle del error en desarrollo
            return response()->json([
                'error' => 'Error SQL o de ejecución: ' . $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}