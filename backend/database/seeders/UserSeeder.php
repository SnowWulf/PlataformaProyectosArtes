<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $estudiante = Role::where('nombre', 'Estudiante')->first();
        $tutor = Role::where('nombre', 'Tutor')->first();
        $coordinador = Role::where('nombre', 'Coordinador')->first();

        User::firstOrCreate(
            ['email' => 'juan@artes.edu.co'],
            [
                'name' => 'Juan Pérez',
                'password' => Hash::make('123456'),
                'role_id' => $estudiante->id,
            ]
        );

        User::firstOrCreate(
            ['email' => 'maria@artes.edu.co'],
            [
                'name' => 'María Gómez',
                'password' => Hash::make('123456'),
                'role_id' => $tutor->id,
            ]
        );

        User::firstOrCreate(
            ['email' => 'coordinador@artes.edu.co'],
            [
                'name' => 'Carlos Rodríguez',
                'password' => Hash::make('123456'),
                'role_id' => $coordinador->id,
            ]
        );
    }
}