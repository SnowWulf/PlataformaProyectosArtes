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
    'telegram_chat_id',
    'telegram_connect_token',
    'role_id',
    'programa',
    'bio',
    'foto',
    'mostrar_proyectos',
    'mostrar_correo',
    'require_password_change'
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

            'email_verified_at' =>
                'datetime',

            'password' =>
                'hashed',

            'mostrar_proyectos' =>
                'boolean',

            'mostrar_correo' =>
                'boolean',

            'require_password_change' =>
                'boolean'

        ];
    }

    protected $appends = [

        'foto_url'

    ];
    
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
    
    public function activityLogs()
    {
        return $this->hasMany(
            ActivityLog::class
        );
    }

    public function getFotoUrlAttribute()
    {
        if (!$this->foto) {
            return null;
        }
        return asset(
            'storage/' . $this->foto
        );
    }

    public function deliveries()
    {
        return $this->hasMany(
            ProjectDelivery::class,
            'tutor_id'
        );
    }

    public function calendarEvents()
    {
        return $this->hasMany(CalendarEvent::class);
    }

    public function deliverySubmissions()
    {
        return $this->hasMany(DeliverySubmission::class, 'student_id');
    }

    public function alertPreferences(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserAlertPreference::class);
    }

    public function notifications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Notification::class);
    }
}