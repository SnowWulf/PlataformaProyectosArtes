<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Services\ReviewModerationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    protected ReviewModerationService $moderationService;

    public function __construct(ReviewModerationService $moderationService)
    {
        $this->moderationService = $moderationService;
    }

    /**
     * Consulta pública de reseñas aprobadas para el Landing Page.
     */
    public function landingReviews(): JsonResponse
    {
        $reviews = Review::publicasLanding()
            ->with(['usuario' => function ($query) {
                // CORREGIDO: Se cambió 'name' por 'nombre'
                $query->select('id', 'name', 'foto', 'role_id')->with('role:id,nombre');
            }])
            ->latest()
            ->take(6)
            ->get()
            ->each(function ($review) {
                if ($review->usuario) {
                    $review->usuario->foto_perfil_url = $review->usuario->foto_url;
                }
            });

        return response()->json($reviews, 200);
    }

    /**
     * Listar todas las reseñas para el Panel del Coordinador.
     */
    public function indexCoordinador(Request $request): JsonResponse
    {
        $estado = $request->query('estado'); 
        
        $reviews = Review::with(['usuario' => function ($query) {
                // CORREGIDO: Se cambió 'name' por 'nombre'
                $query->select('id', 'name', 'email', 'foto', 'role_id')->with('role:id,nombre');
            }])
            ->when($estado, fn($query) => $query->where('estado', $estado))
            ->latest()
            ->paginate(15);

        // Mapeamos foto_url a foto_perfil_url para cada usuario paginado
        $reviews->getCollection()->each(function ($review) {
            if ($review->usuario) {
                $review->usuario->foto_perfil_url = $review->usuario->foto_url;
            }
        });

        return response()->json($reviews, 200);
    }

    /**
     * Guardar una nueva reseña (Estudiantes y Tutores) moderada con IA.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asunto' => 'required|string|min:5|max:150',
            'observaciones' => 'required|string|min:10|max:1000',
            'calificacion' => 'required|integer|min:1|max:5',
            'proyecto_contexto' => 'nullable|string|max:255',
        ]);

        $moderation = $this->moderationService->moderarResena(
            $validated['asunto'],
            $validated['observaciones']
        );

        $estado = $moderacion['aprobado'] ? 'aprobado' : 'rechazado';

        $review = Review::create([
            'user_id' => $request->user()->id,
            'asunto' => $validated['asunto'],
            'observaciones' => $validated['observaciones'],
            'calificacion' => $validated['calificacion'],
            'proyecto_contexto' => $validated['proyecto_contexto'] ?? null,
            'estado' => $estado,
            'motivo_rechazo_ia' => $moderacion['motivo'],
            'destacado_landing' => true,
        ]);

        $review->load(['usuario' => function ($query) {
            $query->select('id', 'name', 'email', 'foto', 'role_id')->with('role:id,nombre');
        }]);

        if ($review->usuario) {
            $review->usuario->foto_perfil_url = $review->usuario->foto_url;
        }

        if ($estado === 'rechazado') {
            return response()->json([
                'message' => 'El comentario no cumple con las políticas de la comunidad.',
                'motivo' => $moderacion['motivo'],
                'data' => $review
            ], 422);
        }

        return response()->json([
            'message' => '¡Gracias! Tu reseña ha sido aprobada y publicada.',
            'data' => $review
        ], 201);
    }

    /**
     * Cambiar estado o destacar/ocultar reseña desde el panel del Coordinador.
     */
    public function actualizarEstadoCoordinador(Request $request, Review $review): JsonResponse
    {
        $validated = $request->validate([
            'estado' => 'sometimes|in:pendiente,aprobado,rechazado',
            'destacado_landing' => 'sometimes|boolean',
            'motivo_rechazo_ia' => 'nullable|string',
        ]);

        $review->update($validated);

        return response()->json([
            'message' => 'Reseña actualizada correctamente.',
            'data' => $review
        ], 200);
    }

    public function destroyCoordinador(Review $review): JsonResponse
    {
        $review->delete();

        return response()->json([
            'message' => 'Reseña eliminada permanentemente.'
        ], 200);
    }
}