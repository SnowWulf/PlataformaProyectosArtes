<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

    return response()->json([
        'message' => 'Documento actualizado correctamente',
        'document' => $document
    ]);
    }

    public function destroy(Document $document)
    {
    if ($document->file_path) {
        Storage::disk('public')
            ->delete($document->file_path);
    }

    $document->delete();

    return response()->json([
        'message' => 'Documento eliminado correctamente'
    ]);
    }
}


