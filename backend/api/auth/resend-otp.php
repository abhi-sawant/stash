<?php
/**
 * POST /api/auth/resend-otp
 * Body: { "email": "user@example.com" }
 *
 * Resends an OTP to the email. Rate-limited to one request per minute.
 */

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'A valid email address is required']);
    exit;
}

$db = getDB();

// ─── Look up user (don't reveal whether the email exists) ─────────────────
$stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->bind_result($userId);
$found = $stmt->fetch();
$stmt->close();

if (!$found) {
    // Silent success — don't leak registered email information
    echo json_encode(['message' => 'If that email is registered, a new code has been sent.']);
    $db->close();
    exit;
}

// ─── Rate limit: max 1 OTP per minute ────────────────────────────────────
$stmt = $db->prepare('
    SELECT id FROM otps
    WHERE user_id = ?
      AND used = 0
      AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 MINUTE)
    LIMIT 1
');
$stmt->bind_param('i', $userId);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    http_response_code(429);
    echo json_encode(['error' => 'Please wait at least 1 minute before requesting another code.']);
    $stmt->close();
    $db->close();
    exit;
}
$stmt->close();

// ─── Invalidate old OTPs ──────────────────────────────────────────────────
$stmt = $db->prepare('UPDATE otps SET used = 1 WHERE user_id = ? AND used = 0');
$stmt->bind_param('i', $userId);
$stmt->execute();
$stmt->close();

// ─── Generate and store new OTP ───────────────────────────────────────────
$otp       = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$expiresAt = gmdate('Y-m-d H:i:s', time() + OTP_EXPIRY);

$stmt = $db->prepare('INSERT INTO otps (user_id, otp, expires_at) VALUES (?, ?, ?)');
$stmt->bind_param('iss', $userId, $otp, $expiresAt);
$stmt->execute();
$stmt->close();
$db->close();

sendOtpEmail($email, $otp);

echo json_encode(['message' => 'A new verification code has been sent to your email.']);
