<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CollaborationRequest extends Model
{
    protected $fillable = [

        'project_id',
        'requester_id',
        'estado'

    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function requester()
    {
        return $this->belongsTo(
            User::class,
            'requester_id'
        );
    }
}