<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'global_enabled',
    'preferences'
])]
class UserAlertPreference extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'global_enabled' => 'boolean',
            'preferences' => 'array' // Transforma automáticamente el JSON a Array en PHP
        ];
    }

    /**
     * Opciones por defecto para nuevos usuarios
     */
    public static function defaultPreferences(): array
    {
        return [
            'documento_revisado'     => true,
            'respuesta_tutoria'      => true,
            'nueva_entrega'          => true,
            'mensajes_proyecto'      => true,
            'proyecto_por_finalizar' => true,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}