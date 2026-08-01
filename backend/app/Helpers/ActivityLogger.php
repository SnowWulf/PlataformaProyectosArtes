<?php

namespace App\Helpers;

use App\Models\ActivityLog;

class ActivityLogger
{
    public static function log(

        ?int $projectId,

        ?int $userId,

        string $tipo,

        string $descripcion,

        array $metadata = []

    ): void {

        ActivityLog::create([

            'project_id' =>
                $projectId,

            'user_id' =>
                $userId,

            'tipo' =>
                $tipo,

            'descripcion' =>
                $descripcion,

            'metadata' =>
                $metadata

        ]);

    }
}