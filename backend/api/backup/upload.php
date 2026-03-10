<?php
/**
 * POST /api/backup/upload
 * Header: Authorization: Bearer <token>
 * Body: { "data": { ...full backup object... } }
 *
 * Saves a new backup for the authenticated user.
 * Automatically deletes old backups beyond MAX_BACKUPS_PER_USER.
 */

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$authData = requireAuth();
$userId   = (int)$authData['user_id'];

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['data']) || !is_array($input['data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required field: data (must be an object)']);
    exit;
}

$dataJson = json_encode($input['data']);
$size     = strlen($dataJson);
$maxBytes = MAX_BACKUP_SIZE_MB * 1024 * 1024;

if ($size > $maxBytes) {
    http_response_code(413);
    echo json_encode(['error' => 'Backup exceeds the maximum allowed size of ' . MAX_BACKUP_SIZE_MB . 'MB']);
    exit;
}

$db = getDB();

// ─── Insert new backup ────────────────────────────────────────────────────
$stmt = $db->prepare('INSERT INTO backups (user_id, data, size) VALUES (?, ?, ?)');
$stmt->bind_param('isi', $userId, $dataJson, $size);
$stmt->execute();
$backupId = (int)$stmt->insert_id;
$stmt->close();

// ─── Prune old backups (keep only MAX_BACKUPS_PER_USER most recent) ───────
// The double subquery is required to work around MySQL's limitation that
// you cannot SELECT from a table you are also deleting from in the same query.
$maxKeep = MAX_BACKUPS_PER_USER;
$stmt = $db->prepare('
    DELETE FROM backups
    WHERE user_id = ?
      AND id NOT IN (
          SELECT id FROM (
              SELECT id FROM backups
              WHERE user_id = ?
              ORDER BY created_at DESC
              LIMIT ?
          ) AS recent
      )
');
$stmt->bind_param('iii', $userId, $userId, $maxKeep);
$stmt->execute();
$stmt->close();
$db->close();

echo json_encode([
    'backup_id'  => $backupId,
    'created_at' => date('c'),
    'size'       => $size,
]);
