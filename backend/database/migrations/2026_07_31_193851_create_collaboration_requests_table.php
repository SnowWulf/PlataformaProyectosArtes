<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('collaboration_requests', function (Blueprint $table) {
                $table->id();

    $table->foreignId('project_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->foreignId('requester_id')
        ->constrained('users')
        ->cascadeOnDelete();

    $table->enum(
        'estado',
        [
            'Pendiente',
            'Aceptada',
            'Rechazada'
        ]
    )->default('Pendiente');

    $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collaboration_requests');
    }
};
