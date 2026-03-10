<?php

/**
 * Sets CORS headers so the mobile app can talk to this API from any origin.
 * Also handles preflight OPTIONS requests automatically.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Browsers and some HTTP clients send a preflight OPTIONS request before the
// real request. We just respond 200 OK and stop here.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
