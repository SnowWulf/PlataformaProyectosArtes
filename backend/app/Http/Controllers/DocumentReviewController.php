<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentReview;
use Illuminate\Http\Request;
use App\Helpers\ActivityLogger;

class DocumentReviewController extends Controller
{
    public function index(
        Document $document
    )
    {
        return response()->json(

            $document->reviews()
                ->with('tutor')
                ->latest()
                ->get()

        );
    }

    public function store(
        Request $request,
        Document $document
    )
    {
        $user = $request->user();

        if (
            $user->role->nombre !== 'Tutor'
        ) {

            return response()->json([
                'message' => 'Solo los tutores pueden revisar documentos.'
            ], 403);

        }

        $validated = $request->validate([

            'estado' => 'required|string',

            'comentario' => 'nullable|string',

            'archivo' =>
                'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:20480'

        ]);

        $attachmentPath = null;

        if ($request->hasFile('archivo')) {

            $attachmentPath =
                $request->file('archivo')
                    ->store(
                        'review_attachments',
                        'public'
                    );

        }

        $review = DocumentReview::create([

            'document_id' => $document->id,

            'tutor_id' => $user->id,

            'estado' => $validated['estado'],

            'comentario' =>
                $validated['comentario'] ?? null,

            'attachment_path' =>
                $attachmentPath

        ]);

        $document->estado =
            $validated['estado'];

        $document->save();

        ActivityLogger::log(

    $document->project_id,

    auth()->id(),

    'review_created',

    auth()->user()->name .
    ' revisó el avance "' .
    $document->nombre .
    '"',

    [

        'estado' =>
            $review->estado,

        'comentario' =>
            $review->comentario

    ]

);

        return response()->json([
            'message' => 'Revisión registrada correctamente',
            'review' => $review
        ], 201);
    }
}