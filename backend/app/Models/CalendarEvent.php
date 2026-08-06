<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarEvent extends Model
{
    protected $fillable = [

        'user_id',

        'titulo',

        'descripcion',

        'fecha_inicio',

        'fecha_fin',

        'tipo',

        'color',

        'recordatorio'

    ];

    protected $casts = [

        'fecha_inicio' => 'datetime',

        'fecha_fin' => 'datetime',

        'recordatorio' => 'boolean'

    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}