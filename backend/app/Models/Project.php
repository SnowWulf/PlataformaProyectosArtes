<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

class Project extends Model
{
    protected $fillable = [
        'titulo',
        'descripcion',
        'tipo_proyecto',
        'estado',
        'fecha_inicio',
        'fecha_fin',
        'owner_id',
        'tutor_id'
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function tutor(): BelongsTo
    {
	    return $this->belongsTo(User::class, 'tutor_id');
    }

    public function tutorRequests()
    {
        return $this->hasMany(TutorRequest::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
    public function collaborators()
    {
        return $this->belongsToMany(

            User::class,

            'project_collaborators',

            'project_id',

            'user_id'

        );
    }
    public function messages()
    {
        return $this->hasMany(
            ProjectMessage::class
        );
    }

    public function activityLogs()
    {
        return $this->hasMany(
            ActivityLog::class
        );
    }
    
}
