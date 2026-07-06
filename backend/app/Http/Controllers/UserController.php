<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;


class UserController extends Controller
{
    public function index()
    {
	return User::with('role')->get();
    }

    public function show($id)
    {
	return User::with('role')->findOrFail($id);
    }

    public function store(Request $request)
    {
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|min:6',
        'role_id' => 'required|exists:roles,id'
    ]);

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'role_id' => $request->role_id
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
        'role_id' => 'required|exists:roles,id'
    ]);

    $user->name = $request->name;
    $user->email = $request->email;
    $user->role_id = $request->role_id;

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
}
