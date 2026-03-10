<?php
/**
 * POST /api/auth/login
 * Body: { "email": "user@example.com", "password": "mypassword" }
 *
 * Verifies credentials and sends a fresh OTP to the user's email.
 */

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input    = json_decode(file_get_contents('php://input'), true);
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit;
}

$db = getDB();

// ─── Find user and verify password ────────────────────────────────────────
$stmt = $db->prepare('SELECT id, password_hash FROM users WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->bind_result($userId, $passwordHash);
$found = $stmt->fetch();
$stmt->close();

// Use a constant-time compare to prevent timing attacks.
// We always call password_verify even if the user wasn't found (dummy hash).
$dummyHash = '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
if (!$found || !password_verify($password, $found ? $passwordHash : $dummyHash)) {
    http_response_code(401);
    echo json_encode(['error' => 'Incorrect email or password']);
    $db->close();
    exit;
}

// ─── Invalidate any existing unused OTPs ──────────────────────────────────
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

// ─── Send OTP email ───────────────────────────────────────────────────────
sendOtpEmail($email, $otp);

echo json_encode(['message' => 'Verification code sent! Check your email.']);
