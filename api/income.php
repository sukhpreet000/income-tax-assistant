<?php
// api/income.php
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
                SELECT id, financial_year, category, subcategory, amount, description, created_at 
                FROM income_details 
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
            $category = trim($input['category'] ?? '');
            $subcategory = trim($input['subcategory'] ?? '');
            $amount = floatval($input['amount'] ?? 0);
            $fy = trim($input['financial_year'] ?? '2024-2025');
            $desc = trim($input['description'] ?? '');

            if (empty($category) || $amount <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Valid category and positive amount are required.']);
                exit;
            }

            $stmt = $db->prepare("
                INSERT INTO income_details (user_id, financial_year, category, subcategory, amount, description) 
                VALUES (:uid, :fy, :cat, :sub, :amt, :desc)
            ");
            $stmt->execute([
                ':uid'  => $userId,
                ':fy'   => $fy,
                ':cat'  => $category,
                ':sub'  => $subcategory,
                ':amt'  => $amount,
                ':desc' => $desc
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Income record created successfully',
                'id' => (int)$db->lastInsertId()
            ]);
            break;

        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $id = (int)($input['id'] ?? 0);
            $category = trim($input['category'] ?? '');
            $subcategory = trim($input['subcategory'] ?? '');
            $amount = floatval($input['amount'] ?? 0);
            $fy = trim($input['financial_year'] ?? '2024-2025');
            $desc = trim($input['description'] ?? '');

            if ($id <= 0 || empty($category) || $amount <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Valid ID, category, and positive amount are required.']);
                exit;
            }

            // Verify ownership
            $check = $db->prepare("SELECT id FROM income_details WHERE id = :id AND user_id = :uid LIMIT 1");
            $check->execute([':id' => $id, ':uid' => $userId]);
            if (!$check->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Income record not found or access denied.']);
                exit;
            }

            $stmt = $db->prepare("
                UPDATE income_details 
                SET financial_year = :fy, category = :cat, subcategory = :sub, amount = :amt, description = :desc 
                WHERE id = :id AND user_id = :uid
            ");
            $stmt->execute([
                ':fy'   => $fy,
                ':cat'  => $category,
                ':sub'  => $subcategory,
                ':amt'  => $amount,
                ':desc' => $desc,
                ':id'   => $id,
                ':uid'  => $userId
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Income record updated successfully'
            ]);
            break;

        case 'DELETE':
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Valid ID required.']);
                exit;
            }

            $stmt = $db->prepare("DELETE FROM income_details WHERE id = :id AND user_id = :uid");
            $stmt->execute([':id' => $id, ':uid' => $userId]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Income entry deleted.']);
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
