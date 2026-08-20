<?php

namespace App\Http\Controllers;

use App\Models\RegistrationRequest;
use App\Models\User;
use App\Models\Role;
use App\Mail\RegistrationStatusMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class RegistrationRequestController extends Controller
{
    /**
     * Listar todas las solicitudes pendientes
     */
    public function index()
    {
        $solicitudes = RegistrationRequest::where('status', 'pendiente')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($solicitudes, 200);
    }

    /**
     * Guardar una nueva solicitud enviada desde el formulario público
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|email|unique:users,email|unique:registration_requests,email',
            'role_solicitado' => 'nullable|string',
            'programa'        => 'required|string',
            'reason'          => 'required|string',
        ]);

        $solicitud = RegistrationRequest::create([
            'name'            => $validated['name'],
            'email'           => $validated['email'],
            'role_solicitado' => $validated['role_solicitado'] ?? 'Estudiante',
            'programa'        => $validated['programa'],
            'reason'          => $validated['reason'],
            'status'          => 'pendiente',
        ]);

        return response()->json([
            'message' => 'Solicitud enviada con éxito',
            'data'    => $solicitud
        ], 201);
    }

    /**
     * Aprobar / Admitir una solicitud
     */
    public function approve(Request $request, $id)
    {
        $solicitud = RegistrationRequest::findOrFail($id);

        // Captura la contraseña dinámica enviada desde Angular (o '12345678' como respaldo)
        $password = $request->input('password');
        if (empty($password)) {
            $password = '12345678';
        }

        $mensajePredeterminado = "Hola {$solicitud->name}, tu solicitud para el programa {$solicitud->programa} ha sido aprobada exitosamente. Tu contraseña temporal de acceso es: {$password}";
        $customMessage = $request->input('message', $mensajePredeterminado);

        $roleNombre = $solicitud->role_solicitado ?? 'Estudiante';
        $role = Role::where('nombre', $roleNombre)->first();
        $roleId = $role ? $role->id : 1;

        // 1. Crear el usuario oficial indicando que requiere cambio de contraseña
        $user = User::create([
            'name'                    => $solicitud->name,
            'email'                   => $solicitud->email,
            'password'                => Hash::make($password),
            'programa'                => $solicitud->programa,
            'role_id'                 => $roleId,
            'require_password_change' => true,
        ]);

        // 2. Notificar por correo
        try {
            Mail::to($solicitud->email)->send(
                new RegistrationStatusMail('¡Tu solicitud de registro ha sido aprobada!', $customMessage)
            );
        } catch (\Exception $e) {
            Log::error("Error al enviar correo de aprobación: " . $e->getMessage());
        }

        // 3. Eliminar la solicitud de la tabla registration_requests
        $solicitud->delete();

        return response()->json([
            'message' => 'Solicitud aprobada, usuario creado y solicitud eliminada de la cola.',
            'user'    => $user
        ], 200);
    }

    /**
     * Rechazar una solicitud
     */
    public function reject(Request $request, $id)
    {
        $solicitud = RegistrationRequest::findOrFail($id);

        $mensajePredeterminado = "Hola {$solicitud->name}, lamentamos informarte que tu solicitud de registro para el programa {$solicitud->programa} ha sido rechazada.";
        $customMessage = $request->input('message', $mensajePredeterminado);

        // 1. Notificar por correo
        try {
            Mail::to($solicitud->email)->send(
                new RegistrationStatusMail('Respuesta a tu Solicitud de Registro', $customMessage)
            );
        } catch (\Exception $e) {
            Log::error("Error al enviar correo de rechazo: " . $e->getMessage());
        }

        // 2. Eliminar la solicitud de la tabla registration_requests
        $solicitud->delete();

        return response()->json([
            'message' => 'Solicitud rechazada y eliminada de la cola correctamente.'
        ], 200);
    }
}