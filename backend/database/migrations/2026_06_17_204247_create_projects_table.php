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
	    Schema::create('projects', function (Blueprint $table) {

	        $table->id();

	        $table->string('titulo');
	        $table->text('descripcion')->nullable();

	        $table->string('tipo_proyecto')->default('estudiantil');
	        $table->string('estado')->default('Pendiente');

	        $table->date('fecha_inicio')->nullable();
        	$table->date('fecha_fin')->nullable();

	        $table->foreignId('owner_id')
	              ->constrained('users')
	              ->onDelete('cascade');

	        $table->foreignId('tutor_id')
	              ->nullable()
	              ->constrained('users')
	              ->nullOnDelete();

	        $table->timestamps();
	    });
	}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
