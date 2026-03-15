<?php
/**
 * POST /api/auth/reset-password
 * Body: { "email": "user@example.com", "otp": "123456", "password": "newpassword" }
 *
 * Verifies the OTP sent by forgot-password and sets a new password.
 * Does NOT issue a JWT — the user must log in after resetting.
 */

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input    = json_decode(file_get_contents('php://input'), true);
$email    = trim($input['email'] ?? '');
$otp      = trim($input['otp'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($otp) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email, reset code, and new password are required']);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 8 characters long']);
    exit;
}

$db = getDB();

// ─── Find a valid matching OTP for this email ──────────────────────────────
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

// ─── Update password ──────────────────────────────────────────────────────
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
$stmt->bind_param('si', $passwordHash, $userId);
$stmt->execute();
$stmt->close();
$db->close();

echo json_encode(['message' => 'Password reset successfully. You can now sign in with your new password.']);
