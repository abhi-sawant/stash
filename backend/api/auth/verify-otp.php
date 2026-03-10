<?php
/**
 * POST /api/auth/verify-otp
 * Body: { "email": "user@example.com", "otp": "123456" }
 *
 * Verifies the OTP and returns a JWT access token on success.
 */

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');
$otp   = trim($input['otp'] ?? '');

if (empty($email) || empty($otp)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and OTP code are required']);
    exit;
}

$db = getDB();

// ─── Find valid matching OTP ───────────────────────────────────────────────
// We join users + otps and check: correct email, correct otp, not used, not expired.
$stmt = $db->prepare('
    SELECT u.id AS user_id, o.id AS otp_id
    FROM users u
    INNER JOIN otps o ON o.user_id = u.id
    WHERE u.email    = ?
      AND o.otp      = ?
      AND o.used     = 0
      AND o.expires_at > UTC_TIMESTAMP()
    ORDER BY o.created_at DESC
    LIMIT 1
');
$stmt->bind_param('ss', $email, $otp);
$stmt->execute();
$stmt->bind_result($userId, $otpId);
$found = $stmt->fetch();
$stmt->close();

if (!$found) {
    http_response_code(401);
    echo json_encode(['error' => 'The code is incorrect or has expired. Please try again.']);
    $db->close();
    exit;
}

// ─── Mark OTP as used ─────────────────────────────────────────────────────
$stmt = $db->prepare('UPDATE otps SET used = 1 WHERE id = ?');
$stmt->bind_param('i', $otpId);
$stmt->execute();
$stmt->close();
$db->close();

// ─── Issue JWT ────────────────────────────────────────────────────────────
$token = jwtEncode(['user_id' => $userId, 'email' => $email]);

echo json_encode([
    'token' => $token,
    'user'  => ['id' => $userId, 'email' => $email],
]);
