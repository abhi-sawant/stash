<?php

require_once __DIR__ . '/config.php';

/**
 * Returns an open mysqli database connection.
 * Terminates with a 500 JSON response if the connection fails.
 */
function getDB(): mysqli
{
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed. Check your config.php credentials.']);
        exit;
    }

    $conn->set_charset('utf8mb4');
    return $conn;
}
