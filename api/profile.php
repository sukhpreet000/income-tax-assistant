<?php
// api/profile.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../config/database.php';

$userId = requireAuthApi();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $db = getDbConnection();

    if ($method === 'GET') {
        $stmt = $db->prepare("SELECT id, name, email, pan_number, dob, phone, default_fy, created_at FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch();

        if ($user) {
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User profile not found.']);
        }
        exit;
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

        if ($action === 'update_details') {
            $name = trim($input['name'] ?? '');
            $pan = strtoupper(trim($input['pan_number'] ?? ''));
            $dob = trim($input['dob'] ?? '');
            $phone = trim($input['phone'] ?? '');
            $default_fy = trim($input['default_fy'] ?? '2024-2025');

            if (empty($name) || empty($pan) || empty($dob)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Name, PAN, and Date of Birth are mandatory.']);
                exit;
            }

            if (!preg_match('/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/', $pan)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid PAN format.']);
                exit;
            }

            $stmt = $db->prepare("
                UPDATE users 
                SET name = :name, pan_number = :pan, dob = :dob, phone = :phone, default_fy = :fy 
                WHERE id = :id
            ");
            $stmt->execute([
                ':name'  => $name,
                ':pan'   => $pan,
                ':dob'   => $dob,
                ':phone' => $phone,
                ':fy'    => $default_fy,
                ':id'    => $userId
            ]);

            $_SESSION['user_name'] = $name;

            echo json_encode(['success' => true, 'message' => 'Profile details updated successfully.']);
            exit;
        }

        if ($action === 'change_password') {
            $current = $input['current_password'] ?? '';
            $new = $input['new_password'] ?? '';

            if (empty($current) || empty($new)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Both current and new passwords are required.']);
                exit;
            }

            if (strlen($new) < 8) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'New password must be at least 8 characters.']);
                exit;
            }

            $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $userId]);
            $row = $stmt->fetch();

            if (!$row || !password_verify($current, $row['password_hash'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Current password is incorrect.']);
                exit;
            }

            $newHash = password_hash($new, PASSWORD_BCRYPT);
            $upd = $db->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");
            $upd->execute([':hash' => $newHash, ':id' => $userId]);

            echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);
            exit;
        }

        if ($action === 'reset_data') {
            // Delete all user financial records
            $db->prepare("DELETE FROM income_details WHERE user_id = :uid")->execute([':uid' => $userId]);
            $db->prepare("DELETE FROM deductions WHERE user_id = :uid")->execute([':uid' => $userId]);
            $db->prepare("DELETE FROM documents WHERE user_id = :uid")->execute([':uid' => $userId]);
            $db->prepare("DELETE FROM tax_calculations WHERE user_id = :uid")->execute([':uid' => $userId]);

            echo json_encode(['success' => true, 'message' => 'All user financial data reset successfully.']);
            exit;
        }
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
