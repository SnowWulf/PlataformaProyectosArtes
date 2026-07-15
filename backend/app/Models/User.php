<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;


#[Fillable([
    'name',
    'email',
    'password',
    'role_id'
])]
#[Hidden(['password', 'remember_token'])]

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    public function role(): BelongsTo
	{
   	 return $this->belongsTo(Role::class);
	}
    public function projects(): HasMany
	{
	    return $this->hasMany(Project::class, 'owner_id');
	}
    public function tutoredProjects(): HasMany
        {
	    return $this->hasMany(Project::class, 'tutor_id');
        }

    public function tutorRequestsSent()
    {
    return $this->hasMany(
        TutorRequest::class,
        'student_id'
        );
    }

    public function tutorRequestsReceived()
    {
    return $this->hasMany(
        TutorRequest::class,
        'tutor_id'
        );
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function documentReviews()
    {
        return $this->hasMany(
            DocumentReview::class,
            'tutor_id'
        );
    }
}
