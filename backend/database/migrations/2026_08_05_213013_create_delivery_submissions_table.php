<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_submissions', function (Blueprint $table) {

            $table->id();

            $table->foreignId('delivery_id')
                ->constrained('project_deliveries')
                ->cascadeOnDelete();

            $table->foreignId('student_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('file_path');

            $table->text('comentario')->nullable();

            $table->enum('estado', [

                'submitted',

                'reviewed',

                'approved',

                'rejected'

            ])->default('submitted');

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_submissions');
    }
};