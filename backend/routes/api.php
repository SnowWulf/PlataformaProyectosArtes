<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ProjectController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TutorRequestController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentReviewController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\ProjectMessageController;
use App\Http\Controllers\ProjectDeliveryController;
use App\Http\Controllers\CalendarEventController;
use App\Http\Controllers\DeliverySubmissionController;
use App\Http\Controllers\AlertPreferenceController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TelegramAuthController;
use App\Http\Controllers\Api\ProjectAiChatController;
use App\Http\Controllers\BiController;
use App\Http\Controllers\RegistrationRequestController;
use App\Http\Controllers\ReviewController;

/*
|--------------------------------------------------------------------------
| Rutas Públicas (Sin autenticación)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::post('/login/verify-2fa', [AuthController::class, 'verifyTwoFactor']); // <--- NUEVA RUTA 2FA

// RUTA PÚBLICA DE RESEÑAS PARA LANDING PAGE
Route::get('/landing/reviews', [ReviewController::class, 'landingReviews']);

// Telegram envía notificaciones aquí sin cabecera Bearer/Sanctum
Route::post('/telegram/webhook', [TelegramAuthController::class, 'handleWebhook']);

// Rutas para las solicitudes de registro
Route::get('/registration-requests', [RegistrationRequestController::class, 'index']);
Route::post('/registration-requests', [RegistrationRequestController::class, 'store']);
Route::put('/registration-requests/{id}/approve', [RegistrationRequestController::class, 'approve']);
Route::put('/registration-requests/{id}/reject', [RegistrationRequestController::class, 'reject']);


/*
|--------------------------------------------------------------------------
| Rutas Protegidas (Requieren autenticación con Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // AUTH & PERFIL
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', function (Request $request) {
        return $request->user()->load('role');
    });
    Route::get('/profile', [UserController::class, 'myProfile']);
    Route::post('/profile', [UserController::class, 'updateProfile']);

    // GESTIÓN DE 2FA (CONFIGURACIÓN)
    Route::post('/user/toggle-2fa', [AuthController::class, 'toggleTwoFactorSetting']); // <--- NUEVA RUTA CONFIGURACIÓN

    // FEEDBACK Y RESEÑAS (ESTUDIANTES Y TUTORES)
    Route::post('/feedback', [ReviewController::class, 'store']);

    // GESTIÓN DE RESEÑAS (COORDINADOR)
    Route::prefix('coordinador')->group(function () {
        Route::get('/reviews', [ReviewController::class, 'indexCoordinador']);
        Route::patch('/reviews/{review}', [ReviewController::class, 'actualizarEstadoCoordinador']);
        Route::delete('/reviews/{review}', [ReviewController::class, 'destroyCoordinador']);
    });

    // RECURSOS GENERALES
    Route::apiResource('documents', DocumentController::class);
    Route::apiResource('calendar-events', CalendarEventController::class);

    // USERS
    Route::get('/users/tutors', [UserController::class, 'tutors']);
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/users/{id}/delete', [UserController::class, 'deleteWithPassword']);

    // ROLES
    Route::get('/roles', [RoleController::class, 'index']);
    Route::get('/roles/{id}', [RoleController::class, 'show']);
    Route::put('/roles/{id}', [RoleController::class, 'update']);

    // PROJECTS
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/deadline-alerts', [ProjectController::class, 'getActiveDeadlineAlerts']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
    Route::get('/projects/{project}/documents', [ProjectController::class, 'documents']);
    Route::get('/projects/{project}/activity', [ProjectController::class, 'activity']);
    Route::delete('/projects/{projectId}/collaborators/{userId}', [ProjectController::class, 'removeCollaborator']);

    // CHATBOT DE IA POR PROYECTO
    Route::prefix('projects/{projectId}/ai-chat')->group(function () {
        Route::get('/history', [ProjectAiChatController::class, 'getHistory']);
        Route::post('/', [ProjectAiChatController::class, 'chat']);
    });

    // ACTIVIDAD GENERAL
    Route::get('/activity', [ProjectController::class, 'studentActivity']);

    // ENTREGAS Y ENTREGABLES (DELIVERIES)
    Route::get('/deliveries', [ProjectDeliveryController::class, 'getAllDeliveries']);
    Route::get('/projects/{project}/deliveries', [ProjectDeliveryController::class, 'index']);
    Route::post('/projects/{project}/deliveries', [ProjectDeliveryController::class, 'store']);
    Route::put('/deliveries/{delivery}', [ProjectDeliveryController::class, 'update']);
    Route::delete('/deliveries/{delivery}', [ProjectDeliveryController::class, 'destroy']);

    // SUBMISSION DE ENTREGAS
    Route::post('/deliveries/{delivery}/submit', [DeliverySubmissionController::class, 'store']);
    Route::get('/deliveries/{delivery}/submissions', [DeliverySubmissionController::class, 'index']);

    // DOCUMENT REVIEWS
    Route::post('/documents/{document}/reviews', [DocumentReviewController::class, 'store']);
    Route::get('/documents/{document}/reviews', [DocumentReviewController::class, 'index']);

    // MENSAJES DE PROYECTO
    Route::get('/projects/{projectId}/messages', [ProjectMessageController::class, 'index']);
    Route::post('/projects/{projectId}/messages', [ProjectMessageController::class, 'store']);

    // PETICIONES DE TUTORÍA
    Route::post('/tutor-requests', [TutorRequestController::class, 'store']);
    Route::get('/tutor-requests/pending', [TutorRequestController::class, 'pending']);
    Route::put('/tutor-requests/{id}/accept', [TutorRequestController::class, 'accept']);
    Route::put('/tutor-requests/{id}/reject', [TutorRequestController::class, 'reject']);

    // COMUNIDAD Y COLABORACIÓN
    Route::get('/community/users', [CommunityController::class, 'users']);
    Route::get('/community/users/{id}', [CommunityController::class, 'user']);
    Route::get('/community/users/{id}/projects', [CommunityController::class, 'projects']);
    Route::post('/community/request-collaboration', [CommunityController::class, 'requestCollaboration']);
    Route::get('/community/requests/received/{id}', [CommunityController::class, 'receivedRequests']);
    Route::get('/community/requests/sent/{id}', [CommunityController::class, 'sentRequests']);
    Route::post('/community/requests/{id}/accept', [CommunityController::class, 'acceptRequest']);
    Route::post('/community/requests/{id}/reject', [CommunityController::class, 'rejectRequest']);
    Route::post('/community/invite', [CommunityController::class, 'inviteToProject']);

    // PREFERENCIAS DE ALERTAS
    Route::get('/alerts/preferences', [AlertPreferenceController::class, 'show']);
    Route::put('/alerts/preferences', [AlertPreferenceController::class, 'update']);

    // NOTIFICACIONES IN-APP
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::get('/notifications/preferences', [NotificationController::class, 'getPreferences']);
    Route::put('/notifications/preferences', [NotificationController::class, 'updatePreferences']);
    Route::post('/notifications', [NotificationController::class, 'store']);

    // TELEGRAM (Rutas protegidas para el usuario autenticado en la Web)
    Route::get('/telegram/connect-link', [TelegramAuthController::class, 'getConnectLink']);
    Route::post('/telegram/disconnect', [TelegramAuthController::class, 'disconnect']);

    // METABASE DASHBOARD EMBED
    Route::get('/bi/dashboard-url', [BiController::class, 'getDashboardUrl']);

    // RUTAS DE PRUEBA / DEBUG
    Route::post('/registration-requests/{id}/approve', [RegistrationRequestController::class, 'approve']);
    Route::post('/registration-requests/{id}/reject', [RegistrationRequestController::class, 'reject']);

    // RUTA PARA CAMBIO DE CONTRASEÑA (PRIMER INGRESO)
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // RUTA PARA ACTUALIZAR LA REVISIÓN DE UNA ENTREGA (SUBMISSION)
    Route::put('/delivery-submissions/{id}', [DeliverySubmissionController::class, 'update']);

});