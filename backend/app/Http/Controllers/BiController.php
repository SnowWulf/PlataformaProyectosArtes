<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class BiController extends Controller
{
    /**
     * Genera la URL firmada con JWT para renderizar el Dashboard de Metabase en el frontend.
     */
    public function getDashboardUrl()
{
    $metabaseSiteUrl = env('METABASE_SITE_URL', 'http://localhost:3000');
    $metabaseSecretKey = env('METABASE_SECRET_KEY');
    
    // ⚠️ Cambiamos a 2 según el panel de Metabase
    $dashboardId = 2; 

    $config = \Lcobucci\JWT\Configuration::forSymmetricSigner(
        new \Lcobucci\JWT\Signer\Hmac\Sha256(),
        \Lcobucci\JWT\Signer\Key\InMemory::plainText($metabaseSecretKey)
    );

    $now = new \DateTimeImmutable();
    $token = $config->builder()
        ->withClaim('resource', ['dashboard' => $dashboardId])
        ->withClaim('params', (object)[])
        ->expiresAt($now->modify('+10 minutes'))
        ->getToken($config->signer(), $config->signingKey());

    $iframeUrl = "{$metabaseSiteUrl}/embed/dashboard/{$token->toString()}#bordered=false&titled=true";

    return response()->json([
        'iframeUrl' => $iframeUrl
    ]);
}
}