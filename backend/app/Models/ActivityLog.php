<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [

        'project_id',

        'user_id',

        'tipo',

        'descripcion',

        'metadata'

    ];

    protected $casts = [

        'metadata' => 'array'

    ];

    public function project()
    {
        return $this->belongsTo(
            Project::class
        );
    }

    public function user()
    {
        return $this->belongsTo(
            User::class
        );
    }
}