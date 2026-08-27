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
    Schema::table('delivery_submissions', function (Blueprint $table) {
        $table->string('nota', 10)->nullable()->after('comentario');
    });
}

public function down(): void
{
    Schema::table('delivery_submissions', function (Blueprint $table) {
        $table->dropColumn('nota');
    });
}
};
