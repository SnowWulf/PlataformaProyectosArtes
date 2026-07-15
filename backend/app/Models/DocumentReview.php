<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentReview extends Model
{
    protected $fillable = [

        'document_id',

        'tutor_id',

        'estado',

        'comentario',

        'attachment_path'

    ];

    protected $appends = [

        'attachment_url'

    ];

    public function document()
    {
        return $this->belongsTo(
            Document::class
        );
    }

    public function tutor()
    {
        return $this->belongsTo(
            User::class,
            'tutor_id'
        );
    }

    public function getAttachmentUrlAttribute()
    {
        if (!$this->attachment_path) {

            return null;

        }

        return asset(
            'storage/' .
            $this->attachment_path
        );
    }
}