<?php
// api/auth.php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) {
    if (!empty($_ENV['VERCEL']) || getenv('VERCEL') || !empty($_SERVER['VERCEL']) || !is_writable(session_save_path())) {
        @session_save_path(sys_get_temp_dir());
    }
    @session_start();
}

require_once __DIR__ . '/../config/database.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    $db = getDbConnection();

    switch ($action) {
        case 'login':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Method Not Allowed', 405);
            }
            $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            $email = trim($input['email'] ?? '');
            $password = $input['password'] ?? '';

            if (empty($email) || empty($password)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Please provide both email and password.']);
                exit;
            }

            $stmt = $db->prepare("SELECT id, name, email, password_hash, pan_number, dob, phone, default_fy FROM users WHERE email = :email LIMIT 1");
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($password, $user['password_hash'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Invalid email address or password.']);
                exit;
            }

            // Set session
            $_SESSION['user_id'] = (int)$user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_email'] = $user['email'];

            unset($user['password_hash']);
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => $user
            ]);
            break;

        case 'register':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Method Not Allowed', 405);
            }
            $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $pan = strtoupper(trim($input['pan_number'] ?? ''));
            $dob = trim($input['dob'] ?? '');
            $phone = trim($input['phone'] ?? '');
            $default_fy = trim($input['default_fy'] ?? '2024-2025');
            $password = $input['password'] ?? '';

            if (empty($name) || empty($email) || empty($pan) || empty($dob) || empty($password)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'All mandatory fields are required.']);
                exit;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
                exit;
            }

            // PAN check: 5 letters, 4 digits, 1 letter
            if (!preg_match('/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/', $pan)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).']);
                exit;
            }

            if (strlen($password) < 8) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long.']);
                exit;
            }

            // Check if email already exists
            $checkStmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
            $checkStmt->execute([':email' => $email]);
            if ($checkStmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'An account with this email address already exists.']);
                exit;
            }

            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
            $insertStmt = $db->prepare("
                INSERT INTO users (name, email, password_hash, pan_number, dob, phone, default_fy)
                VALUES (:name, :email, :password_hash, :pan, :dob, :phone, :default_fy)
            ");
            $insertStmt->execute([
                ':name'          => $name,
                ':email'         => $email,
                ':password_hash' => $passwordHash,
                ':pan'           => $pan,
                ':dob'           => $dob,
                ':phone'         => $phone,
                ':default_fy'    => $default_fy
            ]);

            $newUserId = (int)$db->lastInsertId();

            // Seed default checklist for the new user
            $seedItems = [
                ['Form 16 (Part A & Part B)', 'Employer salary certificate with TDS breakdown'],
                ['Form 26AS & AIS / TIS Statement', 'Download from Income Tax portal for TDS verification'],
                ['PAN Card & Aadhaar Linkage', 'Check status on e-Filing portal'],
                ['Bank Account Statements & Interest Certificates', 'Interest from savings & deposits for Section 80TTA/80TTB'],
                ['Section 80C Investment Receipts', 'EPF, PPF, ELSS, Life Insurance proofs'],
                ['Section 80D Medical Insurance Receipts', 'Health insurance premium receipt'],
                ['Housing Loan Interest Certificate (Sec 24b)', 'Issued by lender showing principal and interest split']
            ];

            $docStmt = $db->prepare("INSERT INTO documents (user_id, financial_year, doc_name, status, notes) VALUES (:uid, :fy, :name, 'pending', :notes)");
            foreach ($seedItems as $item) {
                $docStmt->execute([
                    ':uid'   => $newUserId,
                    ':fy'    => $default_fy,
                    ':name'  => $item[0],
                    ':notes' => $item[1]
                ]);
            }

            // Set session
            $_SESSION['user_id'] = $newUserId;
            $_SESSION['user_name'] = $name;
            $_SESSION['user_email'] = $email;

            echo json_encode([
                'success' => true,
                'message' => 'Registration successful',
                'user' => [
                    'id' => $newUserId,
                    'name' => $name,
                    'email' => $email,
                    'pan_number' => $pan,
                    'dob' => $dob,
                    'default_fy' => $default_fy
                ]
            ]);
            break;

        case 'check':
            if (!empty($_SESSION['user_id'])) {
                $stmt = $db->prepare("SELECT id, name, email, pan_number, dob, phone, default_fy FROM users WHERE id = :id LIMIT 1");
                $stmt->execute([':id' => $_SESSION['user_id']]);
                $user = $stmt->fetch();
                if ($user) {
                    echo json_encode(['authenticated' => true, 'user' => $user]);
                    exit;
                }
            }
            echo json_encode(['authenticated' => false]);
            break;

        case 'logout':
            $_SESSION = [];
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000,
                    $params["path"], $params["domain"],
                    $params["secure"], $params["httponly"]
                );
            }
            session_destroy();
            echo json_encode(['success' => true, 'message' => 'Logged out successfully.']);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
