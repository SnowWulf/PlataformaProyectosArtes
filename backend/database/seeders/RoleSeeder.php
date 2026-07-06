<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
	{
    Role::firstOrCreate(
        ['nombre' => 'Estudiante'],
        ['descripcion' => 'Usuario que crea y gestiona proyectos académicos']
    );

    Role::firstOrCreate(
        ['nombre' => 'Tutor'],
        ['descripcion' => 'Usuario que supervisa proyectos y puede tener proyectos propios']
    );

    Role::firstOrCreate(
        ['nombre' => 'Coordinador'],
        ['descripcion' => 'Usuario encargado de administrar y supervisar la plataforma']
    );
	}
}
