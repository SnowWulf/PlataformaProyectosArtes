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
        Schema::create('calendar_events', function (Blueprint $table) {

    $table->id();

    $table->foreignId('user_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->string('titulo');

    $table->text('descripcion')
        ->nullable();

    $table->dateTime('fecha_inicio');

    $table->dateTime('fecha_fin')
        ->nullable();

    $table->enum(
        'tipo',
        [

            'personal',

            'academico',

            'reunion',

            'otro'

        ]
    )->default('personal');

    $table->string('color')
        ->default('#4CAF50');

    $table->boolean('recordatorio')
        ->default(false);

    $table->timestamps();

});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
    }
};
