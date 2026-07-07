<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ProjectController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TutorRequestController;
use App\Http\Controllers\DocumentController;


Route::post('/login',[AuthController::class,'login']);



// TODO lo que necesite usuario logueado aquí
Route::middleware('auth:sanctum')->group(function(){

    Route::apiResource('documents', DocumentController::class);

    Route::get('/user', function(Request $request){

        return $request->user()->load('role');

    });



    // AUTH

    Route::post('/logout',[AuthController::class,'logout']);

    Route::get('/me',[AuthController::class,'me']);



    // PROJECTS

    Route::get('/projects',[ProjectController::class,'index']);

    Route::get('/projects/{id}',[ProjectController::class,'show']);

    Route::post('/projects',[ProjectController::class,'store']);

    Route::put('/projects/{id}',[ProjectController::class,'update']);

    Route::delete('/projects/{id}',[ProjectController::class,'destroy']);



    // USERS

    Route::get(
        '/users/tutors',
        [UserController::class, 'tutors']
    );

    Route::get('/users',[UserController::class,'index']);

    Route::get('/users/{id}',[UserController::class,'show']);

    Route::post('/users',[UserController::class,'store']);

    Route::put('/users/{id}',[UserController::class,'update']);

    Route::delete('/users/{id}',[UserController::class,'destroy']);

    Route::post(
    '/users/{id}/delete',
    [UserController::class, 'deleteWithPassword']
    );


    // ROLES

    Route::get('/roles',[RoleController::class,'index']);

    Route::get('/roles/{id}',[RoleController::class,'show']);

    Route::put('/roles/{id}',[RoleController::class,'update']);


    // PETICIONES
    Route::post(
        '/tutor-requests',
        [TutorRequestController::class, 'store']
    );

    Route::get(
        '/tutor-requests/pending',
        [TutorRequestController::class, 'pending']
    );

    Route::put(
        '/tutor-requests/{id}/accept',
        [TutorRequestController::class, 'accept']
    );

    Route::put(
        '/tutor-requests/{id}/reject',
        [TutorRequestController::class, 'reject']
    );
});