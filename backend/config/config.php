<?php

// ─── Database ──────────────────────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_USER', 'YOUR_DB_USERNAME');    // e.g. cpanelusername_stash
define('DB_PASS', 'YOUR_DB_PASSWORD');    // the password you set in cPanel
define('DB_NAME', 'YOUR_DB_NAME');        // e.g. cpanelusername_stashdb

// ─── JWT ───────────────────────────────────────────────────────────────────
// IMPORTANT: Change this to a long random string. Keep it secret. Never share it.
// Generate one at: https://generate-secret.vercel.app/64
define('JWT_SECRET', 'CHANGE_THIS_TO_A_RANDOM_64_CHARACTER_STRING_KEEP_IT_SECRET');
define('JWT_EXPIRY', 60 * 60 * 24 * 30); // 30 days in seconds

// ─── OTP ───────────────────────────────────────────────────────────────────
define('OTP_EXPIRY', 10 * 60); // 10 minutes in seconds

// ─── Email ─────────────────────────────────────────────────────────────────
define('APP_NAME', 'Stash');
define('FROM_EMAIL', 'noreply@yourdomain.com'); // Use your actual domain email
define('FROM_NAME', 'Stash App');

// ─── Backup ────────────────────────────────────────────────────────────────
define('MAX_BACKUPS_PER_USER', 5);   // Keep the 5 most recent backups per user
define('MAX_BACKUP_SIZE_MB', 10);    // Maximum backup size in megabytes
