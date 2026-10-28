<?php
// api/deductions.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../config/database.php';

$userId = requireAuthApi();
$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDbConnection();

    switch ($method) {
        case 'GET':
            $fy = $_GET['fy'] ?? '2024-2025';
            $stmt = $db->prepare("
                SELECT id, financial_year, section, amount, notes, created_at 
                FROM deductions 
                WHERE user_id = :uid AND financial_year = :fy 
                ORDER BY id DESC
            ");
            $stmt->execute([':uid' => $userId, ':fy' => $fy]);
            $records = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'data' => $records
            ]);
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            $section = trim($input['section'] ?? '');
            $amount = floatval($input['amount'] ?? 0);
            $fy = trim($input['financial_year'] ?? '2024-2025');
            $notes = trim($input['notes'] ?? '');

            if (empty($section) || $amount <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Valid section and positive amount are required.']);
                exit;
            }

            $stmt = $db->prepare("
                INSERT INTO deductions (user_id, financial_year, section, amount, notes) 
                VALUES (:uid, :fy, :sec, :amt, :notes)
            ");
            $stmt->execute([
                ':uid'   => $userId,
                ':fy'    => $fy,
                ':sec'   => $section,
                ':amt'   => $amount,
                ':notes' => $notes
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Deduction added successfully',
                'id' => (int)$db->lastInsertId()
            ]);
            break;

        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $id = (int)($input['id'] ?? 0);
            $section = trim($input['section'] ?? '');
            $amount = floatval($input['amount'] ?? 0);
            $fy = trim($input['financial_year'] ?? '2024-2025');
            $notes = trim($input['notes'] ?? '');

            if ($id <= 0 || empty($section) || $amount <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Valid ID, section, and positive amount are required.']);
                exit;
            }

            // Check ownership
            $check = $db->prepare("SELECT id FROM deductions WHERE id = :id AND user_id = :uid LIMIT 1");
            $check->execute([':id' => $id, ':uid' => $userId]);
            if (!$check->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Deduction record not found or access denied.']);
                exit;
            }

            $stmt = $db->prepare("
                UPDATE deductions 
                SET financial_year = :fy, section = :sec, amount = :amt, notes = :notes 
                WHERE id = :id AND user_id = :uid
            ");
            $stmt->execute([
                ':fy'    => $fy,
                ':sec'   => $section,
                ':amt'   => $amount,
                ':notes' => $notes,
                ':id'    => $id,
                ':uid'   => $userId
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Deduction updated successfully'
            ]);
            break;

        case 'DELETE':
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Valid ID required.']);
                exit;
            }

            $stmt = $db->prepare("DELETE FROM deductions WHERE id = :id AND user_id = :uid");
            $stmt->execute([':id' => $id, ':uid' => $userId]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Deduction removed.']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Record not found or access denied.']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
