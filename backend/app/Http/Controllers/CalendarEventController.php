<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use Illuminate\Http\Request;

class CalendarEventController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()
            ->calendarEvents()
            ->orderBy('fecha_inicio')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([

            'titulo' => 'required|string|max:255',

            'descripcion' => 'nullable|string',

            'fecha_inicio' => 'required|date',

            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',

            'tipo' => 'required|in:personal,academico,reunion,otro',

            'color' => 'required|string|max:20',

            'recordatorio' => 'boolean'

        ]);

        $evento = $request->user()
            ->calendarEvents()
            ->create($validated);

        return response()->json(
            $evento,
            201
        );
    }

    public function update(
        Request $request,
        CalendarEvent $calendarEvent
    )
    {
        if (
            $calendarEvent->user_id !==
            $request->user()->id
        ) {

            return response()->json([
                'message' => 'No autorizado.'
            ], 403);

        }

        $validated = $request->validate([

            'titulo' => 'required|string|max:255',

            'descripcion' => 'nullable|string',

            'fecha_inicio' => 'required|date',

            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',

            'tipo' => 'required|in:personal,academico,reunion,otro',

            'color' => 'required|string|max:20',

            'recordatorio' => 'boolean'

        ]);

        $calendarEvent->update($validated);

        return response()->json(
            $calendarEvent
        );
    }

    public function destroy(
        Request $request,
        CalendarEvent $calendarEvent
    )
    {
        if (
            $calendarEvent->user_id !==
            $request->user()->id
        ) {

            return response()->json([
                'message' => 'No autorizado.'
            ], 403);

        }

        $calendarEvent->delete();

        return response()->json([
            'message' => 'Evento eliminado.'
        ]);
    }
}