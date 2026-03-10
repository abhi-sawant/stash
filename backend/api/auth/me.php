<?php
/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 *
 * Returns the currently authenticated user's profile.
 */

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$authData = requireAuth();

echo json_encode([
    'user' => [
        'id'    => $authData['user_id'],
        'email' => $authData['email'],
    ],
]);
