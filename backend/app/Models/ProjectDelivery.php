<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectDelivery extends Model
{
    protected $fillable = [

        'project_id',

        'tutor_id',

        'titulo',

        'descripcion',

        'fecha_limite',

        'obligatorio',

        'estado'

    ];

    protected $casts = [

        'fecha_limite' => 'datetime',

        'obligatorio' => 'boolean'

    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(

            Project::class

        );
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(

            User::class,

            'tutor_id'

        );
    }

    public function submissions()
    {
        return $this->hasMany(DeliverySubmission::class, 'delivery_id');
    }

    public function respuesta()
    {
        return $this->hasOne(DeliverySubmission::class, 'delivery_id');
    }
}