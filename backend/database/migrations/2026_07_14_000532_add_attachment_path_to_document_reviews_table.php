<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_reviews', function (
            Blueprint $table
        ) {

            $table->string('attachment_path')
                ->nullable()
                ->after('comentario');

        });
    }

    public function down(): void
    {
        Schema::table('document_reviews', function (
            Blueprint $table
        ) {

            $table->dropColumn(
                'attachment_path'
            );

        });
    }
};
