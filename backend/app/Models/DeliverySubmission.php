<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliverySubmission extends Model
{
    protected $fillable = [

        'delivery_id',

        'student_id',

        'file_path',

        'comentario',

        'nota',

        'estado'

    ];

    public function delivery()
    {
        return $this->belongsTo(ProjectDelivery::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}