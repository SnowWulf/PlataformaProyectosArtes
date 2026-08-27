<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'asunto',
        'observaciones',
        'calificacion',
        'proyecto_contexto',
        'estado',
        'motivo_rechazo_ia',
        'destacado_landing',
    ];

    protected $casts = [
        'calificacion' => 'integer',
        'destacado_landing' => 'boolean',
    ];

    /**
     * Relación con el usuario (Estudiante o Tutor) que redactó la reseña.
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scope para filtrar solo las reseñas públicas para la Landing Page.
     */
    public function scopePublicasLanding($query)
    {
        return $query->where('estado', 'aprobado')
                     ->where('destacado_landing', true)
                     ->latest();
    }

    /**
     * Scope para la bandeja de gestión del Coordinador.
     */
    public function scopeParaCoordinador($query, $estado = null)
    {
        $q = $query->with('usuario:id,name,email,role')->latest();
        
        if ($estado) {
            $q->where('estado', $estado);
        }

        return $q;
    }
}