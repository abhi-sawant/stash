<?php
/**
 * GET /api/backup/list
 * Header: Authorization: Bearer <token>
 *
 * Returns a list of all backups for the authenticated user (metadata only, no data payload).
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
    SELECT id, size, created_at
    FROM backups
    WHERE user_id = ?
    ORDER BY created_at DESC
');
$stmt->bind_param('i', $userId);
$stmt->execute();
$result  = $stmt->get_result();
$backups = [];

while ($row = $result->fetch_assoc()) {
    $backups[] = $row;
}

$stmt->close();
$db->close();

echo json_encode(['backups' => $backups]);
