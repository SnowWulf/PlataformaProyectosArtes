<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Project;

use App\Models\ProjectMessage;

class ProjectMessageController
extends Controller
{
    public function index(
        $projectId
    )
    {
        return ProjectMessage::with(

            'user'

        )
        ->where(
            'project_id',
            $projectId
        )
        ->orderBy(
            'created_at'
        )
        ->get();
    }

    public function store(
        Request $request,
        $projectId
    )
    {
        $request->validate([

            'mensaje' =>
                'required|string|max:1000'

        ]);

        $message =
            ProjectMessage::create([

                'project_id' =>
                    $projectId,

                'user_id' =>
                    $request
                        ->user()
                        ->id,

                'mensaje' =>
                    $request
                        ->mensaje

            ]);

        return $message->load(
            'user'
        );
    }
}