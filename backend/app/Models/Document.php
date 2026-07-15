<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Document extends Model
{
    protected $appends = ['file_url'];
    protected $fillable = [
        'project_id',
        'user_id',
        'nombre',
        'descripcion',
        'file_path',
        'estado',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
        public function getFileUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }

    public function reviews()
    {
        return $this->hasMany(
            DocumentReview::class
        );
    }
}