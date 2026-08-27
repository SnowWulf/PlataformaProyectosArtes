<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function index()
    {
	return User::with('role')->get();
    }

    public function show($id)
{
    // Cargamos el usuario con su rol y sus proyectos filtrados por visibilidad
    $user = User::with(['role', 'projects' => function ($query) {
        $query->where('es_visible', true);
    }])->findOrFail($id);

    // Si el usuario desactivo la casilla global de proyectos, vaciamos el listado
    if (!$user->mostrar_proyectos) {
        $user->unsetRelation('projects');
        $user->projects = [];
    }

    return response()->json($user);
}

    public function store(Request $request)
    {
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|min:6',
        'role_id' => 'required|exists:roles,id',
        'programa' => 'nullable|string|max:255'
    ]);

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'role_id' => $request->role_id,
        'programa' => $request->programa
    ]);

    return response()->json(
        $user->load('role'),
        201
    );
    }

    public function update(Request $request, $id)
{
    $user = User::findOrFail($id);

    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email,' . $user->id,
        'role_id' => 'required|exists:roles,id',
        'programa' => 'nullable|string|max:255'
    ]);

    $user->name = $request->name;
    $user->email = $request->email;
    $user->role_id = $request->role_id;
    $user->programa = $request->programa;

    if ($request->filled('password')) {

        $user->password = Hash::make($request->password);

    }

    $user->save();

    return response()->json(
        $user->load('role')
    );
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        $user->delete();

        return response()->json([
            'message' => 'Usuario eliminado correctamente'
        ]);
    }

    public function tutors()
    {
    return User::whereHas('role', function ($query) {

        $query->where('nombre', 'Tutor');

    })
    ->select('id', 'name', 'email')
    ->orderBy('name')
    ->get();
    }

    public function deleteWithPassword(Request $request, $id)
{
    $request->validate([
        'password' => 'required'
    ]);

    $coordinador = Auth::user();

    if (!Hash::check(
        $request->password,
        $coordinador->password
    )) {

        return response()->json([
            'message' => 'Contraseña incorrecta.'
        ], 401);

    }

    $user = User::findOrFail($id);

    // Evita que un coordinador se elimine a sí mismo
    if ($user->id === $coordinador->id) {

        return response()->json([
            'message' => 'No puede eliminar su propio usuario.'
        ], 400);

    }

    $user->delete();

    return response()->json([
        'message' => 'Usuario eliminado correctamente.'
    ]);
    }


    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'bio' => 'nullable|string|max:500',
            'mostrar_proyectos' => 'boolean',
            'mostrar_correo' => 'boolean',
            'foto' => 'nullable|image|max:2048',
            'proyectos_visibilidad' => 'nullable|json'
        ]);

        if ($request->hasFile('foto')) {
            if ($user->foto) {
                Storage::disk('public')->delete($user->foto);
            }

            $path = $request->file('foto')->store('profile_photos', 'public');
            $user->foto = $path;
        }

        $user->bio = $validated['bio'] ?? $user->bio;
        $user->mostrar_proyectos = $validated['mostrar_proyectos'] ?? $user->mostrar_proyectos;
        $user->mostrar_correo = $validated['mostrar_correo'] ?? $user->mostrar_correo;

        $user->save();

        // Actualización de visibilidad individual
        if ($request->has('proyectos_visibilidad')) {
            $proyectosVisibilidad = json_decode($request->input('proyectos_visibilidad'), true);

            if (is_array($proyectosVisibilidad)) {
                foreach ($proyectosVisibilidad as $item) {
                    $user->projects()
                        ->where('id', $item['id'])
                        ->update(['es_visible' => $item['es_visible']]);
                }
            }
        }

        return response()->json([
            'message' => 'Perfil actualizado.',
            'user' => $user->load(['role', 'projects'])
        ]);
    }

    public function myProfile(Request $request)
    {
        return response()->json(
            $request->user()->load(['role', 'projects'])
        );
    }


}
