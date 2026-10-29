<?php
// includes/auth_check.php
if (session_status() === PHP_SESSION_NONE) {
    if (!empty($_ENV['VERCEL']) || getenv('VERCEL') || !empty($_SERVER['VERCEL']) || !is_writable(session_save_path())) {
        @session_save_path(sys_get_temp_dir());
    }
    @session_start();
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
