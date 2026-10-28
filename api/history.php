<?php
// api/history.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../config/database.php';

$userId = requireAuthApi();
$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDbConnection();

    if ($method === 'GET') {
        $id = (int)($_GET['id'] ?? 0);

        if ($id > 0) {
            $stmt = $db->prepare("
                SELECT id, financial_year, gross_income, total_deductions_old, total_deductions_new,
                       taxable_income_old, taxable_income_new, net_tax_old, net_tax_new,
                       recommended_regime, calculation_details, created_at
                FROM tax_calculations
                WHERE id = :id AND user_id = :uid
                LIMIT 1
            ");
            $stmt->execute([':id' => $id, ':uid' => $userId]);
            $record = $stmt->fetch();

            if ($record) {
                $record['calculation_details'] = json_decode($record['calculation_details'], true);
                echo json_encode(['success' => true, 'data' => $record]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Record not found.']);
            }
            exit;
        }

        // List all history
        $stmt = $db->prepare("
            SELECT id, financial_year, gross_income, total_deductions_old, total_deductions_new,
                   taxable_income_old, taxable_income_new, net_tax_old, net_tax_new,
                   recommended_regime, created_at
            FROM tax_calculations
            WHERE user_id = :uid
            ORDER BY id DESC
        ");
        $stmt->execute([':uid' => $userId]);
        $list = $stmt->fetchAll();

        echo json_encode(['success' => true, 'data' => $list]);
        exit;
    }

    if ($method === 'DELETE') {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Valid ID required.']);
            exit;
        }

        $stmt = $db->prepare("DELETE FROM tax_calculations WHERE id = :id AND user_id = :uid");
        $stmt->execute([':id' => $id, ':uid' => $userId]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Calculation record deleted.']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Record not found.']);
        }
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
