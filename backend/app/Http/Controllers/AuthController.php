<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required','email'],
            'password' => ['required']
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ],401);
        }

        $user = Auth::user();

        $token = $user->createToken('angular')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->load('role')
        ]);
    }

    /**
     * Permite al usuario cambiar su contraseña (especialmente en el primer ingreso)
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password'     => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        // Verificar que la contraseña actual ingresada coincida
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta'
            ], 422);
        }

        // Actualizar la contraseña y desactivar la bandera de cambio obligatorio
        $user->update([
            'password'                => Hash::make($request->new_password),
            'require_password_change' => false,
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada correctamente',
            'user'    => $user->load('role')
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()
            ->currentAccessToken()
            ->delete();

        return response()->json([
            'message'=>'Sesión cerrada'
        ]);
    }

    public function me(Request $request)
    {
        return $request->user()->load('role');
    }
}