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
    Schema::create('tutor_requests', function (Blueprint $table) {

        $table->id();

        $table->foreignId('project_id')
              ->constrained()
              ->cascadeOnDelete();

        $table->foreignId('student_id')
              ->constrained('users')
              ->cascadeOnDelete();

        $table->foreignId('tutor_id')
              ->constrained('users')
              ->cascadeOnDelete();

        $table->enum('estado', [
            'Pendiente',
            'Aceptada',
            'Rechazada',
            'Cancelada'
        ])->default('Pendiente');

        $table->text('mensaje')->nullable();

        $table->timestamps();

    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tutor_requests');
    }
};
