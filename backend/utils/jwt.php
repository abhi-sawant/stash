<?php

require_once __DIR__ . '/../config/config.php';

// ─── Base64url helpers (JWT uses base64url, not plain base64) ──────────────

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string
{
    $padded = $data . str_repeat('=', 4 - (strlen($data) % 4));
    return base64_decode(strtr($padded, '-_', '+/'));
}

// ─── JWT encode ────────────────────────────────────────────────────────────

/**
 * Creates a signed JWT token containing the given payload.
 * The token expires after JWT_EXPIRY seconds (set in config.php).
 */
function jwtEncode(array $payload): string
{
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    $encodedPayload = base64url_encode(json_encode($payload));
    $signature = base64url_encode(
        hash_hmac('sha256', "$header.$encodedPayload", JWT_SECRET, true)
    );
    return "$header.$encodedPayload.$signature";
}

// ─── JWT decode ────────────────────────────────────────────────────────────

/**
 * Validates and decodes a JWT token.
 * Returns the payload array on success, or null if the token is invalid/expired.
 */
function jwtDecode(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $encodedPayload, $signature] = $parts;

    // Verify signature
    $expectedSig = base64url_encode(
        hash_hmac('sha256', "$header.$encodedPayload", JWT_SECRET, true)
    );
    if (!hash_equals($expectedSig, $signature)) return null;

    // Decode and check expiry
    $data = json_decode(base64url_decode($encodedPayload), true);
    if (!is_array($data) || !isset($data['exp']) || $data['exp'] < time()) return null;

    return $data;
}
