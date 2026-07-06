<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TutorRequest extends Model
{
    protected $fillable = [

        'project_id',
        'student_id',
        'tutor_id',
        'estado',
        'mensaje'

    ];

    /*
    |--------------------------------------------------------------------------
    | Relaciones
    |--------------------------------------------------------------------------
    */

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function student()
    {
        return $this->belongsTo(
            User::class,
            'student_id'
        );
    }

    public function tutor()
    {
        return $this->belongsTo(
            User::class,
            'tutor_id'
        );
    }
}