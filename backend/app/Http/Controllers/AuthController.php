<?php

namespace App\Http\Controllers;

use App\Notifications\SendTwoFactorCode;
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
            ], 401);
        }

        $user = Auth::user();

        // Si el usuario tiene activado el 2FA, interrumpimos el login y enviamos el código
        if ($user->two_factor_enabled) {
            $user->generateTwoFactorCode();
            $user->notify(new SendTwoFactorCode());

            // Cerramos sesión temporalmente hasta que verifique el código
            Auth::logout();

            return response()->json([
                'requires_two_factor' => true,
                'email' => $user->email,
                'message' => 'Se ha enviado un código de verificación a tu correo (Válido por 2 minutos).'
            ], 200);
        }

        // Si NO tiene 2FA, genera el token directamente
        $token = $user->createToken('angular')->plainTextToken;

        return response()->json([
            'requires_two_factor' => false,
            'token' => $token,
            'user' => $user->load('role')
        ]);
    }

    /**
     * Valida el código de verificación de 2 pasos enviado por correo.
     */
    public function verifyTwoFactor(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'two_factor_code' => ['required', 'string', 'size:6']
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user || $request->two_factor_code !== $user->two_factor_code) {
            return response()->json([
                'message' => 'El código ingresado es incorrecto.'
            ], 422);
        }

        // Verificar si el código expiró (> 2 minutos)
        if (now()->greaterThan($user->two_factor_expires_at)) {
            return response()->json([
                'message' => 'El código ha expirado. Por favor, solicita uno nuevo.'
            ], 422);
        }

        // Código correcto y vigente -> Limpiamos el código y emitimos el token
        $user->resetTwoFactorCode();
        $token = $user->createToken('angular')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->load('role')
        ], 200);
    }

    /**
     * Permite habilitar o deshabilitar el 2FA desde la configuración del usuario
     */
    public function toggleTwoFactorSetting(Request $request)
    {
        $request->validate([
            'enabled' => ['required', 'boolean']
        ]);

        $user = $request->user();
        $user->two_factor_enabled = $request->enabled;
        $user->resetTwoFactorCode(); // Limpia rastros anteriores si los hubiera

        return response()->json([
            'message' => $request->enabled ? 'Verificación en 2 pasos activada correctamente.' : 'Verificación en 2 pasos desactivada.',
            'two_factor_enabled' => $user->two_factor_enabled
        ], 200);
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
            'message' => 'Sesión cerrada'
        ]);
    }

    public function me(Request $request)
    {
        return $request->user()->load('role');
    }
}