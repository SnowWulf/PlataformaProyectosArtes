<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\User;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
	$usuario = User::where('email', 'juan@artes.edu.co')->first();

	Project::create([
    		'titulo' => 'Plataforma Digital para Gestión de Proyectos Académicos',
    		'descripcion' => 'Proyecto de grado para la Facultad de Artes',
    		'tipo_proyecto' => 'Proyecto de Grado',
    		'estado' => 'En desarrollo',
    		'fecha_inicio' => now(),
    		'owner_id' => $usuario->id,
		]);
    	}
}
