<?php

require_once __DIR__ . '/../utils/jwt.php';

/**
 * Validates the Bearer token from the Authorization header.
 * Terminates with a 401 JSON response if the token is missing or invalid.
 *
 * @return array  The decoded JWT payload (contains user_id and email)
 */
function requireAuth(): array
{
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (!str_starts_with($authHeader, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['error' => 'Missing or invalid Authorization header. Expected: Bearer <token>']);
        exit;
    }

    $token   = substr($authHeader, 7);
    $payload = jwtDecode($token);

    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Token is invalid or has expired. Please log in again.']);
        exit;
    }

    return $payload;
}
