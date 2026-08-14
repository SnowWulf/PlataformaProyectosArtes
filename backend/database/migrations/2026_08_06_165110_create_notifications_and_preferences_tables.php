<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabla de Preferencias de Alertas por Usuario
        Schema::create('user_alert_preferences', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->boolean('global_enabled')->default(true);
            $table->json('preferences')->nullable();
            
            $table->timestamps();
        });

        // 2. Tabla de Notificaciones (In-App)
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');
                  
            $table->string('title');
            $table->text('message');
            $table->string('type'); // 'documento_revisado', 'respuesta_tutoria', 'nueva_entrega', etc.
            $table->boolean('is_read')->default(false);
            $table->string('link')->nullable(); // Ruta a la que se redirige al hacer clic
            
            $table->timestamps();

            // Índice para hacer las consultas de notificaciones no leídas más rápidas
            $table->index(['user_id', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('user_alert_preferences');
    }
};