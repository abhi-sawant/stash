<?php
/**
 * POST /api/auth/register
 * Body: { "email": "user@example.com", "password": "mypassword" }
 *
 * Creates a new account and sends an OTP to the email for verification.
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

// ─── Validate input ────────────────────────────────────────────────────────
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter a valid email address']);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 8 characters long']);
    exit;
}

$db = getDB();

// ─── Check if email already exists ────────────────────────────────────────
$stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['error' => 'This email is already registered. Please sign in instead.']);
    $stmt->close();
    $db->close();
    exit;
}
$stmt->close();

// ─── Create the user ──────────────────────────────────────────────────────
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $db->prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
$stmt->bind_param('ss', $email, $passwordHash);
$stmt->execute();
$userId = (int)$stmt->insert_id;
$stmt->close();

// ─── Generate and store OTP ───────────────────────────────────────────────
$otp       = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$expiresAt = gmdate('Y-m-d H:i:s', time() + OTP_EXPIRY);

$stmt = $db->prepare('INSERT INTO otps (user_id, otp, expires_at) VALUES (?, ?, ?)');
$stmt->bind_param('iss', $userId, $otp, $expiresAt);
$stmt->execute();
$stmt->close();
$db->close();

// ─── Send OTP email ───────────────────────────────────────────────────────
sendOtpEmail($email, $otp);

http_response_code(201);
echo json_encode(['message' => 'Account created! Check your email for a 6-digit verification code.']);
