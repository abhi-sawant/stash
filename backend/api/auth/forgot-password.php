<?php
/**
 * POST /api/auth/forgot-password
 * Body: { "email": "user@example.com" }
 *
 * Sends a password reset OTP to the given email if an account exists.
 * Always returns 200 so we don't leak whether an email is registered.
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
    echo json_encode(['error' => 'Please enter a valid email address']);
    exit;
}

$db = getDB();

// ─── Look up user (silently ignore if not found) ───────────────────────────
$stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->bind_result($userId);
$found = $stmt->fetch();
$stmt->close();

if ($found) {
    // Invalidate any existing unused OTPs for this user
    $stmt = $db->prepare('UPDATE otps SET used = 1 WHERE user_id = ? AND used = 0');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $stmt->close();

    // Generate and store new OTP
    $otp       = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = gmdate('Y-m-d H:i:s', time() + OTP_EXPIRY);

    $stmt = $db->prepare('INSERT INTO otps (user_id, otp, expires_at) VALUES (?, ?, ?)');
    $stmt->bind_param('iss', $userId, $otp, $expiresAt);
    $stmt->execute();
    $stmt->close();

    sendPasswordResetEmail($email, $otp);
}

$db->close();

// Always return 200 — don't reveal whether the email is registered
echo json_encode(['message' => 'If an account exists for this email, a reset code has been sent.']);
