<?php

require_once __DIR__ . '/../config/config.php';

/**
 * Sends a 6-digit OTP verification email to the user.
 * Uses PHP's built-in mail() function which works on most shared hosting.
 *
 * @param string $toEmail  The recipient's email address
 * @param string $otp      The 6-digit OTP code
 * @return bool            True if mail was accepted for delivery, false otherwise
 */
function sendOtpEmail(string $toEmail, string $otp): bool
{
    $subject = APP_NAME . ' — Your verification code';

    $body  = "Hi,\n\n";
    $body .= "Your verification code for " . APP_NAME . " is:\n\n";
    $body .= "  $otp\n\n";
    $body .= "This code is valid for 10 minutes.\n\n";
    $body .= "If you did not request this, you can safely ignore this email.\n\n";
    $body .= "— The " . APP_NAME . " Team";

    $headers  = "From: " . FROM_NAME . " <" . FROM_EMAIL . ">\r\n";
    $headers .= "Reply-To: " . FROM_EMAIL . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    return mail($toEmail, $subject, $body, $headers);
}
