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

    /**
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
}