<?php
/**
 * GET /api/backup/latest
 * Header: Authorization: Bearer <token>
 *
 * Returns the most recent backup for the authenticated user,
 * or 404 if no backups exist yet.
 */

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$authData = requireAuth();
$userId   = (int)$authData['user_id'];

$db = getDB();

$stmt = $db->prepare('
    SELECT id, data, size, created_at
    FROM backups
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
');
$stmt->bind_param('i', $userId);
$stmt->execute();
$stmt->bind_result($id, $dataJson, $size, $createdAt);
$found = $stmt->fetch();
$stmt->close();
$db->close();

if (!$found) {
    http_response_code(404);
    echo json_encode(['error' => 'No backup found']);
    exit;
}

echo json_encode([
    'id'         => $id,
    'data'       => json_decode($dataJson, true),
    'size'       => $size,
    'created_at' => $createdAt,
]);
