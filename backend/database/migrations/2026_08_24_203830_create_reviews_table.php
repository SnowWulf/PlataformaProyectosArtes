<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            
            // Relación obligatoria con el usuario registrado que publica
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // Datos del feedback
            $table->string('asunto', 150);
            $table->text('observaciones');
            $table->unsignedTinyInteger('calificacion')->default(5); // Valoración 1-5
            $table->string('proyecto_contexto')->nullable(); // Ej: Nombre de un proyecto asociado

            // Estado de moderación por IA o gestión manual
            // 'aprobado': Visible en Landing y Panel de Coordinación
            // 'rechazado': Bloqueado por lenguaje/pertinencia
            // 'pendiente': Esperando análisis o revisión manual
            $table->enum('estado', ['pendiente', 'aprobado', 'rechazado'])->default('pendiente');
            
            // Auditoría del filtro de IA
            $table->text('motivo_rechazo_ia')->nullable();

            // Opción para destacar en el Landing Page (gestionado por el coordinador)
            $table->boolean('destacado_landing')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};