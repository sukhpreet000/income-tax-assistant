<?php
// includes/auth_check.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function requireAuthPage() {
    if (empty($_SESSION['user_id'])) {
        header("Location: login.php");
        exit;
    }
}

function requireAuthApi() {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'authenticated' => false,
            'message' => 'Unauthorized: Please log in to access this resource.'
        ]);
        exit;
    }
    return (int)$_SESSION['user_id'];
}
