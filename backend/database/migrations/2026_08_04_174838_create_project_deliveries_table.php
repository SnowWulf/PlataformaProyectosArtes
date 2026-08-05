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
    Schema::create('project_deliveries', function (Blueprint $table) {

        $table->id();

        $table->foreignId('project_id')
            ->constrained()
            ->cascadeOnDelete();

        $table->foreignId('tutor_id')
            ->constrained('users')
            ->cascadeOnDelete();

        $table->string('titulo');

        $table->text('descripcion')
            ->nullable();

        $table->dateTime('fecha_limite');

        $table->boolean('obligatorio')
            ->default(true);

        $table->enum('estado', [

            'abierta',

            'cerrada'

        ])->default('abierta');

        $table->timestamps();

    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_deliveries');
    }
};
