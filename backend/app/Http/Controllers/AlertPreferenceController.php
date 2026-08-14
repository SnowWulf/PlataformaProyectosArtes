<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\UserAlertPreference;

class AlertPreferenceController extends Controller
{
    /**
     * Obtiene la configuración de alertas del usuario autenticado.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        // Busca la configuración o crea una con los valores por defecto
        $preference = $user->alertPreferences()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'global_enabled' => true,
                'preferences' => UserAlertPreference::defaultPreferences()
            ]
        );

        return response()->json([
            'globalEnabled' => $preference->global_enabled,
            'preferences' => $preference->preferences
        ]);
    }

    /**
     * Actualiza la configuración de alertas del usuario autenticado.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'globalEnabled' => 'required|boolean',
            'preferences' => 'required|array',
            'preferences.documento_revisado'     => 'boolean',
            'preferences.respuesta_tutoria'      => 'boolean',
            'preferences.nueva_entrega'          => 'boolean',
            'preferences.mensajes_proyecto'      => 'boolean',
            'preferences.proyecto_por_finalizar' => 'boolean',
        ]);

        $user = $request->user();

        $preference = $user->alertPreferences()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'global_enabled' => $validated['globalEnabled'],
                'preferences' => $validated['preferences']
            ]
        );

        return response()->json([
            'message' => 'Preferencias actualizadas correctamente',
            'data' => [
                'globalEnabled' => $preference->global_enabled,
                'preferences' => $preference->preferences
            ]
        ]);
    }
}