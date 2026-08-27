<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Notification;

class NotificationController extends Controller
{
    /**
     * Obtiene las notificaciones del usuario autenticado (ordenadas por más recientes).
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->orderBy('created_at', 'desc')
            ->take(20) // Retorna las últimas 20 notificaciones
            ->get();

        $unreadCount = $request->user()
            ->notifications()
            ->where('is_read', false)
            ->count();

        return response()->json([
            'unreadCount' => $unreadCount,
            'data' => $notifications
        ]);
    }

    /**
     * Marca una notificación específica como leída.
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        return response()->json([
            'message' => 'Notificación marcada como leída'
        ]);
    }

    /**fs
     * Marca TODAS las notificaciones del usuario como leídas.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()
            ->notifications()
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'message' => 'Todas las notificaciones fueron marcadas como leídas'
        ]);
    }


    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'title'   => 'required|string|max:255',
            'message' => 'required|string',
            'type'    => 'nullable|string',
            'link'    => 'nullable|string',
        ]);

        $notification = Notification::create([
            'user_id' => $validated['user_id'],
            'title'   => $validated['title'],
            'message' => $validated['message'],
            'type'    => $validated['type'] ?? 'RECORDATORIO',
            'link'    => $validated['link'] ?? null,
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Notificación creada con éxito',
            'data'    => $notification
        ], 201);
    }
}