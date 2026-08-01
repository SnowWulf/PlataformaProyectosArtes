<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Helpers\ActivityLogger;

class DocumentController extends Controller
{
    public function index()
    {
        return response()->json(
            Document::with(['project', 'user'])->get()
        );
    }

    public function show(Document $document)
    {
        return response()->json(
            $document->load(['project', 'user'])
        );
    }

    public function store(Request $request)
    {
    $validated = $request->validate([
        'project_id' => 'required|exists:projects,id',
        'nombre' => 'required|string|max:255',
        'descripcion' => 'nullable|string',
        'archivo' => 'required|file|mimes:pdf|max:10240',
    ]);

    $path = $request->file('archivo')->store(
        'documents',
        'public'
    );

    $document = Document::create([
        'project_id' => $validated['project_id'],
        'user_id' => auth()->id(),
        'nombre' => $validated['nombre'],
        'descripcion' => $validated['descripcion'] ?? null,
        'file_path' => $path,
        'estado' => 'submitted',
    ]);

ActivityLogger::log(

    $document->project_id,

    auth()->id(),

    'document_created',

    auth()->user()->name .
    ' subió el avance "' .
    $document->nombre .
    '"',

    [

        'document_id' =>
            $document->id,

        'documento' =>
            $document->nombre

    ]

);

    return response()->json([
        'message' => 'Documento creado correctamente',
        'document' => $document
    ], 201);

    }


    public function update(
    Request $request,
    Document $document
)
{
    $user = auth()->user();

$esAutor =

    $document->user_id ===
    $user->id;

$esPropietario =

    $document
        ->project
        ->owner_id ===
    $user->id;

if (
    !$esAutor &&
    !$esPropietario
) {

    return response()->json([

        'message' =>
            'No autorizado.'

    ], 403);

}

    $validated = $request->validate([

        'nombre' => 'required|string|max:255',

        'descripcion' => 'nullable|string',

        'archivo' => 'nullable|file|mimes:pdf|max:10240',

    ]);

    if ($request->hasFile('archivo')) {

        if ($document->file_path) {

            Storage::disk('public')
                ->delete($document->file_path);

        }

        $document->file_path =
            $request->file('archivo')
                ->store('documents', 'public');

    }

    $document->nombre =
        $validated['nombre'];

    $document->descripcion =
        $validated['descripcion'] ?? null;

    $document->save();

    ActivityLogger::log(

    $document->project_id,

    auth()->id(),

    'document_updated',

    auth()->user()->name .
    ' actualizó el avance "' .
    $document->nombre .
    '"',

    [

        'document_id' =>
            $document->id,

        'documento' =>
            $document->nombre

    ]

);
    return response()->json([
        'message' => 'Documento actualizado correctamente',
        'document' => $document
    ]);
    }

    public function destroy(
    Document $document
)
{
    $user = auth()->user();

    $esAutor =

        $document->user_id ===
        $user->id;

    $esPropietario =

        $document
            ->project
            ->owner_id ===
        $user->id;

    if (
        !$esAutor &&
        !$esPropietario
    ) {

        return response()->json([

            'message' =>
                'No autorizado.'

        ], 403);

    }

    if ($document->file_path) {

        Storage::disk('public')
            ->delete(
                $document->file_path
            );

    }

    ActivityLogger::log(

    $document->project_id,

    auth()->id(),

    'document_deleted',

    auth()->user()->name .
    ' eliminó el avance "' .
    $document->nombre .
    '"',

    [

        'documento' =>
            $document->nombre

    ]

);
    $document->delete();

    return response()->json([

        'message' =>
            'Documento eliminado correctamente'

    ]);
}
}


