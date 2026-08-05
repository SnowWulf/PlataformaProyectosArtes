<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'collaboration_requests',
            function (Blueprint $table) {

                $table->foreignId('receiver_id')
                    ->nullable()
                    ->after('requester_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'collaboration_requests',
            function (Blueprint $table) {

                $table->dropForeign(
                    ['receiver_id']
                );

                $table->dropColumn(
                    'receiver_id'
                );

            }
        );
    }
};